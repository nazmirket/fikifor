import { basename, dirname } from 'node:path'

import ApiReq from 'ApiReq'
import ApiRes from 'ApiRes'

import AsyncMd from '../middleware/async'
import * as FileService from '../services/FileService'
import { stringParam } from '../utils/request'

// Access File
export const access = AsyncMd(async (req: ApiReq, res: ApiRes) => {
	const name = stringParam(req, 'name')
	const width = Number(req.query.width)
	const { path, isPublic } = await FileService.access(name, req.userId)
	const optimizedPath = await FileService.optimized(path, width)
	if (!isPublic) res.vary('Authorization')
	res.set(
		'Cache-Control',
		isPublic ? 'public, max-age=86400, immutable' : 'private, max-age=86400, immutable',
	)
	// Absolute paths in hidden worktrees trip sendFile's dotfile guard.
	res.status(200).sendFile(basename(optimizedPath), { root: dirname(optimizedPath) })
})
