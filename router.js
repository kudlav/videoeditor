/**
 * @file Express routing service
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

const server = require('express');
const router = server.Router();

// Require controller modules.
const mainController = require('./controllers/mainController');
const apiController = require('./controllers/apiController');
const errorController = require('./controllers/errorController');

// Homepage route
router.get('/', mainController.main);
router.get('/project/:projectID', mainController.project);
router.get('/project/:projectID/output.mp4', mainController.finished);

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

router.delete('/api/project/:projectID/item', apiController.projectItemDELETE);

router.put('/api/project/:projectID/item/move', apiController.projectItemPUTmove);

router.put('/api/project/:projectID/item/split', apiController.projectItemPUTsplit);

router.post('/api/project/:projectID/track', apiController.projectTrackPOST);

router.delete('/api/project/:projectID/track/:trackID', apiController.projectTrackDELETE);

// Error handling
router.use(errorController.default);

module.exports = router;
