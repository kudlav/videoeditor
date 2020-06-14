const { server } = require('../config');
const assert = require('assert').strict;
const fetch = require('node-fetch');
const errors = require('../models/errors');

/**
 * track - Everything about tracks
 */
describe('API: track - everything about tracks', function () {

	describe('trackPOST - error tests only', function () {
		it('add track missing type should fail', function (done) {
			const expected = errors.parameterTrackTypeMissing400;
			fetch(`${server.apiUrl}/project/undefined/track`, {method: 'POST'})
				.then(res => {
					assert.equal(res.status, 400, 'return code trackPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add wrong track type should fail', function (done) {
			const expected = errors.parameterTrackTypeMissing400;
			fetch(`${server.apiUrl}/project/undefined/track`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "type" : "undefined" }',
			})
				.then(res => {
					assert.equal(res.status, 400, 'return code trackPOST does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('add track in nonexisting project should fail', function (done) {
			const expected = errors.projectNotFound404;
			fetch(`${server.apiUrl}/project/undefined/track`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "type" : "video" }',
			})
				.then(res => {
					assert.equal(res.status, 404, 'return code trackPOST does not match');
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

	describe('trackDELETE - error tests only', function () {
		let projectId;
		beforeEach(() => // Get new project
			fetch(`${server.apiUrl}/project`, { method: 'POST' })
				.then(res => {
					assert.equal(res.status, 200, 'return code trackPOST does not match');
					return res.json();
				})
				.then(data => projectId = data.project)
				.catch(error => assert.fail(error))
		);

		it('delete track in nonexisting project should fail', function (done) {
			const expected = errors.projectNotFound404;
			fetch(`${server.apiUrl}/project/undefined/track/videotrack0`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 404, 'return code trackDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => assert.fail(error));
		});

		it('delete nonexisting track should fail', function (done) {
			const expected = errors.trackNotFound404('undefined');
			fetch(`${server.apiUrl}/project/${projectId}/track/undefined`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 404, 'return code trackDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('delete default video track should fail', function (done) {
			const expected = errors.trackDefaultDel403;
			fetch(`${server.apiUrl}/project/${projectId}/track/videotrack0`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 403, 'return code trackDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('delete default audio track should fail', function (done) {
			const expected = errors.trackDefaultDel403;
			fetch(`${server.apiUrl}/project/${projectId}/track/audiotrack0`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 403, 'return code trackDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('delete nonempty track should fail', function (done) {
			const expected = errors.trackDefaultDel403;
			fetch(`${server.apiUrl}/project/${projectId}/track/audiotrack0`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 403, 'return code trackDELETE does not match');
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

	describe('trackPOST+DELETE', function () {
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

		it('remove default videotrack should fail', function (done) {
			const expected = errors.trackDefaultDel403;
			fetch(`${server.apiUrl}/project/${projectId}/track/videotrack0`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 403, 'return code trackDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('remove default audiotrack should fail', function (done) {
			const expected = errors.trackDefaultDel403;
			fetch(`${server.apiUrl}/project/${projectId}/track/audiotrack0`, { method: 'DELETE' })
				.then(res => {
					assert.equal(res.status, 403, 'return code trackDELETE does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(data.err, expected.err, 'wrong error title in response');
					assert.equal(data.msg, expected.msg, 'wrong error message in response');
					done();
				})
				.catch(error => done(error));
		});

		it('remove first video track successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/track`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "type" : "video" }',
			}) // add track
				.then(res => {
					assert.equal(res.status, 200, 'return code trackPOST does not match');
					return res.json();
				})
				.then(() => {
					fetch(`${server.apiUrl}/project/${projectId}/track/videotrack0`, {method: 'DELETE'}) // delete track
						.then(res => {
							assert.equal(res.status, 200, 'return code trackDELETE does not match');
							return res.json();
						})
						.then(data => {
							assert.equal(typeof data.msg, 'string', 'missing message in response');
							assert.notEqual(data.msg.length, 0, 'empty message in response');
							fetch(`${server.apiUrl}/project/${projectId}`, {method: 'GET'}) // check project state
								.then(res => {
									assert.equal(res.status, 200, 'return code projectGET does not match');
									return res.json();
								})
								.then(data => {
									assert.equal(data.timeline.video.length, 1, 'only videotrack0 should exists');
									assert.equal(data.timeline.video[0].id, 'videotrack0', 'wrong track was kept');
									done();
								})
								.catch(error => done(error));
						})
						.catch(error => done(error));
				})
				.catch(error => done(error));
		});

		it('remove first audio track successfully', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/track`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "type" : "audio" }',
			}) // add track
				.then(res => {
					assert.equal(res.status, 200, 'return code trackPOST does not match');
					return res.json();
				})
				.then(() => {
					fetch(`${server.apiUrl}/project/${projectId}/track/audiotrack0`, {method: 'DELETE'}) // delete track
						.then(res => {
							assert.equal(res.status, 200, 'return code trackDELETE does not match');
							return res.json();
						})
						.then(data => {
							assert.equal(typeof data.msg, 'string', 'missing message in response');
							assert.notEqual(data.msg.length, 0, 'empty message in response');
							fetch(`${server.apiUrl}/project/${projectId}`, {method: 'GET'}) // check project state
								.then(res => {
									assert.equal(res.status, 200, 'return code projectGET does not match');
									return res.json();
								})
								.then(data => {
									assert.equal(data.timeline.audio.length, 1, 'only audiotrack0 should exists');
									assert.equal(data.timeline.audio[0].id, 'audiotrack0', 'wrong track was kept');
									done();
								})
								.catch(error => done(error));
						})
						.catch(error => done(error));
				})
				.catch(error => done(error));
		});

		it('add & delete track', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}/track`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: '{ "type" : "video" }',
			}) // add track
				.then(res => {
					assert.equal(res.status, 200, 'return code trackPOST does not match');
					return res.json();
				})
				.then(data => {
					const trackId = data.track;
					fetch(`${server.apiUrl}/project/${projectId}/track/${trackId}`, {method: 'DELETE'}) // delete track
						.then(res => {
							assert.equal(res.status, 200, 'return code fileDELETE does not match');
							return res.json();
						})
						.then(data => {
							assert.equal(typeof data.msg, 'string', 'missing message in response');
							assert.notEqual(data.msg.length, 0, 'empty message in response');
							fetch(`${server.apiUrl}/project/${projectId}`, {method: 'GET'}) // check project state
								.then(res => {
									assert.equal(res.status, 200, 'return code projectGET does not match');
									return res.json();
								})
								.then(data => {
									assert.equal(data.timeline.video.length, 1, 'only videotrack0 should exists');
									assert.equal(data.timeline.video[0].id, 'videotrack0', 'wrong track was kept');
									done();
								})
								.catch(error => done(error));
						})
						.catch(error => done(error));
				})
				.catch(error => done(error));
		});
	});

});
