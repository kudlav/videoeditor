const { server } = require('../config');
const fs = require('fs');
const assert = require('assert').strict;
const fetch = require('node-fetch');
const FormData = require('form-data');
const errors = require('../models/errors');

/**
 * file - Everything about file resources
 */
describe('API: file - everything about file resources', function () {

	describe('filePOST', function () {
		it('upload without file should fail', function (done) {
			const expected = errors.uploadMissingFile400;
			fetch(`${server.apiUrl}/project/undefined/file`, { method: 'POST' })
				.then(res => {
					assert.equal(res.status, 400, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('upload to nonexisting project should fail', function (done) {
			const expected = errors.projectNotFound404;
			const form = new FormData();
			form.append('file', fs.createReadStream('./test/img.png'));
			fetch(`${server.apiUrl}/project/undefined/file`, {
				method: 'POST',
				headers: form.getHeaders(),
				body: form
			})
				.then(res => {
					assert.equal(res.status, 404, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		let projectId;
		before(() => // get new project
			fetch(`${server.apiUrl}/project`, { method: 'POST' })
				.then(res => res.json())
				.then(data => projectId = data.project)
				.catch((error) => assert.fail(error))
		);
		it('upload file should succeed, delete file should fail', function (done) {
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
				.then(data => {
					const resourceId = data.resource_id;
					assert.equal(typeof data.msg, 'string', 'missing message in response');
					assert.equal(typeof data.resource_id, 'string', 'missing resource_id in response');
					assert.notEqual(data.msg.length, 0, 'empty message in response');
					assert.notEqual(data.resource_id.length, 0, 'empty resource_id in response');

					fetch(`${server.apiUrl}/project/${projectId}`, { method: 'GET' }) // check project state
						.then(res => {
							assert.equal(res.status, 200, 'return code projectGET does not match');
							return res.json();
						})
						.then(data => {
							assert.equal(typeof data.resources, 'object', 'missing resources object');
							assert.equal(Object.keys(data.resources).length, 1, 'resources should contain one file');
							assert.equal(typeof data.resources[resourceId], 'object', 'uploaded file in resources');
							assert.equal(typeof data.resources[resourceId].id, 'string', 'resource id missing');
							assert.equal(typeof data.resources[resourceId].mime, 'string', 'resource mime missing');
							assert.equal(typeof data.resources[resourceId].name, 'string', 'resource name missing');
							assert.equal(data.resources[resourceId].id, resourceId, 'uploaded file id mismatch');
							assert.equal(data.resources[resourceId].duration, null, 'uploaded file duration mismatch');
							assert.equal(data.resources[resourceId].mime, 'image/png', 'uploaded file mime mismatch');
							assert.equal(data.resources[resourceId].name, 'img.png', 'uploaded file name mismatch');

							assert.equal(data.timeline.video[0].items.length, 0, 'default video track should be empty');
							assert.equal(data.timeline.audio[0].items.length, 0, 'default audio track should be empty');
							done();
						})
						.catch(error => done(error));
				})
				.catch(error => done(error));
		});
	});

	describe('fileDELETE', function () {
		it('remove from nonexisting project should fail', function (done) {
			const expected = errors.projectNotFound404;
			fetch(`${server.apiUrl}/project/undefined/file/undefined`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 404, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('remove nonexisting file should fail', function (done) {
			const expected = errors.sourceNotFound404;
			fetch(`${server.apiUrl}/project/${projectId}/file/undefined`, { method: 'DELETE' }) // remove file
				.then(res => {
					assert.equal(res.status, 404, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		let projectId;
		let resourceId;
		before(() => { // get new project, upload file
			const form = new FormData();
			form.append('file', fs.createReadStream('./test/img.png'));

			return new Promise(resolve =>
				fetch(`${server.apiUrl}/project`, { method: 'POST' })
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
							.then(data => {
								resourceId = data.resource_id;
								resolve();
							})
							.catch(error => assert.fail(error));
					})
					.catch(error => assert.fail(error))
			);
		});
		it('remove file successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/file/${resourceId}`, { method: 'DELETE' }) // remove file
				.then(res => {
					assert.equal(res.status, 200, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.msg, 'string', 'missing error message in response');
					assert.notEqual(data.msg.length, 0, 'empty error message in response');
					fetch(`${server.apiUrl}/project/${projectId}`, {method: 'GET'}) // check project
						.then(res => {
							assert.equal(res.status, 200, 'return code does not match');
							return res.json();
						})
						.then(data => {
							assert.equal(Object.keys(data.resources).length, 0, 'resources should be empty');
							assert.equal(data.timeline.video[0].items.length, 0, 'default video track should be empty');
							assert.equal(data.timeline.audio[0].items.length, 0, 'default audio track should be empty');
							done();
						})
						.catch(error => done(error));
				})
				.catch(error => done(error));
		});
	});

	describe('filePUT', function () {

		describe('tests withou file', function () {
			it('insert with missing track parameter should fail', function (done) {
				const expected = errors.parameterTrackMissing400;
				fetch(`${server.apiUrl}/project/undefined/file/undefined`, { method: 'PUT' })
					.then(res => {
						assert.equal(res.status, 400, 'return code filePUT does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('insert in nonexisting project should fail', function (done) {
				const expected = errors.projectNotFound404;
				fetch(`${server.apiUrl}/project/undefined/file/undefined`, {
					method: 'PUT',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track" : "videotrack0" }',
				})
					.then(res => {
						assert.equal(res.status, 404, 'return code filePUT does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			let projectId;
			before(() => // get new project
				fetch(`${server.apiUrl}/project`, {method: 'POST'})
					.then(res => res.json())
					.then(data => projectId = data.project)
					.catch(error => assert.fail(error))
			);
			it('insert nonexisting resource should fail', function (done) {
				const expected = errors.sourceNotFound404;
				fetch(`${server.apiUrl}/project/${projectId}/file/undefined`, {
					method: 'PUT',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track" : "videotrack0" }',
				})
					.then(res => {
						assert.equal(res.status, 404, 'return code filePUT does not match');
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

		describe('tests with img files', function () {
			let projectId;
			let fileId;
			beforeEach(() => {// get new project, upload image
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
							})
								.then(res => res.json())
								.then(data => {
									fileId = data.resource_id;
									resolve();
								})
								.catch(error => assert.fail(error));
						})
						.catch(error => assert.fail(error))
				);
			});

			it('insert into nonexisting track should fail', function (done) {
				let expected = errors.trackNotFound404('undefined');
				fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
					method: 'PUT',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track" : "undefined" }',
				})
					.then(res => {
						assert.equal(res.status, 404, 'return code filePUT does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('insert image into wrong track type should fail', function (done) {
				let expected = errors.imgWrongTrack400;
				fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
					method: 'PUT',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track" : "audiotrack0" }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filePUT does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('insert img without duration should fail', function (done) {
				let expected = errors.parameterDurationMissing400;
				fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
					method: 'PUT',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track" : "videotrack0" }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filePUT does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('insert image into wrong track type should fail', function (done) {
				let expected = errors.imgWrongTrack400;
				fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
					method: 'PUT',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track" : "audiotrack0" }',
				})
					.then(res => {
						assert.equal(res.status, 400, 'return code filePUT does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(data.err, expected.err, 'wrong error title in response');
						assert.equal(data.msg, expected.msg, 'wrong error message in response');
						done();
					})
					.catch(error => done(error));
			});

			it('insert img successful', function (done) {
				fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
					method: 'PUT',
					headers: {'Content-Type': 'application/json; charset=utf-8'},
					body: '{ "track" : "videotrack0", "duration": "00:00:12,345" }',
				})
					.then(res => {
						assert.equal(res.status, 200, 'return code filePUT does not match');
						return res.json();
					})
					.then(data => {
						assert.equal(typeof data.msg, 'string', 'missing message in response');
						assert.equal(typeof data.timeline, 'string', 'missing timeline id in response');
						assert.notEqual(data.msg.length, 0, 'empty message in response');
						assert.notEqual(data.timeline.length, 0, 'empty timeline id in response');
						// try to remove used resource
						const expected = errors.sourceInUse403;
						fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {method: 'DELETE'}) // remove file
							.then(res => {
								assert.equal(res.status, 403, 'return code does not match');
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
		});

		describe('tests with different file types', function () {
			let projectId;
			beforeEach(() => // get new project
				fetch(`${server.apiUrl}/project`, {method: 'POST'})
					.then(res => res.json())
					.then(data => projectId = data.project)
					.catch(error => assert.fail(error))
			);
			it('insert audio into wrong track should fail', function (done) {
				const form = new FormData();
				form.append('file', fs.createReadStream('./test/audio.wav'));
				fetch(`${server.apiUrl}/project/${projectId}/file`, {
					method: 'POST',
					headers: form.getHeaders(),
					body: form
				})
					.then(res => {
						assert.equal(res.status, 200, 'return code filePOST does not match');
						return res.json();
					})
					.then(data => {
						fetch(`${server.apiUrl}/project/${projectId}/file/${data.resource_id}`, {
							method: 'PUT',
							headers: {'Content-Type': 'application/json; charset=utf-8'},
							body: '{ "track" : "videotrack0" }',
						}) // insert resource into timeline
							.then(res => {
								assert.equal(res.status, 400, 'return code filePUT does not match');
								return res.json();
							})
							.then(data => {
								assert.equal(typeof data.err, 'string', 'missing error title in response');
								assert.equal(typeof data.msg, 'string', 'missing error message in response');
								done();
							})
							.catch(error => done(error));
					})
					.catch(error => done(error));
			});
			it('insert video into wrong track should fail', function (done) {
				const form = new FormData();
				form.append('file', fs.createReadStream('./test/video.mp4'));
				fetch(`${server.apiUrl}/project/${projectId}/file`, {
					method: 'POST',
					headers: form.getHeaders(),
					body: form
				})
					.then(res => {
						assert.equal(res.status, 200, 'return code filePOST does not match');
						return res.json();
					})
					.then(data => {
						fetch(`${server.apiUrl}/project/${projectId}/file/${data.resource_id}`, {
							method: 'PUT',
							headers: {'Content-Type': 'application/json; charset=utf-8'},
							body: '{ "track" : "audiotrack0" }',
						}) // insert resource into timeline
							.then(res => {
								assert.equal(res.status, 400, 'return code filePUT does not match');
								return res.json();
							})
							.then(data => {
								assert.equal(typeof data.err, 'string', 'missing error title in response');
								assert.equal(typeof data.msg, 'string', 'missing error message in response');
								done();
							})
							.catch(error => done(error));
					})
					.catch(error => done(error));
			});

			it('insert text file should fail', function (done) {
				const expected = errors.fileWrongTrack403;
				const form = new FormData();
				form.append('file', fs.createReadStream('./test/text.txt'));
				fetch(`${server.apiUrl}/project/${projectId}/file`, {
					method: 'POST',
					headers: form.getHeaders(),
					body: form
				})
					.then(res => {
						assert.equal(res.status, 200, 'return code filePOST does not match');
						return res.json();
					})
					.then(data => {
						const fileId = data.resource_id;
						fetch(`${server.apiUrl}/project/${projectId}/file/${fileId}`, {
							method: 'PUT',
							headers: {'Content-Type': 'application/json; charset=utf-8'},
							body: '{ "track" : "videotrack0"}',
						})
							.then(res => {
								assert.equal(res.status, 403, 'return code filePUT does not match');
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
		});
	});

});
