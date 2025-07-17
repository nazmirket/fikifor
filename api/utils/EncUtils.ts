import crypto from 'crypto'

// ENCRYPT
// encrypts the string
export function enc(s: string, key: string, iv: string): string {
	const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
	let encrypted = cipher.update(s)
	encrypted = Buffer.concat([encrypted, cipher.final()])
	return encrypted.toString('hex')
}

// DECRYPT
// decrypts the string
export function dec(s: string, key: string, iv: string): string {
	const encryptedText = Buffer.from(s, 'hex')
	const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
	let decrypted = decipher.update(encryptedText)
	decrypted = Buffer.concat([decrypted, decipher.final()])
	return decrypted.toString()
}
