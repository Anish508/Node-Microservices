const express = require('express')
const multer = require('multer')

const {uploadMedia} = require('../controller/mediaController.js')
const authenticatedRequest = require('../middleware/authMiddleware.js')
const logger = require('../utils/logger.js')

const router = express.Router()


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
}).single('file')

router.post('/upload', authenticatedRequest,  (req,res,next)=>{
    upload(req, res , function(err){
        if(err instanceof multer.MulterError){
            logger.error("Multer error while uploading", err)
            return res.status(400).json({
                message: "Multer error while uploading",
                error: err.message,
                stack: err.stack
            })
        }else if(err){
            logger.error("Some unkown error occured", err)
            return res.status(500).json({
                message: "Some unkown error occured",
                error: err.message,
                stack: err.stack
            })
        }

        if(!req.file){
            return res.status(400).json({
                message: 'No file Found',
            })
        }
        next()
    })
}, uploadMedia)


module.exports = router