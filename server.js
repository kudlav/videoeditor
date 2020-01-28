/**
 * @file Main file of the app
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import {server as config} from './config';
import express from 'express';

const server = express();

const bodyParser = require('body-parser');
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

const log4js = require('log4js');
import log from './models/logger';
server.use(log4js.connectLogger(log, { level: 'auto', statusRules: [
	{ codes: [304],  level: 'info' }
]}));

// View
server.engine('html', require('ejs').renderFile);
server.set('view engine', 'html');

// Router
const router = require('./router.js');
server.use('/', router);

server.use(express.static('public'));

server.listen(config.port, config.host, () => {
	log.info('Express listening on port', config.port);
});
