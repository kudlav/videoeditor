/**
 * @file Manager for loading, saving and initializing projects
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import {config} from '../config';
import log from './logger';

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const RWlock = require('rwlock');

export default {

	/**
	 * Get XML string for new MLT project
	 *
	 * @returns {string} XML string
	 */
	init() {
		return '<mlt><playlist id="videotrack0"/><playlist id="audiotrack0"/>'+
			'<tractor id="main"><multitrack><track producer="videotrack0" /><track producer="audiotrack0" />'+
			'</multitrack></tractor></mlt>';
	},


	/**
	 * Save string as MLT file for specified project and release lock (create new or overwrite existing)
	 *
	 * @param {string} project
	 * @param {string} data String without XML declaration and without doctype
	 * @param {function} [release function (optional)
	 * @return {Promise<any>}
	 */
	save(project, data, release = undefined) {
		const filepath = path.join(config.projectPath, project, 'project.mlt');

		return new Promise((resolve, reject) => {
			fs.writeFile(filepath, (config.declareXML + data), (err) => {
				if (typeof release !== 'undefined') release();

				if (err) {
					log.error(`Unable to update file ${filepath}`);
					reject(err);
				}

				log.info(`File ${filepath} updated.`);
				resolve();
			});
		});
	},


	/**
	 * Load project MLT file
	 *
	 * @param {string} project Project ID.
	 * @param {string} mode Read 'r' or Write 'w'.
	 * @returns {Promise<[document, number, function]>}
	 */
	load(project, mode) {
		const lock = new RWlock();
		const filepath = path.join(config.projectPath, project, 'project.mlt');
		const lockFile = (mode === 'r') ? lock.readLock : lock.writeLock;
		return new Promise((resolve, reject) => {
			lockFile(filepath, (release) => {
				fs.open(filepath, 'r+', (err, fd) => {
					if (err) {
						release();
						return reject(err);
					}
					fs.readFile(fd, (err, data) => {
						if (err) {
							release();
							return reject(err);
						}
						const dom = new JSDOM(data, {contentType: 'application/xml'});
						const document = dom.window.document;

						if (mode === 'r') release();
						return resolve([document, fd, release]);
					});
				});
			});
		});
	},


	/**
	 * Get relative path of project directory
	 *
	 * @param {String} projectID
	 * @return {string}
	 */
	getDirectory(projectID) {
		return path.join(config.projectPath, projectID);
	},

};
