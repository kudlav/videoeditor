const { server } = require('../config');
const fs = require('fs');
const assert = require('assert').strict;
const fetch = require('node-fetch');
const FormData = require('form-data');
const errors = require('../models/errors');

/**
 * filter - Everything about filters
 */
describe('API: filter - everything about filters', function () {

	describe('filterPOST', function () {
		describe('simple tests without project', function () {
			it('add filter missing track parameter should fail', function (done) {
				const expected = errors.parameterFilterMissing400;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "item": 0, "filter": "string", "params": {} }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filterPOST does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('add filter missing item parameter should fail', function (done) {
				const expected = errors.parameterFilterMissing400;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "string", "filter": "string", "params": {} }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filterPOST does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('add filter missing filter parameter should fail', function (done) {
				const expected = errors.parameterFilterMissing400;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "string", "item": 0, "params": {} }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filterPOST does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('add filter in nonexisting project should fail', function (done) {
				const expected = errors.projectNotFound404;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "string", "item": 0, "filter": "string", "params": {} }',
				})
					.then(res => {
						assert.equal(res.status, 404, 'return code filterPOST does not match');
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

		describe('tests with project', function () {
			let projectId;
			beforeEach(() => // get new project
				fetch(`${server.apiUrl}/project`, {method: 'POST'})
					.then(res => res.json())
					.then(data => projectId = data.project)
					.catch(error => assert.fail(error))
			);

			it('add filter on nonexisting track should fail', function (done) {
				const expected = errors.trackNotFound404('string');
				fetch(`${server.apiUrl}/project/${projectId}/filter`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "string", "item": 0, "filter": "string", "params": {} }',
				})
					.then(res => {
						assert.equal(res.status, 404, 'return code filterPOST does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('add filter on nonexisting item should fail', function (done) {
				const expected = errors.itemNotFound404(0, 'videotrack0');
				fetch(`${server.apiUrl}/project/${projectId}/filter`, {
					method: 'POST',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "videotrack0", "item": 0, "filter": "string", "params": {} }',
				}) // add filter
					.then(res => {
						assert.equal(res.status, 404, 'return code filterPOST does not match');
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
	});

	describe('filterDELETE', function () {
		describe('simple tests without project', function () {
			it('delete filter missing track parameter should fail', function (done) {
				const expected = errors.parameterFilterMissing400;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'DELETE',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "item": 0, "filter": "string" }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filterDELETE does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('delete filter missing item parameter should fail', function (done) {
				const expected = errors.parameterFilterMissing400;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'DELETE',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "videotrack0", "filter": "string" }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filterDELETE does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('delete filter missing filter parameter should fail', function (done) {
				const expected = errors.parameterFilterMissing400;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'DELETE',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "videotrack0", "item": 0 }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filterDELETE does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('delete filter nonexisting project should fail', function (done) {
				const expected = errors.projectNotFound404;
				fetch(`${server.apiUrl}/project/undefined/filter`, {
					method: 'DELETE',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "videotrack0", "item": 0, "filter": "string" }',
				})
					.then(res => {
						assert.equal(res.status, 404, 'return code filterDELETE does not match');
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

		describe('tests with project', function () {
			let projectId;
			beforeEach(() => // get new project
				fetch(`${server.apiUrl}/project`, {method: 'POST'})
					.then(res => {
						assert.equal(res.status, 200, 'return code trackPOST does not match');
						return res.json();
					})
					.then(data => projectId = data.project)
					.catch(error => assert.fail(error))
			);

			it('delete filter on nonexisting track should fail', function (done) {
				const expected = errors.trackNotFound404('string');
				fetch(`${server.apiUrl}/project/${projectId}/filter`, {
					method: 'DELETE',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "string", "item": 0, "filter": "string" }',
				})
					.then(res => {
						assert.equal(res.status, 404, 'return code filterDELETE does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('delete filter on nonexisting item should fail', function (done) {
				const expected = errors.itemNotFound404(0, 'videotrack0');
				fetch(`${server.apiUrl}/project/${projectId}/filter`, {
					method: 'DELETE',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track": "videotrack0", "item": 0, "filter": "string", "params": {} }',
				}) // delete filter
					.then(res => {
						assert.equal(res.status, 404, 'return code filterDELETE does not match');
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
	});

	describe('filterPOST+DELETE', function () {
		let projectId;
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
								fetch(`${server.apiUrl}/project/${projectId}/file/${data.resource_id}`, {
									method: 'PUT',
									headers: {'Content-Type': 'application/json; charset=utf-8'},
									body: '{ "track" : "videotrack0", "duration": "00:00:01,000" }',
								}) // insert file
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

		it('delete nonexisting filter should fail', function (done) {
			const expected = errors.filterNotFound404(0, 'videotrack0', 'string');
			fetch(`${server.apiUrl}/project/${projectId}/filter`, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "filter": "string"}',
			}) // delete filter
				.then(res => {
					assert.equal(res.status, 404, 'return code filterDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add filter twice, remove filter twice', function (done) {
			const paramsPost = {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "filter": "string", "params": {"start":1,"level":1.5} }',
			};
			const addRequests = new Promise(resolve =>
				fetch(`${server.apiUrl}/project/${projectId}/filter`, paramsPost) // add filter first time
					.then(res => assert.equal(res.status, 200, 'return code filterPOST does not match'))
					.then(() =>
						fetch(`${server.apiUrl}/project/${projectId}`, {method: 'GET'}) // get state
							.then(res => res.json())
							.then(data => {
								assert.equal(data.timeline.video[0].items[0].filters.length, 1, 'there should be one filter');
								assert.equal(data.timeline.video[0].items[0].filters[0].service, 'string', 'there should be string filter');
								fetch(`${server.apiUrl}/project/${projectId}/filter`, paramsPost) // add filter second time
									.then(res => {
										assert.equal(res.status, 403, 'return code filterPOST does not match');
										return res.json();
									})
									.then((data) => {
										const expected = errors.filterExists403(0, 'videotrack0', 'string');
										assert.equal(data.err, expected.err, 'wrong error title in response');
										assert.equal(data.msg, expected.msg, 'wrong error message in response');
										resolve();
									})
									.catch(error => done(error));
							})
							.catch(error => done(error))
					)
					.catch(error => done(error))
			);
			const paramsDelete = {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "filter": "string"}',
			};
			addRequests.then(() => {
				fetch(`${server.apiUrl}/project/${projectId}/filter`, paramsDelete) // delete filter first time
					.then(res => assert.equal(res.status, 200, 'return code filterDELETE does not match'))
					.then(() => {
						fetch(`${server.apiUrl}/project/${projectId}`, {method: 'GET'}) // get state
							.then(res => res.json())
							.then(data => {
								assert.equal(data.timeline.video[0].items[0].filters.length, 0, 'there should be no filter');
								fetch(`${server.apiUrl}/project/${projectId}/filter`, paramsDelete) // delete filter second time
									.then(res => {
										assert.equal(res.status, 404, 'return code filterDELETE does not match');
										return res.json();
									})
									.then(data => {
										const expected = errors.filterNotFound404(0, 'videotrack0', 'string');
										assert.equal(data.err, expected.err, 'wrong error title in response');
										assert.equal(data.msg, expected.msg, 'wrong error message in response');
										done();
									});
							})
							.catch(error => done(error));
					})
					.catch(error => done(error));
			})
				.catch(error => done(error));
		});
	});

});
