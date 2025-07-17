import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Compare hash
export async function compare(s: string, hash: string) {
	const match = await bcrypt.compare(s, hash)
	return match
}

// Get hash of string
export async function hash(s: string) {
	const salt = await bcrypt.genSalt(10)
	const hash = await bcrypt.hash(s, salt)
	return hash
}

// sha1
export function sha1(s: string, digest: 'base64' | 'hex' | 'binary') {
	return crypto.createHash('sha1').update(s).digest(digest)
}

// sha512
export function sha512(s: string, digest: 'base64' | 'hex' | 'binary') {
	return crypto.createHash('sha512').update(s).digest(digest)
}
