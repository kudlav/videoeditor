const { server } = require('../config');
const assert = require('assert').strict;
const fetch = require('node-fetch');

/**
 * Simple request to check API state
 */
describe('API: basic - docs info', function () {
	it('should return message with api docs', function (done) {
		fetch(`${server.apiUrl}`, {method: 'GET'})
			.then(res => {
				assert.equal(res.status, 200, 'return code does not match');
				return res.json();
			})
			.then(data => {
				assert.equal(typeof data.msg, 'string', 'missing message of response');
				assert.notEqual(data.msg.length, 0, 'empty message in response');
				done();
			})
			.catch(error => done(error));
	});
});
