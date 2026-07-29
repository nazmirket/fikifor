import crypto from 'crypto'

// GENERATE UNIQUE ID
// following function is used to generate unique id
export function uuid() {
	return crypto.randomUUID()
}

// PIN
// following function is used to generate pin
export function pin(length: number) {
	const chars = '0123456789'
	return randomCharacters(chars, length)
}

// RANDOM STRING
// following function generates random string
export function rand(length: number) {
	const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	return randomCharacters(chars, length)
}

function randomCharacters(chars: string, length: number) {
	return Array.from({ length }, () => chars[crypto.randomInt(chars.length)]).join('')
}

// RANDOM HEX
// generates a random hex string
export function randHex(length: number = 36) {
	return crypto.randomBytes(length).toString('hex')
}

// TRIM WHITESPACE
// following function trims whitespace from string
export function trim(str: string) {
	if (!str) return ''
	return str.replace(/\s/g, '')
}

// TRIM WHITESPACE AT START AND END
// following function trims whitespace from start and end of string
export function trimOuter(str: string) {
	if (!str) return ''
	return str.replace(/^\s+|\s+$/g, '')
}

// Generate short id
// following function generates short id
export function shortid() {
	const p1 = Math.random().toString(36).slice(-8).toUpperCase()
	const p2 = Date.now().toString(36).slice(-6).toUpperCase()
	return [p1, p2].join('')
}

// Convert to base64 string
// following function converts string to base64
export function b64(str: string) {
	return Buffer.from(str).toString('base64')
}

// Safe JSON stringify
// following function safely stringifies JSON
export function safeJsonStringify(obj: unknown) {
	if (obj === undefined || obj === null) return undefined
	let result: string | undefined
	try {
		result = JSON.stringify(obj)
	} catch {
		return undefined
	}
	return result
}
