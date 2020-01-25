/**
 * @file Main config file
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

exports.server = {
	port: 8080,
	host: 'localhost',

	get serverUrl() {
		return `http://${this.host}:${this.port}`;
	},
	get apiUrl() {
		return `http://${this.host}:${this.port}/api`;
	},
};

exports.config = {
	emailServer: 'smtp.stud.fit.vutbr.cz',
	emailPort: 465,
	emailUser: 'xkudla15',
	emailPasswd: '*****',
	adminEmail: 'xkudla15@stud.fit.vutbr.cz',

	projectPath: 'WORKER',

	declareXML: '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE mlt SYSTEM "https://raw.githubusercontent.com/mltframework/mlt/master/src/modules/xml/mlt-xml.dtd">',

	mapFilterNames: {
		fadeInBrightness: 'brightness',
		fadeOutBrightness: 'brightness',
		fadeInVolume: 'volume',
		fadeOutVolume: 'volume',
	}
};
