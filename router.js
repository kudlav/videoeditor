const server = require('express');
const router = server.Router();

// Require controller modules.
const mainController = require('./controllers/mainController');
const apiController = require('./controllers/apiController');

// Log access
router.use((req, res, next) => {
	console.log(req.url);
	next(); // go to the next routes
});

// Homepage route
router.get('/', mainController.default);

// API route
router.route('/api')
	.get(apiController.default);

module.exports = router;
