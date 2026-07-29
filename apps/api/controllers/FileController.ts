import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import AsyncMd from '../middleware/async'
import * as FileService from '../services/FileService'
import { stringParam } from '../utils/request'

// Access File
export const access = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const name = stringParam(req, 'name')
	const { path } = await FileService.access(name)
	res.status(200).sendFile(path)
})
