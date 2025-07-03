const express = require('mongoose')
const connectDB  = require('./database/db.js')
const helmet = require('helmet')
const cors = require('cors')

connectDB()

const app = express()

app.use()