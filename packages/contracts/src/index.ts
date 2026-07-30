import { z } from 'zod'

const trimmedText = (field: string, max: number) =>
	z
		.string({ error: `${field} is required` })
		.trim()
		.min(1, `${field} is required`)
		.max(max, `${field} is too long`)

export const positiveIdSchema = z.coerce.number().int().positive()
export const sessionCodeSchema = z
	.string()
	.trim()
	.toUpperCase()
	.regex(/^[A-Z0-9]{14}$/, 'Invalid session code')

export const loginInputSchema = z.object({
	username: trimmedText('Username', 32),
	password: z.string().min(1, 'Password is required').max(128),
})

export const signupInputSchema = loginInputSchema
	.extend({
		username: z
			.string()
			.trim()
			.min(3, 'Username must contain at least 3 characters')
			.max(32, 'Username must contain at most 32 characters')
			.regex(/^[a-zA-Z0-9]+$/, 'Username may only contain letters and numbers'),
		password: z
			.string()
			.min(8, 'Password must contain at least 8 characters')
			.max(128, 'Password must contain at most 128 characters'),
		passwordConfirmation: z.string().min(1).max(128).optional(),
	})
	.superRefine((value, context) => {
		if (
			value.passwordConfirmation !== undefined &&
			value.password !== value.passwordConfirmation
		) {
			context.addIssue({
				code: 'custom',
				path: ['passwordConfirmation'],
				message: 'Passwords do not match',
			})
		}
	})

export const createQuizInputSchema = z.object({
	title: trimmedText('Title', 120),
	description: trimmedText('Description', 2000),
	size: z.coerce
		.number()
		.int()
		.refine(value => [32, 64, 128].includes(value), {
			message: 'Size must be 32, 64, or 128',
		}),
})

export const updateQuizInputSchema = createQuizInputSchema.pick({
	title: true,
	description: true,
})

export const quizSortBySchema = z.enum([
	'relevance',
	'sessions',
	'createdAt',
	'updatedAt',
	'title',
])
export const sortOrderSchema = z.enum(['asc', 'desc'])
export const publicQuizQuerySchema = z.object({
	q: z.string().trim().max(120).default(''),
	sortBy: quizSortBySchema.default('sessions'),
	sortOrder: sortOrderSchema.default('desc'),
	page: z.coerce.number().int().min(1).max(10_000).default(1),
	pageSize: z.coerce.number().int().min(1).max(48).default(12),
})

export const updateQuizItemInputSchema = z.object({
	title: trimmedText('Title', 120),
})

export const bulkUpdateQuizItemsInputSchema = z
	.array(z.string().trim().max(120))
	.min(1)
	.max(128)

export const remoteImageInputSchema = z.object({
	link: z
		.url('A valid image URL is required')
		.max(2048)
		.refine(value => ['http:', 'https:'].includes(new URL(value).protocol), {
			message: 'Only HTTP and HTTPS image URLs are allowed',
		}),
})

export const quizIdParamsSchema = z.object({ quizId: positiveIdSchema })
export const itemIdParamsSchema = z.object({ itemId: positiveIdSchema })
export const fileNameParamsSchema = z.object({
	name: z
		.string()
		.regex(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.jpeg$/i,
			'Invalid file name',
		),
})
export const sessionCodeParamsSchema = z.object({ code: sessionCodeSchema })
export const createSessionInputSchema = z.object({ quizId: positiveIdSchema })
export const sessionJoinInputSchema = z.object({ code: sessionCodeSchema })
export const sessionStartInputSchema = sessionJoinInputSchema
export const sessionVoteInputSchema = z.object({
	matchId: positiveIdSchema,
	itemId: positiveIdSchema,
})

