import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const suffix = randomUUID().replaceAll('-', '').slice(0, 10)
const username = `e2e${suffix}`
const password = 'gameplay-test-password'
const code = `E2E${suffix.toUpperCase()}0`

let userId: number
let quizId: number
let coverId: number
let coverName: string

const jpegPixel = Buffer.from(
	'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=',
	'base64',
)

test.beforeAll(async ({ request }) => {
	const signup = await request.post(`${process.env.E2E_API_URL}/api/v1/auth/signup`, {
		data: { username, password, passwordConfirmation: password },
	})
	expect(signup.ok()).toBe(true)
	const body = await signup.json()
	userId = body.data.user.userId

	coverName = `${randomUUID()}.jpeg`
	const coverFolder = path.resolve('apps/api/files/e2e')
	await fs.mkdir(coverFolder, { recursive: true })
	await fs.writeFile(path.join(coverFolder, coverName), jpegPixel)
	const cover = await prisma.image.create({
		data: { folder: 'e2e', name: coverName },
	})
	coverId = cover.id
	const quiz = await prisma.quiz.create({
		data: {
			ownerId: userId,
			coverId,
			title: 'Gameplay browser fixture',
			description: 'Persisted countdown and animation fixture',
			size: 32,
			items: {
				createMany: {
					data: Array.from({ length: 32 }, (_, index) => ({
						title: `Browser item ${index + 1}`,
					})),
				},
			},
			sessions: {
				create: {
					code,
					adminId: userId,
					cluster: 16,
					participants: { create: { userId } },
				},
			},
		},
	})
	quizId = quiz.id
})

test.afterAll(async () => {
	await prisma.sessionVote.deleteMany({
		where: { match: { session: { code } } },
	})
	await prisma.session.deleteMany({ where: { code } })
	if (quizId) {
		await prisma.quizItem.deleteMany({ where: { quizId } })
		await prisma.quiz.deleteMany({ where: { id: quizId } })
	}
	if (coverId) await prisma.image.deleteMany({ where: { id: coverId } })
	if (coverName) {
		const original = path.resolve('apps/api/files/e2e', coverName)
		await Promise.all(
			[original, ...[320, 640, 1280].map(width => `${original}.${width}.jpeg`)].map(
				filePath => fs.unlink(filePath).catch(() => undefined),
			),
		)
	}
	if (userId) await prisma.user.deleteMany({ where: { id: userId } })
	await prisma.$disconnect()
})

test('restores countdown after reload and completes the winner animation', async ({
	page,
}, testInfo) => {
	const errors: string[] = []
	page.on('console', message => {
		if (message.type() === 'error') errors.push(message.text())
	})
	page.on('pageerror', error => errors.push(error.message))

	await page.goto(`/login?code=${code}`)
	await page.getByRole('textbox', { name: 'Kullanıcı adı' }).fill(username)
	await page.getByLabel('Parola', { exact: true }).fill(password)
	await page.getByRole('button', { name: 'Giriş yap', exact: true }).click()
	await expect(page).toHaveURL(new RegExp(`/sessions/${code}$`))

	await page.getByRole('button', { name: 'Başlat' }).click()
	// Reload only after the server confirms the durable start. A click does not
	// acknowledge a Socket.IO mutation and navigation can discard an unsent packet.
	await expect(page.getByText(/Başlıyor \(\d+ sn\)/)).toBeVisible()
	await page.reload()
	await expect(page.getByText(/Başlıyor \(\d+ sn\)/)).toBeVisible()

	const cards = page.locator('.match-card')
	await expect(cards).toHaveCount(2, { timeout: 5_000 })
	await cards.first().click()
	await expect(cards.first()).toHaveClass(/vs-winner/)
	await expect(cards.nth(1)).toHaveClass(/vs-loser/)
	await expect
		.poll(() => cards.nth(1).evaluate(element => getComputedStyle(element).opacity))
		.toBe('0')
	await page.screenshot({ path: testInfo.outputPath('winner.png'), fullPage: true })
	expect(errors).toEqual([])
})
