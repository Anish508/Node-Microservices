const joi = require('joi')

const validateContent =(data)=>{
  const schema = joi.object({
    content: joi.string().min(5).max(150).required(),
    mediaIds: joi.array(),
  })
  return schema.validate(data)
}
module.exports = {validateContent}