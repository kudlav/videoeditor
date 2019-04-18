import React, { Component } from 'react';
import Modal from 'react-modal';
import config from '../../config'

Modal.setAppElement(document.body);

export default class NewProjectDialog extends Component {

	createProject() {
		const url = `${config.apiUrl}/project`;
		const params = {
			method: 'POST',
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					window.location = `${config.serverUrl}/project/${data.project}`;
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

					<h2>Nový projekt</h2>
					<div>
						<button onClick={() => this.createProject()}>Vytvořit nový projekt</button>
					</div>
				</Modal>
			</div>
		);
	}
}
