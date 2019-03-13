const server = require('express');
const router = server.Router();

// Require controller modules.
const mainController = require('./controllers/mainController');
const apiController = require('./controllers/apiController');

// Log access
router.use((req, res, next) => {
	const date = (new Date()).toLocaleString('en-GB' , {
		timeZone: 'UTC',
		hour12: false,
	});
	console.log(`[${date}] @ ${req.originalUrl}`);
	next(); // go to the next routes
});

// Homepage route
router.get('/', mainController.default);

// API route
router.all('/api', apiController.default);

router.post('/api/project', apiController.projectPOST);

router.post('/api/project/:projectID/uploadfile', apiController.projectUploadFilePOST);

module.exports = router;
