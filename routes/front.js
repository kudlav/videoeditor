var server = require('express');
var router = server.Router();

// Require controller modules.
var main_controller = require('../controllers/mainController');
var api_controller = require('../controllers/apiController');

// Homepage route.
router.get('/', main_controller.default);

// About route
router.get('/api', api_controller.default);

module.exports = router;
