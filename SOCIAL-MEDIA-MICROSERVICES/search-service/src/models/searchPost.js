const mongoose = require('mongoose')
const logger = require('logger')
const { required } = require('joi')


const searchPostSchema = mongoose.Schema({
      postId: {
            type: String,
            required: true,
            unique: true
      },
      userId: {
            type: String,
            required: true,
      },
      content: {
            type: String,
            required: true,

      },
      createdAt: {
            type: Date,
            required: true
      }
},
      { timestamps: true }
)

searchPostSchema.index({content:'text'})
searchPostSchema.index({createdAt:-1})

const Search = mongoose.model('Search', searchPostSchema)

module.exports = Search