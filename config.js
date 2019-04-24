export default {
	port: 8080,
	host: 'localhost',
	emailUser: 'xkudla15',
	emailPasswd: '*****',
	adminEmail: 'xkudla15@stud.fit.vutbr.cz',

	get serverUrl() {
		return `http://${this.host}:${this.port}`;
	},
	get apiUrl() {
		return `http://${this.host}:${this.port}/api`;
	},

	projectPath: 'WORKER',

	declareXML: '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE mlt SYSTEM "https://raw.githubusercontent.com/mltframework/mlt/master/src/modules/xml/mlt-xml.dtd">',

	filters: [{
		id: 'brightness',
		title: 'Jas',
		in: [{
			id: 'level',
			title: 'Úroveň',
			type: 'int',
			value: 100,
			min: 0,
			max: 200,
		}],
		out: [{
			id: 'start',
			value: () => 1,
		},{
			id: 'level',
			value: (input) => input.level / 100,
		}],
	},{
		id: 'lift_gamma_gain',
		title: 'Kontrast',
		in: [{
			id: 'level',
			title: 'Úroveň',
			type: 'int',
			value: 100,
			min: 0,
			max: 200,
		}],
		out: [{
			id: 'lift_r',
			value: () => 0,
		},{
			id: 'lift_g',
			value: () => 0,
		},{
			id: 'lift_b',
			value: () => 0,
		},{
			id: 'gamma_r',
			value: (input) => 2 - (input.level / 100),
		},{
			id: 'gamma_g',
			value: (input) => 2 - (input.level / 100),
		},{
			id: 'gamma_b',
			value: (input) => 2 - (input.level / 100),
		},{
			id: 'gain_r',
			value: (input) => input.level / 100,
		},{
			id: 'gain_g',
			value: (input) => input.level / 100,
		},{
			id: 'gain_b',
			value: (input) => input.level / 100,
		}]
	}]
};
