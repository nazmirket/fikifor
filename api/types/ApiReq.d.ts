import { Request } from 'express'

export default interface ApiReq extends Request {
	username?: any
	userId?: int
}
