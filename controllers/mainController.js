/**
 * @file Controller for front GUI
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */
import config from '../config';
const fs = require('fs');
const path = require('path');

exports.main = (req, res) => res.render('main', {});
exports.project = (req, res) => res.render('project', {});

exports.finished = (req, res) => {

	fs.access(path.join(config.projectPath, req.params.projectID, 'processing'), fs.constants.R_OK, (err) => {
		if (err) res.sendFile(path.resolve(path.join(config.projectPath, req.params.projectID, 'output.mp4')));
		else res.render('finished', {});
	});
};
