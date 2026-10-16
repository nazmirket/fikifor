export default defineEventHandler(event => {
	const config = useRuntimeConfig(event)
	const appUrl = String(config.public.APP_URL || '').replace(/\/$/, '')

	setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
	setResponseHeader(event, 'cache-control', 'public, max-age=3600')

	return ['User-agent: *', 'Allow: /', `Sitemap: ${appUrl}/sitemap.xml`].join('\n')
})
