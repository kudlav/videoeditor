const server = require('express');
const router = server.Router();

// Require controller modules.
const mainController = require('./controllers/mainController');
const apiController = require('./controllers/apiController');
const errorController = require('./controllers/errorController');

// Log access
router.use((req, res, next) => {
	console.info(new Date(), ` @ ${req.originalUrl}`);
	next(); // go to the next routes
});

// Homepage route
router.get('/', mainController.main);
router.get('/project/:projectID', mainController.project);

// API route
router.all('/api', apiController.default);

router.post('/api/project', apiController.projectPOST);

router.get('/api/project/:projectID', apiController.projectGET);

router.put('/api/project/:projectID', apiController.projectPUT);

router.post('/api/project/:projectID/file', apiController.projectFilePOST);

router.delete('/api/project/:projectID/file/:fileID', apiController.projectFileDELETE);

router.put('/api/project/:projectID/file/:fileID', apiController.projectFilePUT);

router.post('/api/project/:projectID/filter', apiController.projectFilterPOST);

router.delete('/api/project/:projectID/filter', apiController.projectFilterDELETE);

router.post('/api/project/:projectID/transition', apiController.projectTransitionPOST);

// Error handling
router.use(errorController.default);

module.exports = router;
