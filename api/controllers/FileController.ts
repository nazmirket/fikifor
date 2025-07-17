import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import AsyncMd from '../middleware/async'
import * as FileService from '../services/FileService'

// Access File
export const access = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	console.log('FileController.access', req.params)
	const name = req.params.name
	const { path } = await FileService.access(name)
	res.status(200).sendFile(path)
})
