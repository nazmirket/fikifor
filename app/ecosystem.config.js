module.exports = {
	apps: [
		{
			name: 'fikifor-ui',
			port: 3332,
			exec_mode: 'cluster',
			instances: 1,
			script: './.output/server/index.mjs',
			env: {
				NODE_ENV: 'production',
			},
		},
	],
}
