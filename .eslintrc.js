module.exports = {
	'root': true,
	'parser': 'babel-eslint',
	'env': {
		'browser': true,
		'commonjs': true,
		'es2017': true,
		'node': true
	},
	'extends': ['eslint:recommended'],
	'parserOptions': {
		'sourceType': 'module'
	},
	'rules': {
		'indent': ['error', 'tab', {'SwitchCase': 1}],
		'linebreak-style': ['error','unix'],
		'quotes': ['error','single'],
		'semi': ['error','always'],
		'no-console': 'error',
		'no-unused-vars': ['error', { 'args': 'none' }]
	}
};
