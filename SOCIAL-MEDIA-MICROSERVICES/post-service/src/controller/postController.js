const logger = require('../utils/logger.js')
const Post = require('../models/Posts.js')

const createPost = async(req, res)=>{
  try {
    const {mediaIds, content} = req.body;
    const newlyCreatedPost = new Post({
    user: req.user.userId,
    content,
    mediaIds: mediaIds || []
    })
    await newlyCreatedPost.save();
    logger.info("Post created successfully")
    res.status(201).json({
      message: true,
      message:"Post created successfully"
    })
  } catch (error) {
    logger.error("Error while creating a post", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while post creation",
    });
  }
}
const getAllPosts = async(req, res)=>{
  try {
    
  } catch (error) {
    logger.error("Error while fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while fetching posts",
    });
  }
}
const getSinglePost = async(req, res)=>{
  try {
    
  } catch (error) {
    logger.error("Error while fetching individual post", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while fetching individual post",
    });
  }
}
const deletePost = async(req, res)=>{
  try {
    
  } catch (error) {
    logger.error("Error while deleting post", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while deletin gpost",
    });
  }
}

module.exports = {createPost, getAllPosts, getSinglePost, deletePost}
