const { server } = require('../config');
const assert = require('assert').strict;
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const errors = require('../models/errors');

/**
 * transition - Everything about transitions
 */
describe('API: transition - everything about transitions', function () {

	describe('transitionPOST - simple error tests', function () {
		it('add transition missing track parameter should fail', function (done) {
			const expected = errors.parameterTransitionMissing400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "itemA": 0, "itemB": 1, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition missing itemA parameter should fail', function (done) {
			const expected = errors.parameterTransitionMissing400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemB": 1, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition missing itemB parameter should fail', function (done) {
			const expected = errors.parameterTransitionMissing400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 0, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition missing transition parameter should fail', function (done) {
			const expected = errors.parameterTransitionMissing400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 0, "itemB": 1, "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition missing duration parameter should fail', function (done) {
			const expected = errors.parameterTransitionMissing400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 0, "itemB": 1, "transition": "string" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition itemA char parameter should fail', function (done) {
			const expected = errors.parameterTransitionWrong400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": "A", "itemB": 1, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition negative itemA parameter should fail', function (done) {
			const expected = errors.parameterTransitionWrong400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": -1, "itemB": 1, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition itemB char parameter should fail', function (done) {
			const expected = errors.parameterTransitionWrong400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 0, "itemB": "A", "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition negative itemB parameter should fail', function (done) {
			const expected = errors.parameterTransitionWrong400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 0, "itemB": -1, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition not valid duration parameter should fail', function (done) {
			const expected = errors.parameterTransitionWrong400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 0, "itemB": 1, "transition": "string", "duration": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition A, B item is same should fail', function (done) {
			const expected = errors.parameterTransitionOrder400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 0, "itemB": 0, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition A, B wrong order should fail', function (done) {
			const expected = errors.parameterTransitionOrder400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 2, "itemB": 1, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition in nonexisting project should fail', function (done) {
			const expected = errors.parameterTransitionOrder400;
			fetch(`${server.apiUrl}/project/undefined/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 2, "itemB": 1, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});
	});

	describe('transitionPOST - errors without uploading file', function () {
		let projectId;
		beforeEach(() => // get new project
			fetch(`${server.apiUrl}/project`, {method: 'POST'})
				.then(res => res.json())
				.then(data => projectId = data.project)
				.catch(error => assert.fail(error))
		);

		it('add transition on nonexisting track should fail', function (done) {
			const expected = errors.trackNotFound404('undefined');
			fetch(`${server.apiUrl}/project/${projectId}/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "undefined", "itemA": 1, "itemB": 2, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add transition on nonexisting itemA should fail', function (done) {
			const expected = errors.itemNotFound404(1, 'videotrack0');
			fetch(`${server.apiUrl}/project/${projectId}/transition`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "itemA": 1, "itemB": 2, "transition": "string", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});
	});

	describe('transitionPOST - errors with file', function () {
		let projectId;
		let fileId;
		const paramsPost = {
			method: 'POST',
			headers: {'Content-Type': 'application/json; charset=utf-8'},
			body: '{ "track": "videotrack0", "itemA": 0, "itemB": 1, "transition": "string", "duration": "00:00:01,000" }',
		};
		const paramsFilePut = {
			method: 'PUT',
			headers: {'Content-Type': 'application/json; charset=utf-8'},
			body: '{ "track" : "videotrack0", "duration": "00:00:01,000" }',
		};
		beforeEach(() => { // get project, upload and insert file
			const form = new FormData();
			form.append('file', fs.createReadStream('./test/img.png'));
			return new Promise(resolve =>
				fetch(`${server.apiUrl}/project`, {method: 'POST'})
					.then(res => res.json())
					.then(data => {
						projectId = data.project;
						fetch(`${server.apiUrl}/project/${projectId}/file`, {
							method: 'POST',
							headers: form.getHeaders(),
							body: form
						}) // upload file
							.then(res => {
								assert.equal(res.status, 200, 'return code filePOST does not match');
								return res.json();
							})
							.then((data) => {
								fileId = data.resource_id;
								fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, paramsFilePut) // insert file
									.then(res => {
										assert.equal(res.status, 200, 'return code filePUT does not match');
										resolve();
									})
									.catch(error => assert.fail(error));
							})
							.catch(error => assert.fail(error));
					})
					.catch(error => assert.fail(error))
			);
		});

		it('add transition on nonexisting itemB should fail', function (done) {
			const expected = errors.itemNotFound404(1, 'videotrack0');
			fetch(`${server.apiUrl}/project/${projectId}/transition`, paramsPost)
				.then(res => {
					assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add too long transition should fail', function (done) {
			const expected = errors.transitionTooLong400;
			fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, paramsFilePut) // insert file
				.then(res => {
					assert.equal(res.status, 200, 'return code filePUT does not match');
					fetch(`${server.apiUrl}/project/${projectId}/transition`, {
						method: 'POST',
						headers: {'Content-Type': 'application/json; charset=utf-8'},
						body: '{ "track": "videotrack0", "itemA": 0, "itemB": 1, "transition": "string", "duration": "00:00:01,001" }',
					})
						.then(res => {
							assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
							return res.json();
						})
						.then(data => {
							assert.equal(data.err, expected.err, 'wrong error title in response');
							assert.equal(data.msg, expected.msg, 'wrong error message in response');
							done();
						})
						.catch(error => done(error));
				})
				.catch(error => assert.fail(error));
		});

		it('add transition successfully, for second time should fail', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, paramsFilePut) // insert file
				.then(res => {
					assert.equal(res.status, 200, 'return code filePUT does not match');
					fetch(`${server.apiUrl}/project/${projectId}/transition`, paramsPost)
						.then(res => {
							assert.equal(res.status, 200, 'return code transitionPOST does not match');
							return res.json();
						})
						.then(data => {
							assert.equal(typeof data.msg, 'string', 'missing message in response');
							assert.notEqual(data.msg.length, 0, 'empty message in response');
							const expected = errors.transitionExists403;
							fetch(`${server.apiUrl}/project/${projectId}/transition`, paramsPost)
								.then(res => {
									assert.equal(res.status, expected.code, 'return code transitionPOST does not match');
									return res.json();
								})
								.then(data => {
									assert.equal(data.err, expected.err, 'wrong error title in response');
									assert.equal(data.msg, expected.msg, 'wrong error message in response');
									done();
								})
								.catch(error => done(error));
						})
						.catch(error => done(error));
				})
				.catch(error => assert.fail(error));
		});

		it('add transition successfully, simple+complex and complex+simple tests', function (done) {
			const prepareTimeline = new Promise((resolve) => {
				fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, paramsFilePut) // insert 2nd item
					.then(res => {
						assert.equal(res.status, 200, 'return code filePUT does not match');
						fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, paramsFilePut) // insert 3rd item
							.then(res => {
								assert.equal(res.status, 200, 'return code filePUT does not match');
								fetch(`${server.apiUrl}/project/${projectId}/filter`, { // apply filter to 2nd item
									method: 'POST',
									headers: {'Content-Type': 'application/json; charset=utf-8'},
									body: '{ "track": "videotrack0", "item": 1, "filter": "string" }',
								})
									.then(res => {
										assert.equal(res.status, 200, 'return code filterPOST does not match');
										resolve();
									})
									.catch(error => done(error));
							})
							.catch(error => done(error));
					})
					.catch(error => done(error));
			});
			prepareTimeline.then(() => {
				fetch(`${server.apiUrl}/project/${projectId}/transition`, { // complex+simple item test
					method: 'POST',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "videotrack0", "itemA": 1, "itemB": 2, "transition": "fade", "duration": "00:00:01,000" }',
				})
					.then(res => {
						assert.equal(res.status, 200, 'return code transitionPOST does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(typeof data.msg, 'string', 'missing message in response');
						assert.notEqual(data.msg.length, 0, 'empty message in response');
						fetch(`${server.apiUrl}/project/${projectId}/transition`, paramsPost) // simple+complex item test
							.then(res => {
								assert.equal(res.status, 200, 'return code transitionPOST does not match');
								return res.json();
							})
							.then(data => {
								assert.equal(typeof data.msg, 'string', 'missing message in response');
								assert.notEqual(data.msg.length, 0, 'empty message in response');
								done();
							})
							.catch(error => done(error));
					})
					.catch(error => done(error));
			})
				.catch(error => done(error));
		});

		it('add transition successfully, complex+complex test', function (done) {
			const prepareTimeline = new Promise((resolve) => {
				fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, paramsFilePut) // insert 2nd item
					.then(res => {
						assert.equal(res.status, 200, 'return code filePUT does not match');
						fetch(`${server.apiUrl}/project/${projectId}/filter`, { // apply filter to 1st item
							method: 'POST',
							headers: {'Content-Type': 'application/json; charset=utf-8'},
							body: '{ "track": "videotrack0", "item": 0, "filter": "string" }',
						})
							.then(res => {
								assert.equal(res.status, 200, 'return code filterPOST does not match');
								fetch(`${server.apiUrl}/project/${projectId}/filter`, { // apply filter to 2nd item
									method: 'POST',
									headers: {'Content-Type': 'application/json; charset=utf-8'},
									body: '{ "track": "videotrack0", "item": 1, "filter": "string" }',
								})
									.then(res => {
										assert.equal(res.status, 200, 'return code filterPOST does not match');
										resolve();
									})
									.catch(error => done(error));
							})
							.catch(error => done(error));
					})
					.catch(error => done(error));
			});
			prepareTimeline.then(() => {
				fetch(`${server.apiUrl}/project/${projectId}/transition`, paramsPost) // complex+complex item test
					.then(res => {
						assert.equal(res.status, 200, 'return code transitionPOST does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(typeof data.msg, 'string', 'missing message in response');
						assert.notEqual(data.msg.length, 0, 'empty message in response');
						done();
					})
					.catch(error => done(error));
			})
				.catch(error => done(error));
		});
	});

});
