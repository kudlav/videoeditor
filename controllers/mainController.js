/**
 * @file Controller for front GUI
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import {config} from '../config';
const fs = require('fs');
const path = require('path');

exports.main = (req, res) => res.render('main', {});
exports.project = (req, res) => res.render('project', {});

exports.finished = (req, res) => {
	const projectID = path.basename(req.params.projectID); // Sanitize input
	const outputFile = path.resolve(path.join(config.projectPath, projectID, 'output.mp4'));
	if (!outputFile.startsWith(path.resolve(config.projectPath))) { // Ensure path is within the intended directory
		return res.sendStatus(403); // Forbidden
	}
	fs.access(outputFile, fs.constants.R_OK, (err) => {
		if (err) {
			res.sendStatus(404);
		}
		else res.sendFile(outputFile);
	});
};
