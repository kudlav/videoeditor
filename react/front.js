import React from 'react'
import ReactDOM from 'react-dom'
import Sources from './Sources'
import NewProjectDialog from './NewProjectDialog'
import LoadingDialog from "./LoadingDialog";

if (document.getElementById('newProjectDialog') !== null) {
	// Landing page
	ReactDOM.render(<NewProjectDialog />, document.getElementById('newProjectDialog'));
}
else {
	// Project page

	//ReactDOM.render(<LoadingDialog />, document.getElementById('loadingDialog'));
	const project = window.location.href.match(/project\/([^\/]*)/)[1];
	ReactDOM.render(<Sources project={project} />, document.getElementById('sources'));
}
