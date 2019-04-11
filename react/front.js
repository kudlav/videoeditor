import React from 'react'
import ReactDOM from 'react-dom'
import Sources from './Sources'
import NewProjectDialog from './NewProjectDialog'

try {
	ReactDOM.render(<NewProjectDialog />, document.getElementById('newProjectDialog'));
}
catch (e) {}

const project = window.location.href.match(/project\/([^\/]*)/)[1];
ReactDOM.render(<Sources project={project} />, document.getElementById('sources'));
