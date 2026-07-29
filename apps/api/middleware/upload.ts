import multer from 'multer'
import { badRequest } from '../utils/AppError'

const storage = multer.memoryStorage()

const defaults = {
	storage,
	fileFilter: (
		_req: Express.Request,
		file: Express.Multer.File,
		callback: multer.FileFilterCallback,
	) => {
		if (!file.mimetype.startsWith('image/')) {
			return callback(badRequest('Only image uploads are allowed'))
		}
		return callback(null, true)
	},
}

export default {
	// MULTIPLE
	multiple: (maxFiles = 20, size = 1) =>
		multer({
			...defaults,
			limits: {
				fileSize: size * 1_000_000,
				files: maxFiles,
			},
		}).array('files', maxFiles),

	// SINGLE
	single: (size = 1) =>
		multer({
			...defaults,
			limits: {
				fileSize: size * 1_000_000,
				files: 1,
			},
		}).single('file'),
}
