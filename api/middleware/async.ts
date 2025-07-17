import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'
import { NextFunction } from 'express'

export default function (f: Function): any {
	return function (req: ApiReq, res: ApiRes, next?: NextFunction) {
		return Promise.resolve(f(req, res, next)).catch(next)
	}
}
