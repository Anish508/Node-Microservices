
const Search = require('../models/searchPost.js')
const logger = require('../utils/logger.js')



async function handleSearchPostCreated(event,req) {
      try {
             logger.info("handleSearchPostCreated triggered with event:", event);

            const newSearchPost = new Search({
                  postId: event.postId,
                  userId: event.userId,
                  content: event.content,
                  createdAt : event.createdAt
            })

            await newSearchPost.save()

            logger.info(`New search post created for post ${event.postId} : ${newSearchPost._id.toString()}`)
      } catch (error) {
            logger.error("Error handling post creation event ", error)
      }
}

async function handlePostDeleted(event) {
      try {
            if (!event || !event.postId) {
                  logger.warn("Post deletion event missing postId:", event);
                  return;
            }

            const deletedPost = await Search.findOneAndDelete({ postId: event.postId });

            if (deletedPost) {
                  logger.info(`Search post deleted successfully: ${event.postId}`);
            } else {
                  logger.warn(`No search post found to delete for postId: ${event.postId}`);
            }

      } catch (error) {
            logger.error("Error handling post deletion event", error);
      }
}

module.exports = {handleSearchPostCreated, handlePostDeleted}