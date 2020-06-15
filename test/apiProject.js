const {server, config} = require('../config');
const assert = require('assert').strict;
const fetch = require('node-fetch');
const errors = require('../models/errors');

/**
 * project - Everything about project
 */
describe('API: project - everything about project', function () {

	describe('projectPOST', function () {
		it('create new project and get id', function (done) {
			fetch(`${server.apiUrl}/project`, {method: 'POST'})
				.then(res => {
					assert.equal(res.status, 200, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.err, 'undefined', 'response contains error');
					assert.equal(typeof data.project, 'string', 'missing project id in response');
					assert.notEqual(data.project.length, 0, 'empty project id in response');
					done();
				})
				.catch(error => done(error));
		});
	});

	describe('projectGET', function () {
		it('get non existing project should fail', function (done) {
			const expected = errors.projectNotFound404;
			fetch(`${server.apiUrl}/project/undefined`, {method: 'GET'})
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
			fetch(`${server.apiUrl}/project`, {method: 'POST'})
				.then(res => res.json())
				.then(data => projectId = data.project)
				.catch(error => assert.fail(error))
		);
		it('get existing project', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}`, {method: 'GET'})
				.then(res => {
					assert.equal(res.status, 200, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.err, 'undefined', 'response contains error');
					assert.equal(typeof data.project, 'string', 'missing project id in response');
					assert.notEqual(data.project.length, 0, 'empty project id in response');

					assert.equal(typeof data.resources, 'object', 'missing resources object');
					assert.equal(Object.keys(data.resources).length, 0, 'resources should be empty');

					assert.ok(Array.isArray(data.timeline.video), 'missing timeline video in response');
					assert.ok(Array.isArray(data.timeline.audio), 'missing timeline audio in response');
					assert.equal(data.timeline.video.length, 1, 'there should be one default video track');
					assert.equal(data.timeline.audio.length, 1, 'there should be one default audio track');
					assert.equal(data.timeline.video[0].id, 'videotrack0', 'wrong name of default video track');
					assert.equal(data.timeline.audio[0].id, 'audiotrack0', 'wrong name of default video track');
					assert.ok(Array.isArray(data.timeline.video[0].items), 'missing default video track items');
					assert.ok(Array.isArray(data.timeline.video[0].items), 'missing default audio track items');
					assert.equal(data.timeline.video[0].items.length, 0, 'default video track should be empty');
					assert.equal(data.timeline.audio[0].items.length, 0, 'default audio track should be empty');
					done();
				})
				.catch(error => done(error));
		});
	});

	describe('projectPUT', function () {
		let projectId;
		beforeEach(() => // get new project
			fetch(`${server.apiUrl}/project`, {method: 'POST'})
				.then(res => res.json())
				.then(data => projectId = data.project)
				.catch(error => assert.fail(error))
		);

		it('finish non existing project should fail', function (done) {
			const expected = errors.projectNotFound404;
			fetch(`${server.apiUrl}/project/undefined`, {method: 'PUT'})
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

		it('finish existing project without email', function (done) {
			fetch(`${server.apiUrl}/project/${projectId}`, {method: 'PUT'})
				.then(res => {
					assert.equal(res.status, 200, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.err, 'undefined', 'response contains error');
					assert.equal(typeof data.msg, 'string', 'missing msg in response');
					assert.notEqual(data.msg.length, 0, 'empty msg in response');
					done();
				})
				.catch(error => done(error));
		});

		it('finish existing project with email successfully', function (done) {
			const request = {
				method: 'PUT',
				headers: {'Content-Type': 'application/json; charset=utf-8'},
				body: `{ "email" : "${config.adminEmail}" }`
			};
			fetch(`${server.apiUrl}/project/${projectId}`, request)
				.then(res => {
					assert.equal(res.status, 200, 'return code does not match');
					return res.json();
				})
				.then(data => {
					assert.equal(typeof data.err, 'undefined', 'response contains error');
					assert.equal(typeof data.msg, 'string', 'missing msg in response');
					assert.notEqual(data.msg.length, 0, 'empty msg in response');

					// TRY to finish project quickly for the second time
					const expected = errors.projectStillRendering403;
					fetch(`${server.apiUrl}/project/${projectId}`, request)
						.then(async res => {
							if (res.status !== 200) {
								assert.equal(res.status, 403, 'return code does not match');
								data = await res.json();
								assert.equal(data.err, expected.err, 'wrong error title in response');
								assert.equal(data.msg, expected.msg, 'wrong error message in response');
								done();
							}
							else done();
						})
						.catch(error => done(error));
				})
				.catch(error => done(error));
		});
	});
});
