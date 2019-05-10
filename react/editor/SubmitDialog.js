import React, { Component } from 'react';
import Modal from 'react-modal';
import config from '../../config';

Modal.setAppElement(document.body);

export default class SubmitDialog extends Component {

	constructor(props) {
		super(props);

		this.state = {
			email: '',
		};

		this.handleCloseDialog = this.handleCloseDialog.bind(this);
		this.handleSumbitDialog = this.handleSumbitDialog.bind(this);
		this.handleEmailChanged = this.handleEmailChanged.bind(this);
	}

	render() {
		return (
			<div>
				<Modal
					isOpen={this.props.show}
					contentLabel="Vyvedení projektu"
					className={'modal'}
					overlayClassName={'overlay'}
					onRequestClose={this.handleCloseDialog}
				>

					<h2>Vyvedení projektu</h2>
					<div>
						<form onSubmit={this.handleSumbitDialog}>
							<label htmlFor={'email'}>Emailová adresa: </label>
							<input type={'email'} name={'email'} required={true} size={30} value={this.state.email} onChange={this.handleEmailChanged}/>
							<br/>
							Doba zpracování projektu závisí na jeho délce.<br/>
							Zadejte email a my vám zašleme odkaz na výsledné video hned, jak bude zpracované.
							<br/>
							<input type={'submit'} className={'success'} value={'Zahájit'}/>
							<button onClick={this.handleCloseDialog}>Storno</button>
						</form>
					</div>
				</Modal>
			</div>
		);
	}

	handleCloseDialog() {
		this.setState({
			email: ''
		});
		this.props.onClose();
	}

	handleSumbitDialog(event) {
		event.preventDefault();

		const url = `${config.apiUrl}/project/${this.props.project}`;
		const params = {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: this.state.email,
			}),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					window.location = `${config.serverUrl}/project/${this.props.project}/finished`;
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => console.error(error))
		;
	}

	handleEmailChanged(event) {
		this.setState({
			email: event.target.value,
		});
	}

}
