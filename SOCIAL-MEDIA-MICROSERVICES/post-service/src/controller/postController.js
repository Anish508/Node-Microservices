const logger = require("../utils/logger.js");
const Post = require("../models/Posts.js");

async function invalidatePostCache(req, input) {
  const keys = await req.redisClient.keys("posts:*")
  if(keys.length > 0){
    await req.redisClient.del(keys)
  }
}

const createPost = async (req, res) => {
  try {
    const { mediaIds, content } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    await invalidatePostCache(req, newlyCreatedPost._id.toString())
    logger.info("Post created successfully");
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
    logger.info(`Post created by user: ${req.user.userId}`);
  } catch (error) {
    logger.error("Error while creating a post", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while post creation",
    });
  }
};
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}: ${limit}`;
    const cachePosts = await req.redisClient.get(cacheKey);

    if (cachePosts) {
      return res.json(JSON.parse(cachePosts));
    }
    const posts = await Post.find({})
      .sort({ createPost: -1 })
      .skip(startIndex)
      .limit(limit);

      const totalNoOfPosts = await Post.countDocuments()

      const result = {
        posts,
        currentPage: page,
        totalPages: Math.ceil(totalNoOfPosts / limit),
        totalPosts: totalNoOfPosts
      }

      //saving post in redis client

      await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));


      res.json(result)
  } catch (error) {
    logger.error("Error while fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while fetching posts",
    });
  }
};
const getSinglePost = async (req, res) => {
  try {
  } catch (error) {
    logger.error("Error while fetching individual post", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while fetching individual post",
    });
  }
};
const deletePost = async (req, res) => {
  try {
  } catch (error) {
    logger.error("Error while deleting post", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while deletin gpost",
    });
  }
};

module.exports = { createPost, getAllPosts, getSinglePost, deletePost };
