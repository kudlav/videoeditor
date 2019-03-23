module.exports = {
	entry: ['./react/front.js', './views/style.scss'],
	output: {
		path: __dirname + '/public',
		filename: '[name].js'
	},
	module: {
		rules: [
			{
				test: /\.json$/,
				include: /node_modules/,
				loader: 'json-loader'
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ["@babel/preset-react", "@babel/preset-env"]
					}
				}
			},
			{ // sass / scss loader for webpack
				test: /\.scss$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '/[name].css',
						}
					},
					{
						loader: 'extract-loader'
					},
					{
						loader: 'css-loader?-url'
					},
					{
						loader: 'postcss-loader'
					},
					{
						loader: 'sass-loader'
					}
				]
			}
		]
	}
};
