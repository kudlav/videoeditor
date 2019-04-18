import React from 'react'
import ReactDOM from 'react-dom'
import NewProjectDialog from './newProject/NewProjectDialog'
import App from "./editor/Editor"

if (document.getElementById('newProjectDialog') !== null) {
	// Landing page
	ReactDOM.render(<NewProjectDialog />, document.getElementById('newProjectDialog'));
}
else {
	// Project page
	ReactDOM.render(<App />, document.getElementById('app'));
}
