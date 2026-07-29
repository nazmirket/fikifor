import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'
import { NextFunction } from 'express'

type AsyncHandler = (req: ApiReq, res: ApiRes, next: NextFunction) => unknown

export default function (f: AsyncHandler) {
	return function (req: ApiReq, res: ApiRes, next: NextFunction) {
		return Promise.resolve(f(req, res, next)).catch(next)
	}
}
