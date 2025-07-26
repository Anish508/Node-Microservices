const logger = require("../utils/logger.js");
const Post = require("../models/Posts.js");
const {validateContent} = require('../utils/validation.js');
const { publishEvent } = require("../utils/rabbitMQ.js");

async function invalidatePostCache(req, input) {
  const cachedKey = `post${input}`
  await req.redisClient.del(cachedKey)
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  try {
    const { error } = validateContent(req.body);
        if (error) {
          logger.warn("validation error", error.details[0].message);
          return res.status(400).json({
            success: false,
            message: error.details[0].message,
          });
        }

    const { mediaIds, content } = req.body;
    
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();

    await publishEvent('post.created',{
      postId: newlyCreatedPost._id.toString(),
      userId : newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt: newlyCreatedPost.createdAt

    })
    await invalidatePostCache(req, newlyCreatedPost._id.toString());
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

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };

    //saving post in redis client

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
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
    const postId = req.params.id;

    const cacheKey = `post:${postId}`;
    const cachePosts = await req.redisClient.get(cacheKey);

    if (cachePosts) {
      return res.json(JSON.parse(cachePosts));
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(403).json({
        success: false,
        message: "Post not found please varify id",
      });
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(post));
    res.status(200).json({
      success: true,
      message: "Single post fetched successfully",
    });
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
    const deleteId = req.params.id;

    // Correct method: findOneAndDelete for conditional deletion
    const deletedPost = await Post.findOneAndDelete({
      _id: deleteId,
      user: req.user.userId
    });

    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not authorized to delete it",
      });
    }

    await invalidatePostCache(req, deleteId);

    //publish post delete method--
    await publishEvent('post.deleted', {
      postId: deletedPost._id.toString(),
      userId : req.user.userId,
      mediaId : deletedPost.mediaIds
    })
    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: deletedPost
    });
  } catch (error) {
    logger.error("Error while deleting post", error);
    return res.status(500).json({
      success: false,
      message: "Problem occurred while deleting post",
    });
  }
};


module.exports = { createPost, getAllPosts, getSinglePost, deletePost };
