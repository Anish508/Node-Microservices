require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-route.js");
const errorHandler = require("./middleware/errorHandler.js");
const logger = require("./utils/logger.js");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { ensureIndexes } = require("./models/Posts.js");
const app = express();
const PORT = process.env.PORT || 3002;

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

const endPointRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 mins
  limit: 100,
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

app.use("/api/posts/create-post", endPointRateLimiter);

//routes -- pass redis client to the route
app.use("/api/posts", (req, res, next) => {
  req.redisClient = redisClient
  next()
}, postRoutes);

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Identity service running on port: http://localhost:${PORT}`);
});

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled regection at ", promise, "reason:", reason);
});
