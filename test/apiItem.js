const { server } = require('../config');
const assert = require('assert').strict;
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const errors = require('../models/errors');

/**
 * item - Everything about timeline items
 */
describe('API: item - everything about timeline items', function () {

	describe('itemDELETE - error tests withour project', function () {
		it('delete item missing track should fail', function (done) {
			const expected = errors.parameterItemMissing400;
			fetch(`${server.apiUrl}/project/fuu/item`, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track" : "videotrack0" }',
			}) // remove item
				.then(res => {
					assert.equal(res.status, 400, 'return code itemDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('delete item missing item should fail', function (done) {
			const expected = errors.parameterItemMissing400;
			fetch(`${server.apiUrl}/project/fuu/item`, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "item" : 0 }',
			}) // remove item
				.then(res => {
					assert.equal(res.status, 400, 'return code itemDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('delete item in nonexisting project should fail', function (done) {
			const expected = errors.projectNotFound404;
			fetch(`${server.apiUrl}/project/fuu/item`, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "item" : 0, "track" : "videotrack0" }',
			}) // remove item
				.then(res => {
					assert.equal(res.status, 404, 'return code itemDELETE does not match');
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

	describe('itemDELETE - tests with project', function () {
		let projectId;
		beforeEach(() => // get new project
			fetch(`${server.apiUrl}/project`, {method: 'POST'})
				.then(res => res.json())
				.then(data => projectId = data.project)
				.catch(error => assert.fail(error))
		);

		it('delete item on nonexisting track should fail', function (done) {
			const expected = errors.trackNotFound404('fuu');
			fetch(`${server.apiUrl}/project/${projectId}/item`, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "item" : 0, "track" : "fuu" }',
			}) // remove item
				.then(res => {
					assert.equal(res.status, 404, 'return code itemDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('delete item on empty track should fail', function (done) {
			const expected = errors.itemNotFound404('0', 'videotrack0');
			fetch(`${server.apiUrl}/project/${projectId}/item`, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "item" : 0, "track" : "videotrack0" }',
			}) // remove item
				.then(res => {
					assert.equal(res.status, 404, 'return code itemDELETE does not match');
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

	describe('itemDELETE - tests with project and files', function () {
		let projectId;
		let fileId;
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
								fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
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

		it('delete simple item successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/item`, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "item" : 0, "track" : "videotrack0" }',
			}) // remove item
				.then(res => {
					assert.equal(res.status, 200, 'return code itemDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.msg, 'string', 'missing message in response');
					assert.notEqual(data.msg.length, 0, 'empty message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('delete item with filter successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, { // insert file
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track" : "videotrack0", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, 200, 'return code filePUT does not match');
					fetch(`${server.apiUrl}/project/${projectId}/filter`, { // add filter
						method: 'POST',
						headers: {'Content-Type': 'application/json; charset=utf-8'},
						body: '{ "track": "videotrack0", "item": 0, "filter": "string"}',
					})
						.then(res => {
							assert.equal(res.status, 200, 'return code filterPOST does not match');
							fetch(`${server.apiUrl}/project/${projectId}/item`, {
								method: 'DELETE',
								headers: {'Content-Type': 'application/json; charset=utf-8'},
								body: '{ "item" : 0, "track" : "videotrack0" }',
							}) // remove item
								.then(res => {
									assert.equal(res.status, 200, 'return code itemDELETE does not match');
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
				.catch(error => assert.fail(error));
		});
		/*
		it('delete item with transition successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, { // insert file
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track" : "videotrack0", "duration": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, 200, 'return code filePUT does not match');
					fetch(`${server.apiUrl}/project/${projectId}/transition`, { // add transition
						method: 'POST',
						headers: {'Content-Type': 'application/json; charset=utf-8'},
						body: '{ "track": "videotrack0", "itemA": 0, "itemB": 1, "transition": "fade", "duration": "00:00:01,000" }',
					})
						.then(res => {
							assert.equal(res.status, 200, 'return code transitionPOST does not match');
							fetch(`${server.apiUrl}/project/${projectId}/item`, {
								method: 'DELETE',
								headers: {'Content-Type': 'application/json; charset=utf-8'},
								body: '{ "item" : 0, "track" : "videotrack0" }',
							}) // remove item
								.then(res => {
									assert.equal(res.status, 200, 'return code itemDELETE does not match');
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
				.catch(error => assert.fail(error));
		});
 	*/
	});

	describe('itemPUTmove - simple error tests', function () {
		it('move item missing track parameter should fail', function (done) {
			const expected = errors.parameterMoveMissing400;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "trackTarget": "videotrack0", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item missing trackTarget parameter should fail', function (done) {
			const expected = errors.parameterMoveMissing400;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item missing item parameter should fail', function (done) {
			const expected = errors.parameterMoveMissing400;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "videotrack0", "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item missing time parameter should fail', function (done) {
			const expected = errors.parameterMoveMissing400;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "videotrack0", "item": 0 }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item to invalid time should fail', function (done) {
			const expected = errors.parameterTimeWrong400;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "videotrack0", "item": 0, "time": "-00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item to incompatible track should fail', function (done) {
			const expected = errors.tracksIncompatible400;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "audiotrack0", "trackTarget": "videotrack0", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item to incompatible track should fail', function (done) {
			const expected = errors.tracksIncompatible400;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "audiotrack0", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item on nonexisting project should fail', function (done) {
			const expected = errors.projectNotFound404;
			fetch(`${server.apiUrl}/project/fuu/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "videotrack0", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
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

	describe('itemMOVE - tests with project', function () {
		let projectId;
		beforeEach(() => // get new project
			fetch(`${server.apiUrl}/project`, {method: 'POST'})
				.then(res => res.json())
				.then(data => projectId = data.project)
				.catch(error => assert.fail(error))
		);

		it('move item from nonexisting track should fail', function (done) {
			const expected = errors.trackNotFound404('videotrack');
			fetch(`${server.apiUrl}/project/${projectId}/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack", "trackTarget": "videotrack0", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move item to nonexisting track should fail', function (done) {
			const expected = errors.trackNotFound404('videotrack');
			fetch(`${server.apiUrl}/project/${projectId}/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "videotrack", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('move nonexisting item should fail', function (done) {
			const expected = errors.itemNotFound404(0, 'videotrack0');
			fetch(`${server.apiUrl}/project/${projectId}/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "videotrack0", "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
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


	describe('itemMOVE - tests with files', function () {
		let projectId;
		let fileId;
		beforeEach(() => // get new project
			new Promise(resolve =>
				fetch(`${server.apiUrl}/project`, {method: 'POST'})
					.then(res => res.json())
					.then(data => {
						projectId = data.project;
						const form = new FormData();
						form.append('file', fs.createReadStream('./test/img.png'));
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
								fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
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
			)
		);

		it('move item conflict', function (done) {
			const expected = errors.moveNoSpace403;
			fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track" : "videotrack0", "duration": "00:00:01,000" }',
			}) // insert second file
				.then(res => {
					assert.equal(res.status, 200, 'return code filePUT does not match');
					fetch(`${server.apiUrl}/project/${projectId}/item/move`, {
						method: 'PUT',
						headers: {'Content-Type': 'application/json; charset=utf-8'},
						body: '{ "track": "videotrack0", "trackTarget": "videotrack0", "item": 0, "time": "00:00:00,500" }',
					}) // move item
						.then(res => {
							assert.equal(res.status, expected.code, 'return code itemPUTmove does not match');
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
		});

		it('move item successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/item/move`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "trackTarget": "videotrack0", "item": 0, "time": "00:00:00,500" }',
			}) // move item
				.then(res => {
					assert.equal(res.status, 200, 'return code itemPUTmove does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.msg, 'string', 'missing message in response');
					assert.notEqual(data.msg.length, 0, 'empty message in response');
					done();
				})
				.catch(error => done(error));
		});
	});


	describe('itemPUTsplit - simple error tests', function () {
		it('split item missing track parameter should fail', function (done) {
			const expected = errors.parameterSplitMissing400;
			fetch(`${server.apiUrl}/project/fuu/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "item": 0, "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTsplit does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('split item missing item parameter should fail', function (done) {
			const expected = errors.parameterSplitMissing400;
			fetch(`${server.apiUrl}/project/fuu/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "time": "00:00:00,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTsplit does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('split item missing time parameter should fail', function (done) {
			const expected = errors.parameterSplitMissing400;
			fetch(`${server.apiUrl}/project/fuu/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "item": 0, "track": "videotrack0" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTsplit does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('split item in invalid time should fail', function (done) {
			const expected = errors.parameterTimeWrong400;
			fetch(`${server.apiUrl}/project/fuu/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "time": "-00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTsplit does not match');
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


	describe('itemPUTsplit - tests with project', function () {
		let projectId;
		beforeEach(() => // get new project
			fetch(`${server.apiUrl}/project`, {method: 'POST'})
				.then(res => res.json())
				.then(data => projectId = data.project)
				.catch(error => assert.fail(error))
		);

		it('split item on nonexisting track should fail', function (done) {
			const expected = errors.trackNotFound404('fuu');
			fetch(`${server.apiUrl}/project/${projectId}/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "fuu", "item": 0, "time": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTsplit does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('split nonexisting item should fail', function (done) {
			const expected = errors.itemNotFound404(0, 'videotrack0');
			fetch(`${server.apiUrl}/project/${projectId}/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "time": "00:00:01,000" }',
			})
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTsplit does not match');
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


	describe('itemPUTsplit - tests with files', function () {
		let projectId;
		let fileId;
		beforeEach(() => // get new project
			new Promise(resolve =>
				fetch(`${server.apiUrl}/project`, {method: 'POST'})
					.then(res => res.json())
					.then(data => {
						projectId = data.project;
						const form = new FormData();
						form.append('file', fs.createReadStream('./test/img.png'));
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
								fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
									method: 'PUT',
									headers: {'Content-Type': 'application/json; charset=utf-8'},
									body: '{ "track" : "videotrack0", "duration": "00:00:02,000" }',
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
			)
		);

		it('split time longer than item duration should fail', function (done) {
			const expected = errors.parameterTimeRange400('00:00:02,000');
			fetch(`${server.apiUrl}/project/${projectId}/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "time": "00:00:02,000" }',
			}) // split item
				.then(res => {
					assert.equal(res.status, expected.code, 'return code itemPUTsplit does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('split item successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/item/split`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "track": "videotrack0", "item": 0, "time": "00:00:01,000" }',
			}) // split item
				.then(res => {
					assert.equal(res.status, 200, 'return code itemPUTsplit does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.msg, 'string', 'missing message in response');
					assert.notEqual(data.msg.length, 0, 'empty message in response');
					done();
				})
				.catch(error => done(error));
		});
	});

});
