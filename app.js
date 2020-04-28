const logger = require('./utils/logger')
const config = require('./utils/config')
const mongoose = require('mongoose')
const cors = require('cors')
const express = require('express')
const app = express()
const notesRouter = require('./controllers/notes')
const middleware = require('./utils/middleware')


logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology: true })
  .then(() => logger.info('connected to MongoDB'))
  .catch(error => logger.error('error connecting to MongoDB', error.message))

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/notes', notesRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
