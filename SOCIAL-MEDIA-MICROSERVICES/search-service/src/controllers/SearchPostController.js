const Search = require("../models/searchPost.js")


const SearchController =  async(req, res)=>{
      try {
            const {query} = req.query

            const result = await Search.find({
                  $text  :{$search: query}
            },{
                  score : {$meta: 'textScore'}
            }).sort({score:{$meta: 'textScore'} }).limit(10)

            return res.json(result)
      } catch (error) {
            logger.warn("Error while seraching Post")
            res.status(400).json({
                  success:false,
                  message:"Error while seraching Post"
            })
      }
}

module.exports = {SearchController}