/**
 * @file Controller for handling errors and exceptions
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

exports.default = (err, req, res, next) => {
	console.error(err.stack);
	res.status(500);
	res.json({
		msg: 'Internal server error occured.',
	});
};
