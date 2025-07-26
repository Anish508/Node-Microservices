const logger = require('../utils/logger.js')
async function invalidatePostCache(req) {
  try {
    const keys = await req.redisClient.keys("search:*");
    if (keys.length > 0) {
      await req.redisClient.del(keys);
      console.log(`Deleted ${keys.length} cache entries.`);
    }
  } catch (error) {
    console.error("Failed to invalidate Redis cache:", error);
  }
}

module.exports = {invalidatePostCache}