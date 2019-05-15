/**
 * @file React binding to HTML file
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React from 'react';
import ReactDOM from 'react-dom';
import NewProjectDialog from './newProject/NewProjectDialog';
import Editor from './editor/Editor';

if (document.getElementById('newProjectDialog') !== null) {
	// Landing page
	ReactDOM.render(<NewProjectDialog />, document.getElementById('newProjectDialog'));
}
else {
	// Project page
	ReactDOM.render(<Editor />, document.getElementById('app'));
}
