import Prisma from '../prisma'

import * as JwtUtils from '../utils/JwtUtils'
import * as HashUtils from '../utils/HashUtils'

// Login
export async function login(username: string, password: string) {
	// user query
	const user = await Prisma.user.findUnique({
		where: { username },
	})

	// if there is no user then throw error
	if (!user) throw new Error('User not found')

	// check password match
	let match = await HashUtils.compare(password, user.password)

	// throw error if no match
	if (!match) throw new Error('Invalid Password')

	const token = JwtUtils.sign({ userId: user.id, username: user.username })

	return { token, user: { username, userId: user.id } }
}

// Signup
export async function signup(username: string, password: string) {
	// check if username is already taken
	const user = await Prisma.user.findFirst({
		where: { username },
	})

	if (user) throw new Error('Username already taken')

	// hash password
	const hash = await HashUtils.hash(password)

	// create user
	const created = await Prisma.user.create({
		data: {
			username,
			password: hash,
		},
	})

	// sign jwt
	const token = JwtUtils.sign({ userId: created.id, username: created.username })

	return { token, user: { username, userId: created.id } }
}
