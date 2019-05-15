/**
 * @file NewProjectDialog.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import Modal from 'react-modal';
import {server} from '../../config';

Modal.setAppElement(document.body);

export default class NewProjectDialog extends Component {

	createProject() {
		const url = `${server.apiUrl}/project`;
		const params = {
			method: 'POST',
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					window.location = `${server.serverUrl}/project/${data.project}`;
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => console.error(error))
		;
	}

	render() {
		return (
			<div>
				<Modal
					isOpen={true}
					contentLabel="Nový projekt"
					className={'modal'}
					overlayClassName={'null'}
				>

					<h2 className={'logo'}><img src={'/icons/favicon.svg'} alt={'logo'}/>Videoeditor</h2>
					<div>
						<button onClick={() => this.createProject()}>Vytvořit nový projekt</button>
					</div>
				</Modal>
			</div>
		);
	}
}
