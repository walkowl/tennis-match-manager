module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{css,html,js,md,ttf,png,json,jpg}'
	],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	swDest: 'sw.js'
};