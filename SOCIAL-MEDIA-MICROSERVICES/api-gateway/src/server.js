require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const {rateLimit} = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const logger = require('./utils/logger.js')
const proxy = require('express-http-proxy')
const errorHandler = require('./middlewares/errorHandler.js')
const app= express()
const PORT = process.env.PORT

const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

const rateLimiter = rateLimit({
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

app.use(rateLimiter)

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url} `);
  logger.info(`Request body ${req.body}`);
  next();
});

//api-gateway -> localhost:3000:/v1/auth/regitser

/* -->redirecting using Proxy */
//identity-services -> localhost:3000:/api/auth/register

const proxyOption = {
  proxyReqPathResolver : (req)=>{
    return req.originalUrl.replace(/^\/v1/,"/api")
  },
  proxyErrorHandler: (err, res, next)=>{
    logger.error(`Proxy error: ${err.message}`)
    res.status(500).json({
      success:false,
      message:`Internal server error`,
       error: err.message
    })
  }
} 

//setting up proxy for our identity services

app.use('/v1/auth', proxy(process.env.INDENTITY_SERVICE_URL, {
 ...proxyOption,
  proxyReqOptDecorator: (proxyReqOps, srcReq) => {
    proxyReqOps.headers["Content-Type"] = "application/json";
    return proxyReqOps;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response received from identity service: ${proxyRes.statusCode}`);
    return proxyResData;
  }
}))


app.use(errorHandler)

app.listen(PORT, ()=>{
  logger.info(`API Gateway is running on port : ${PORT}`)
  logger.info(`Identity service is running on port : ${process.env.INDENTITY_SERVICE_URL}`)
  logger.info(`Redis URL : ${process.env.REDIS_URL}`)
})