import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import AsyncMd from '../middleware/async'
import * as FileService from '../services/FileService'
import { stringParam } from '../utils/request'

// Access File
export const access = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const name = stringParam(req, 'name')
	const { path, isPublic } = await FileService.access(name, req.userId)
	res.set(
		'Cache-Control',
		isPublic ? 'public, max-age=86400, immutable' : 'private, no-store',
	)
	res.status(200).sendFile(path)
})
