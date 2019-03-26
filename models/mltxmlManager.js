/**
 * @file Manager for work with MLT files
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import config from "../config";
const fs = require('fs');
const path = require('path');

export default {

	/**
	 * Save string as MLT file for specified project (create new or overwrite existing)
	 *
	 * @param project
	 * @param data String without XML declaration and without doctype
	 * @return {Promise<any>}
	 */
	saveMLT(project, data) {
	const filepath = path.join(config.projectPath, project, 'project.mlt');

		return new Promise((resolve, reject) => {
			fs.writeFile(filepath, (config.declareXML + data), (err) => {
				if (err) {
					console.warn(new Date(), `Unable to update file ${filepath}`);
					reject(err);
				}

				console.info(new Date(), `File ${filepath} updated.`);
				resolve();
			});
		});
	},


	/**
	 * Check if entry is without any filter or transition
	 *
	 * @param {Element} node
	 * @return {boolean}
	 */
	isSimleNode(node) {
		return (node.tagName === 'entry');
	},


	/**
	 * Get NTH element of playlist - entry (for simple) / track (for complex)
	 *
	 * @param {Document} document
	 * @param {Element} track
	 * @param {Number} index
	 * @return {Element}
	 */
	getItem(document, track, index) {
		let i = 0;
		const entries = track.childNodes;
		for (let entry of entries) {
			// Simple entry
			if (new RegExp(/^producer/).test(entry.getAttribute('producer'))) {
				if (i === index) {
					return entry;
				}
				i++;
			}
			// Container of entries
			else {
				const tractor = document.getElementById(entry.getAttribute('producer'));
				const tracks = tractor.getElementsByTagName('multitrack').item(0).childNodes;
				for (let track of tracks) {
					if (i === index) {
						return track;
					}
					i++;
				}
			}
		}
		return null;
	},


	/**
	 * Get relative path of MLT file for specified project
	 *
	 * @param {String} projectID
	 * @return {string}
	 */
	getMLTpath(projectID) {
		return path.join(config.projectPath, projectID, 'project.mlt');
	}


}
