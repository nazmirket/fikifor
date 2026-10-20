import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
	{
		ignores: [
			'**/node_modules/**',
			'**/.nuxt/**',
			'**/.output/**',
			'**/build/**',
			'**/dist/**',
			'**/coverage/**',
			'apps/api/prisma/schema.prisma',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...vue.configs['flat/essential'],
	prettier,
	{
		files: ['scripts/**/*.mjs', 'playwright.config.ts'],
		languageOptions: { globals: globals.node },
	},
	{
		files: ['apps/api/**/*.ts', 'packages/contracts/**/*.ts'],
		languageOptions: {
			globals: globals.node,
			parserOptions: { sourceType: 'module' },
		},
		rules: {
			'no-console': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
			],
		},
	},
	{
		files: ['apps/web/**/*.{ts,vue}'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			'no-undef': 'off',
			'no-console': 'error',
			'vue/multi-word-component-names': 'off',
			'vue/no-multiple-template-root': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
			],
		},
	},
	{
		files: ['apps/web/**/*.vue'],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.vue'],
				sourceType: 'module',
			},
		},
	},
]