export type LoginInput = z.infer<typeof loginInputSchema>
export type SignupInput = z.infer<typeof signupInputSchema>
export type CreateQuizInput = z.infer<typeof createQuizInputSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizInputSchema>
export type UpdateQuizItemInput = z.infer<typeof updateQuizItemInputSchema>
export type PublicQuizQuery = z.infer<typeof publicQuizQuerySchema>
export type QuizSortBy = z.infer<typeof quizSortBySchema>
export type SortOrder = z.infer<typeof sortOrderSchema>
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>
export type SessionJoinInput = z.infer<typeof sessionJoinInputSchema>
export type SessionStartInput = z.infer<typeof sessionStartInputSchema>
export type SessionVoteInput = z.infer<typeof sessionVoteInputSchema>
export type AuthUser = { userId: number; username: string }

export interface ApiError {
	code: string
	message: string
	details?: unknown
}

export type ApiResponse<T = undefined> =
	| (T extends undefined
			? { success: true; data?: undefined; total?: number }
			: { success: true; data: T; total?: number })
	| { success: false; error: ApiError }

export interface UserSummary {
	id: number
	username: string
}

export interface PublisherSummary {
	username: string
	displayName: string | null
}

export interface AuthResult {
	token: string
	user: { userId: number; username: string }
}

export interface ImageAsset {
	id: number
	name: string
	folder: string
}

export interface QuizItem {
	id: number
	title: string | null
	image: ImageAsset | null
}

export interface Quiz {
	id: number
	title: string
	description: string
	size: number
	published?: boolean
	owner?: PublisherSummary
	cover: ImageAsset
	items: QuizItem[]
	createdAt?: string
	updatedAt?: string | null
	sessionCount?: number
}

export interface QuizSummary {
	id: number
	title: string
	description: string
	size: number
	published: true
	owner: PublisherSummary
	cover: ImageAsset
	createdAt: string
	updatedAt: string | null
	sessionCount: number
}

export interface QuizLeaderboardEntry {
	rank: number
	item: QuizItem
	sessionWins: number
	weightedScore: number
	share: number
}

export interface QuizLeaderboard {
	completedSessions: number
	participantWeight: number
	entries: QuizLeaderboardEntry[]
}

export interface Participant {
	id: number
	online: boolean
	user: UserSummary
}

export interface SessionVote {
	id?: number
	matchId?: number
	selectionId: number
	participantId: number
	participant: {
		id: number
		userId: number
		user: UserSummary
	}
}

export interface SessionMatch {
	id: number
	order: number
	cluster: number
	completed?: boolean
	winnerId?: number | null
	votes: SessionVote[]
	firstItem: QuizItem
	secondItem: QuizItem
}

export interface GameSession {
	id: number
	code: string
	cluster: number
	started: boolean
	ended: boolean
	adminId: number
	admin: UserSummary
	favorite: QuizItem | null
	quiz: Pick<Quiz, 'id' | 'title' | 'cover' | 'size'>
	participants: Participant[]
}

export interface SessionSnapshot {
	session: GameSession
	match: SessionMatch | null
	final: SessionMatch | null
}

export type SocketSuccess<T = undefined> = T extends undefined
	? { ok: true }
	: { ok: true; data: T }
export type SocketFailure = { ok: false; error: ApiError }
export type SocketAck<T = undefined> = (result: SocketSuccess<T> | SocketFailure) => void

export interface ClientToServerEvents {
	'session:join': (payload: SessionJoinInput, ack?: SocketAck) => void
	'session:start': (payload: SessionStartInput, ack?: SocketAck) => void
	'session:vote': (payload: SessionVoteInput, ack?: SocketAck) => void
}

export interface ServerToClientEvents {
	'session:joined': (participants: Participant[]) => void
	'session:online': (username: string) => void
	'session:offline': (username: string) => void
	'session:counter': (counter: number) => void
	'session:started': (match: SessionMatch) => void
	'session:voted': (vote: SessionVote) => void
	'session:ended': () => void
	'session:match:done': () => void
	'session:next': (match: SessionMatch) => void
	'session:round': (round: { next: SessionMatch; cluster: number }) => void
	'session:over': (code: string) => void
	'session:error': (error: ApiError) => void
}

export type InterServerEvents = Record<never, never>
export type SocketData = AuthUser
