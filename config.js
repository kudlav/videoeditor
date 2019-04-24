export default {
	port: 8080,
	host: 'localhost',
	emailUser: 'xkudla15',
	emailPasswd: '*****',

	get serverUrl() {
		return `http://${this.host}:${this.port}`;
	},
	get apiUrl() {
		return `http://${this.host}:${this.port}/api`;
	},

	projectPath: 'WORKER',

	declareXML: '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE mlt SYSTEM "https://raw.githubusercontent.com/mltframework/mlt/master/src/modules/xml/mlt-xml.dtd">',
};
