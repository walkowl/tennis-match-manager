module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{css,html,js,png,json,jpg}'
	],
	globIgnores: [
		'node_modules/**',
		'*.test.js',
		'package.json',
		'package-lock.json',
		'workbox-config.js'
	],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	swDest: 'sw.js'
};
