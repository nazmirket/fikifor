import dotenv from 'dotenv'
dotenv.config()

import Prisma from './prisma'

import express from 'express'
import cors from 'cors'

// Routers
import AuthRouter from './routes/v1/auth'
import FileRouter from './routes/v1/files'
import QuizRouter from './routes/v1/quizes'
import SessionRouter from './routes/v1/sessions'

// Error Middleware
import ErrorMd from './middleware/error'

async function start() {
	// connect to db
	await Prisma.$connect()

	// init app
	const app = express()

	// set trust proxy
	app.set('trust proxy', true)

	// set CORS
	app.use(cors())

	// set express options
	app.use(express.urlencoded({ extended: true }))
	app.use(express.json())

	// register routers
	app.use('/api/v1/auth', AuthRouter)
	app.use('/api/v1/files', FileRouter)
	app.use('/api/v1/quizes', QuizRouter)
	app.use('/api/v1/sessions', SessionRouter)

	// use custom error handler
	app.use(ErrorMd)

	// get port
	const port = parseInt((process.env.DEFAULT_PORT || process.env.PORT) as string)

	// start app
	app.listen(port, () => console.log('Api is running on port:', port))
}

start()
