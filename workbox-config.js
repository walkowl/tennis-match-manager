module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{css,html,js,md,ttf}'
	],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	swDest: 'sw.js'
};