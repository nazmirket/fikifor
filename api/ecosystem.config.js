module.exports = {
	apps: [
		{
			name: 'fikifor-api',
			script: './build/server.js',
			instances: 2,
			exec_mode: 'cluster',
			env: {
				NODE_ENV: 'production',
			},
		},
		{
			name: 'fikifor-socket',
			script: './build/ws/server.js',
			env: {
				NODE_ENV: 'production',
			},
		},
	],
}
