const Media = require('../models/Media')
const uploadMediaTCoCLoudinary = require('../utils/cloudinary.js')
const logger = require('../utils/logger.js')

const uploadMedia = async(req, res)=>{
  logger.info("upload media endpoint hit")
  try {
    if(!req.file){
      logger.error("No file found please add a file and retry!")
      return res.status(400).json({
        success: false,
        message:"File not found!"
      })
    }
    const {originalname, mimetype, buffer} = req.file
    
    logger.info(`File details: name:${originalname}- type:${mimetype}`)
    logger.info("uploading to cloudinary starting......")

    const cloudinaryUploadresult = await uploadMediaTCoCLoudinary(req.file)
    logger.info(`Cloudinary upload successfull. Public Id: - ${cloudinaryUploadresult.public_id}`)

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadresult.public_id,
      originalName: originalname,
      mimeType:mimetype,
      url: cloudinaryUploadresult.secure_url,
      userId: req.user.userId
    })
    await newlyCreatedMedia.save()

    res.status(201).json({
      success: true,
      message:"Media uploaded successfully",
      MediaId : newlyCreatedMedia._id,
      url : newlyCreatedMedia.url,
      userId: req.user.userId
    })
  } catch (error) {
     logger.error("Error while Uploading a media ", error);
    res.status(500).json({
      success: false,
      message: "Problem arised while Uploading a media ",
    });
  }
}

module.exports = {uploadMedia}