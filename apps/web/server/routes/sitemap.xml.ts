type PublicQuiz = {
	id: number
	updatedAt?: string
}

type QuizListResponse = {
	success: boolean
	data?: PublicQuiz[]
	total?: number
}

function escapeXml(value: string) {
	return value.replace(
		/[<>&'"]/g,
		character =>
			({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[
				character
			] ?? character,
	)
}

export default defineEventHandler(async event => {
	const config = useRuntimeConfig(event)
	const appUrl = String(config.public.APP_URL || '').replace(/\/$/, '')
	const urls: Array<{ loc: string; lastmod?: string }> = [
		{ loc: `${appUrl}/` },
		{ loc: `${appUrl}/quizes` },
	]

	try {
		const apiUrl = String(config.public.API_URL).replace(/\/$/, '')
		const pageSize = 48
		let page = 1
		let total = 0
		do {
			const response = await $fetch<QuizListResponse>(
				`${apiUrl}/quizes?q=&sortBy=updatedAt&sortOrder=desc&page=${page}&pageSize=${pageSize}`,
			)
			for (const quiz of response.data ?? []) {
				if (!Number.isInteger(quiz.id) || quiz.id < 1) continue
				urls.push({
					loc: `${appUrl}/quizes/${quiz.id}`,
					lastmod: quiz.updatedAt,
				})
			}
			total = response.total ?? page * pageSize
			if (!response.data?.length) break
			page += 1
		} while ((page - 1) * pageSize < total)
	} catch {
		// Keep the sitemap valid with its stable public routes if the API is unavailable.
	}

	const body = urls
		.map(({ loc, lastmod }) => {
			const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''
			return `<url><loc>${escapeXml(loc)}</loc>${lastmodTag}</url>`
		})
		.join('')

	setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
	setResponseHeader(event, 'cache-control', 'public, max-age=900')

	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
})
