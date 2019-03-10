import config from './config';

import express from 'express';

const server = express();

// View
server.engine('html', require('ejs').renderFile);
server.set('view engine', 'html');

// Router
const router = require('./router.js');
server.use('/', router);

server.use(express.static('public'));

server.listen(config.port, config.host, () => {
	console.info('Express listening on port', config.port);
});
