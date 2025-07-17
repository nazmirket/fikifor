import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import { ErrorRequestHandler, NextFunction } from 'express'

function handleErr(err: Error, req: ApiReq, res: ApiRes, next: NextFunction) {
	if (process.env.NODE_ENV === 'development') console.log(err)

	// init error message
	let message = err.message

	// send response
	res.status(500).json({
		success: false,
		error: message || 'Server Error',
	})
}

export default handleErr as ErrorRequestHandler
