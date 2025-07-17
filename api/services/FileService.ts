import Prisma from '../prisma'
import * as StrUtils from '../utils/StrUtils'

import axios from 'axios'
import sharp from 'sharp'
import datefns from 'date-fns'
import lodash from 'lodash'
import { promises as fs } from 'fs'

async function getCurrentFolder() {
	const day = datefns.getDayOfYear(new Date()).toString()
	const folder = ['D', lodash.padStart(day, 3, '0')].join('')
	const path = ['files', folder].join('/')
	await fs.mkdir(path, { recursive: true })
	return folder
}

// Upload file
export async function upload(file: any) {
	const folder = await getCurrentFolder()
	const name = [StrUtils.uuid(), 'jpeg'].join('.')
	const path = ['files', folder, name].join('/')
	await sharp(file.buffer).withMetadata().jpeg().toFile(path)
	const image = await Prisma.image.create({ data: { folder, name } })
	return image
}

// Upload file from link
export async function uploadFromLink(link: string) {
	const folder = await getCurrentFolder()
	const name = [StrUtils.uuid(), 'jpeg'].join('.')
	const path = ['files', folder, name].join('/')
	const response = await axios.get(link, { responseType: 'arraybuffer' })
	await sharp(response.data).withMetadata().jpeg().toFile(path)
	const image = await Prisma.image.create({ data: { folder, name } })
	return image
}

// Access file
export async function access(name: string) {
	const image = await Prisma.image.findUnique({ where: { name } })
	if (!image) throw new Error('File not found')
	const path = [process.cwd(), 'files', image.folder, image.name].join('/')
	return { path, image }
}
