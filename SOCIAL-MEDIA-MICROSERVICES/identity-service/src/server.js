const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const logger = require("./utils/logger.js");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service.js");
const errorHandler = require("./middlewares/errorHandler.js");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info(`MongoDB Connected successfully`))
  .catch((err) => logger.error(`MongoDB connection error:`, err));

const redisClient = new Redis(process.env.REDIS_URL);

const app = express();
const PORT = process.env.PORT || 3001;
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url} `);
  logger.info(`Request body ${req.body}`);
  next();
});

//DDOS Protection
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10, //10 req
  duration: 5, //1 sec
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

//apply endpoint ratelimiting to our routes
app.use("/api/auth/register", endPointRateLimiter);

//Routes
app.use("/api/auth/", routes);

//Error handler

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity service running on port: http://localhost:${PORT}`);
});

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled regection at ", promise, "reason:", reason);
});
