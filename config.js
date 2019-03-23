const env = process.env;

export const nodeEnv = env.NODE_ENV || 'development';

export const logStars = (message) => {
	console.info('**********');
	console.info(message);
	console.info('**********');
};

export default {
	port: env.PORT || 8080,
	host: env.HOST || '0.0.0.0',
	get serverUrl() {
		return `http://${this.host}:${this.port}`;
	},

	projectPath: 'WORKER',
	publicVideoPath: './public/WORKER',

	declareXML: '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE mlt SYSTEM "https://raw.githubusercontent.com/mltframework/mlt/master/src/modules/xml/mlt-xml.dtd">',
};
