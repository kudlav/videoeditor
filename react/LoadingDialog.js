import React, { Component } from 'react';
import Modal from 'react-modal';

Modal.setAppElement(document.body);

export default class LoadingDialog extends Component {

	render() {
		return (
			<div>
				<Modal
					isOpen={true}
					contentLabel="Načítání"
					className={'modal'}
				>

					<h2>Načítání videoeditoru</h2>
					<div>
						<div className="loader"></div>
					</div>
				</Modal>
			</div>
		);
	}
}
