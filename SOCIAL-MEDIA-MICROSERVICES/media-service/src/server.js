require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require("./routes/media-routes.js");
const errorHandler = require("./middleware/errorHandler.js");
const logger = require("./utils/logger.js");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitMQ.js');
const { handlePostDeleted } = require('./eventHandlers/mediaEventHandlers.js');

const app = express();
const PORT = process.env.PORT || 3003;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info(`MongoDB Connected successfully`))
  .catch((err) => logger.error(`MongoDB connection error:`, err));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url} `);
  logger.info(`Request body ${JSON.stringify(req.body)}`);
  next();
});

//restricting user by using IP based ratelimiter
const endPointRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 mins
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive enp point  rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/media/upload", endPointRateLimiter);

app.use('/api/media',mediaRoutes )

app.use(errorHandler)

async function startServer() {
  try {
    await connectToRabbitMQ()

    await consumeEvent('post.deleted', handlePostDeleted)
    app.listen(PORT, () => {
    logger.info(`Media service is running on port: http://localhost:${PORT}`);
});

  } catch (error) {
    logger.error('Failed to connect server', error)
    process.exit(1)
  }
}

startServer()


//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled regection at ", promise, "reason:", reason);
});
