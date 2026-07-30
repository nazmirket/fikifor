import { promises as dns } from 'node:dns'
import { promises as fs } from 'node:fs'
import { isIP } from 'node:net'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import type { Image } from '@prisma/client'
import sharp from 'sharp'
import { Agent, fetch } from 'undici'

import { env } from '../config/env'
import Prisma from '../prisma'
import { AppError, badRequest, notFound } from '../utils/AppError'
import { logger } from '../utils/logger'

const storageRoot = path.resolve(process.cwd(), 'files')
const maxInputPixels = 40_000_000

function currentFolder() {
	const now = new Date()
	const start = Date.UTC(now.getUTCFullYear(), 0, 0)
	const day = Math.floor((now.getTime() - start) / 86_400_000)
	return `D${day.toString().padStart(3, '0')}`
}

function storagePath(folder: string, name: string) {
	const target = path.resolve(storageRoot, folder, name)
	if (!target.startsWith(`${storageRoot}${path.sep}`)) {
		throw badRequest('Invalid file path')
	}
	return target
}

export function isPublicIpAddress(address: string) {
	if (isIP(address) === 4) {
		const [a, b, c] = address.split('.').map(Number)
		return !(
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 100 && b >= 64 && b <= 127) ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 0 && c === 0) ||
			(a === 192 && b === 168) ||
			(a === 198 && (b === 18 || b === 19)) ||
			a >= 224
		)
	}

	if (isIP(address) === 6) {
		const normalized = address.toLowerCase()
		if (normalized.startsWith('::ffff:')) {
			return isPublicIpAddress(normalized.slice(7))
		}
		return !(
			normalized === '::' ||
			normalized === '::1' ||
			normalized.startsWith('fc') ||
			normalized.startsWith('fd') ||
			/^fe[89ab]/.test(normalized) ||
			normalized.startsWith('ff')
		)
	}

	return false
}

async function assertPublicUrl(url: URL) {
	if (!['http:', 'https:'].includes(url.protocol)) {
		throw badRequest('Only HTTP and HTTPS image URLs are allowed')
	}
	if (url.username || url.password)
		throw badRequest('Image URL credentials are not allowed')
	if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
		throw badRequest('Private image hosts are not allowed')
	}

	let addresses: Array<{ address: string }>
	try {
		addresses = isIP(url.hostname)
			? [{ address: url.hostname }]
			: await dns.lookup(url.hostname, { all: true, verbatim: true })
	} catch {
		throw badRequest('Remote image host could not be resolved')
	}

	if (!addresses.length || addresses.some(entry => !isPublicIpAddress(entry.address))) {
		throw badRequest('Private or unresolved image hosts are not allowed')
	}
	return addresses
}

async function readLimitedBody(response: Response) {
	const contentLength = Number.parseInt(response.headers.get('content-length') ?? '0', 10)
	if (contentLength > env.remoteImageMaxBytes) {
		throw new AppError(413, 'IMAGE_TOO_LARGE', 'Remote image is too large')
	}
	if (!response.body) throw badRequest('Remote image response is empty')

	const reader = response.body.getReader()
	const chunks: Uint8Array[] = []
	let received = 0

	let complete = false
	while (!complete) {
		const { value, done } = await reader.read()
		if (done) {
			complete = true
			continue
		}
		received += value.byteLength
		if (received > env.remoteImageMaxBytes) {
			await reader.cancel()
			throw new AppError(413, 'IMAGE_TOO_LARGE', 'Remote image is too large')
		}
		chunks.push(value)
	}

	return Buffer.concat(chunks)
}

export async function downloadRemoteImage(input: string) {
	let current = new URL(input)

	for (let redirects = 0; redirects <= 3; redirects++) {
		const addresses = await assertPublicUrl(current)
		const selected = addresses[0]
		const dispatcher = new Agent({
			connect: {
				lookup(_hostname, _options, callback) {
					callback(null, selected.address, isIP(selected.address))
				},
			},
		})

		let response: Response
		try {
			response = await fetch(current, {
				dispatcher,
				redirect: 'manual',
				signal: AbortSignal.timeout(env.remoteImageTimeoutMs),
				headers: { Accept: 'image/*', 'User-Agent': 'fikifor-image-import/1.0' },
			})
		} catch (error) {
			await dispatcher.close()
			logger.warn({ err: error, host: current.hostname }, 'Remote image request failed')
			throw badRequest('Remote image could not be downloaded')
		}

		if ([301, 302, 303, 307, 308].includes(response.status)) {
			const location = response.headers.get('location')
			await response.body?.cancel()
			await dispatcher.close()
			if (!location) throw badRequest('Remote image redirect is invalid')
			current = new URL(location, current)
			continue
		}

		if (!response.ok) {
			await response.body?.cancel()
			await dispatcher.close()
			throw badRequest(`Remote image returned HTTP ${response.status}`)
		}
		const contentType = response.headers.get('content-type')?.split(';')[0]
		if (!contentType?.startsWith('image/')) {
			await response.body?.cancel()
			await dispatcher.close()
			throw badRequest('Remote URL did not return an image')
		}
		try {
			return await readLimitedBody(response as Response)
		} finally {
			await dispatcher.close()
		}
	}

	throw badRequest('Remote image redirected too many times')
}

async function persist(buffer: Buffer) {
	const folder = currentFolder()
	const name = `${randomUUID()}.jpeg`
	const folderPath = path.resolve(storageRoot, folder)
	const filePath = storagePath(folder, name)
	await fs.mkdir(folderPath, { recursive: true })

	try {
		await sharp(buffer, { failOn: 'error', limitInputPixels: maxInputPixels })
			.rotate()
			.jpeg({ quality: 85, mozjpeg: true })
			.toFile(filePath)
		return await Prisma.image.create({ data: { folder, name } })
	} catch (error) {
		await fs.unlink(filePath).catch(() => undefined)
		if (error instanceof AppError) throw error
		throw badRequest('The supplied file is not a supported image')
	}
}

export async function upload(file: Express.Multer.File | undefined) {
	if (!file) throw badRequest('An image file is required')
	return persist(file.buffer)
}

export async function uploadFromLink(link: string) {
	return persist(await downloadRemoteImage(link))
}

export async function remove(image: Pick<Image, 'id' | 'folder' | 'name'> | null) {
	if (!image) return
	await fs.unlink(storagePath(image.folder, image.name)).catch(error => {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
			logger.warn({ err: error, imageId: image.id }, 'Could not remove image file')
		}
	})
	await Prisma.image.delete({ where: { id: image.id } }).catch(error => {
		logger.warn({ err: error, imageId: image.id }, 'Could not remove image record')
	})
}

export async function access(name: string, userId?: number) {
	const image = await Prisma.image.findUnique({
		where: { name },
		include: {
			cover: { select: { ownerId: true, published: true } },
			item: {
				select: {
					quiz: { select: { ownerId: true, published: true } },
				},
			},
		},
	})
	if (!image) throw notFound('File not found')

	const quiz = image.cover ?? image.item?.quiz
	if (!quiz || (!quiz.published && quiz.ownerId !== userId)) {
		throw notFound('File not found')
	}

	return {
		path: storagePath(image.folder, image.name),
		isPublic: quiz.published,
	}
}
