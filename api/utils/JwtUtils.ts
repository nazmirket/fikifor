import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'

// Sign jwt token
export function sign(payload: any, opts?: SignOptions) {
	if (!process.env.JWT_SECRET) throw new Error('Jwt secret not set')
	return jwt.sign(payload, process.env.JWT_SECRET, opts)
}

// Verify jwt token
export function verify(token: string): JwtPayload | string {
	if (!process.env.JWT_SECRET) throw new Error('Jwt secret not set')
	try {
		return jwt.verify(token, process.env.JWT_SECRET)
	} catch (e) {
		throw new Error('Invalid token')
	}
}
