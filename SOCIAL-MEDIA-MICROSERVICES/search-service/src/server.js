require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middlewares/errorHandler.js");
const logger = require("./utils/logger.js");
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitMQ.js')
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const searchRoutes = require('./routes/searchRoutes.js');
const {handleSearchPostCreated, handlePostDeleted} = require('./eventHandler/search-event-handler.js');
const app = express();
const PORT = process.env.PORT || 3004;

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

const rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "middleware",
      points: 50, //10 req
      duration: 5, //5 sec
});

app.use((req, res, next) => {
      rateLimiter
            .consume(req.ip)
            .then(() => next())
            .catch(() => {
                  logger.warn(`Rate limit exceeded for IP : ${req.ip}`);
                  res.status(429).json({
                        success: false,
                        message: "too many requests",
                  });
            });
});

//restricting user by using IP based ratelimiter
const endPointRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, //15 mins
      limit: 50,
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

app.use("/api/search/posts", endPointRateLimiter);

//routes -- pass redis client to the route
app.use("/api/search", (req, res, next) => {
      req.redisClient = redisClient
      next()
}, searchRoutes);



app.use(errorHandler)


async function startServer() {
      try {
            connectToRabbitMQ()

            //consume or subscribe to the event

            await consumeEvent('post.created', handleSearchPostCreated)
            await consumeEvent('post.deleted', handlePostDeleted)

            app.listen(PORT, () => {
                  logger.info(`Search service running on port: http://localhost || connceted to rabbitMQ:${PORT}`);
            });
      } catch (error) {
            logger.error("Failed to start search service")
            process.exit(1)
      }
}

startServer()

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at ", promise, "reason:", reason);
});
