import multer from 'multer'

const storage = multer.memoryStorage()

const defaults = { storage }

export default {
	// MULTIPLE
	multiple: (maxFiles = 20, size = 1) =>
		multer({
			...defaults,
			limits: {
				fileSize: size * 1000000, // default 1 mb
			},
		}).array('files', maxFiles),

	// SINGLE
	single: (size = 1) =>
		multer({
			...defaults,
			limits: {
				fileSize: size * 1000000, // default 1 mb
			},
		}).single('file'),
}
