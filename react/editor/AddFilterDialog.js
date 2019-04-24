import React, { Component } from 'react';
import Modal from 'react-modal';
import config from '../../config';

Modal.setAppElement(document.body);

export default class AddFilterDialog extends Component {

	constructor(props) {
		super(props);

		this.state = {
			filter: config.filters[0].id,
			level: 100,
		};

		this.handleLevelChange = this.handleLevelChange.bind(this);
		this.handleFilterChange = this.handleFilterChange.bind(this);
		this.handleCloseDialog = this.handleCloseDialog.bind(this);
		this.handleAddFilter = this.handleAddFilter.bind(this);
	}

	render() {
		return (
			<div>
				<Modal
					isOpen={this.props.show}
					contentLabel="Přidat nový filtr"
					className={'modal'}
					overlayClassName={'overlay'}
					onRequestClose={this.handleCloseDialog}
				>

					<h2>Přidat nový filtr</h2>
					<div>
						<form>
							<label htmlFor={'filter'}>Filtr: </label>
							<select name={'filter'} onChange={this.handleFilterChange}>
								{config.filters.map((filter) => <option value={filter.id} key={filter.id}>{filter.title}</option>)}
							</select>
							<br/>
							<label htmlFor={'level'}>Úroveň: </label>
							<input type={'range'} name={'level'} min={0} max={200} defaultValue={100} onChange={this.handleLevelChange}/>
							<span> {this.state.level} %</span>
							<br/>
							<button onClick={this.handleAddFilter}>Přidat filtr</button>
							<button onClick={this.handleCloseDialog}>Storno</button>
						</form>
					</div>
				</Modal>
			</div>
		);
	}

	handleFilterChange(event) {
		this.setState({filter: event.target.value})
	}

	handleLevelChange(event) {
		this.setState({level: event.target.value});
	}

	handleCloseDialog() {
		this.setState({
			filter: config.filters[0].id,
			level: 100,
		});
		this.props.onClose();
	}

	handleAddFilter() {
		let filterOut;
		for (let filter of config.filters) {
			if (filter.id === this.state.filter) filterOut = filter.out;
		}
		let newFilter = {
			filter: this.state.filter,
			params: {},
		};

		for (let output of filterOut) {
			newFilter.params[output.id] = output.value({level: this.state.level});
		}

		this.props.onAdd(newFilter);

		this.handleCloseDialog();
	}
}
