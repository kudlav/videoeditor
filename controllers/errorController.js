/**
 * @file Controller for handling errors and exceptions
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import log from '../models/logger';

exports.default = (err, req, res, next) => {
	log.error(err.stack);
	res.status(500);
	res.json({
		msg: 'Internal server error occured.',
	});
};
