const Search = require("../models/searchPost.js");
const logger = require("../utils/logger.js");

//implement caching here for 2 to 5 min
const searchPostController = async (req, res) => {
      logger.info("Search endpoint hit!");
      try {
            const { query } = req.query;

            const cachedKey = `search:${query}`
            const cachedSearch = await req.redisClient.get(cachedKey)

            if (cachedSearch) {
                  return res.json(JSON.parse(cachedSearch))
            }

            const results = await Search.find(
                  {
                        $text: { $search: query },
                  },
                  {
                        score: { $meta: "textScore" },
                  }
            )
                  .sort({ score: { $meta: "textScore" } })
                  .limit(10);

            res.json(results);

            if(!results){
                  return res.status(404).json({
                        success:false,
                        messgae:"Searched post not found"
                  })
            }
            await req.redisClient.setex(cachedKey, 3600, JSON.stringify(results.content))

      } catch (e) {
            logger.error("Error while searching post", e);
            res.status(500).json({
                  success: false,
                  message: "Error while searching post",
            });
      }
};

module.exports = { searchPostController }