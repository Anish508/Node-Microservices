const logger = require('../utils/logger.js');
const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn("Access without valid token");
    return res.status(401).json({
      message: "Authentication required",
      success: false
    });
  }

  jwt.verify(token, process.env.JWT_SCECRET, (err, user) => {
    if (err) {
      logger.warn("Invalid token");
      return res.status(403).json({
        message: "Invalid token",
        success: false
      });
    }

    logger.info(`Decoded user: ${JSON.stringify(user)}`);
    req.user = user;
    next();
  });
};

module.exports = validateToken;
