const Media = require("../models/Media");
const { deleteFromCloudinary } = require("../utils/cloudinary");
const logger = require('../utils/logger.js')
const handlePostDeleted = async (event)=>{
      console.log(event, "eventeventevent");
      const {postId , mediaId} = event
      try {
            const mediaDelete = await Media.find({_id: {$in: mediaId}})

            for(const media of mediaDelete){
                  await deleteFromCloudinary(media.publicId)
                  await Media.findByIdAndDelete(media._id)

                  logger.info(`Deletd media ${media._id} assosciated with this post id:${postId}`)
                  logger.info(`Process deletion of media for post id ${postId}`)
            }
      } catch (error) {
            logger.error(e,"Error occured while deletion")
      }
}

module.exports = {handlePostDeleted}