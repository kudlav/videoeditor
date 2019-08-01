/**
 * @file Manager for logging
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 *
 * Log everything into server.log. When that reaches 10Mb, it will be compressed to server.1.log.gz.
 * Holds only 5 backup files.
 */

const log4js = require('log4js');
const logger = log4js.getLogger();
log4js.configure({
	appenders: {
		everything: { type: 'file', filename: 'server.log', maxLogSize: 10485760, keepFileExt: true, compress: true }
	},
	categories: {
		default: { appenders: [ 'everything' ], level: 'debug'}
	}
});


export default logger;
