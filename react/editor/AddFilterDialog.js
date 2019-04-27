import React, { Component } from 'react';
import Modal from 'react-modal';
import filters from '../filters';
import timeManager from '../../models/timeManager';

Modal.setAppElement(document.body);

export default class AddFilterDialog extends Component {

	constructor(props) {
		super(props);

		this.state = {
			filter: filters.videoFilters[0].id,
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
						<form onSubmit={this.handleAddFilter}>
							<label htmlFor={'filter'}>Filtr: </label>
							<select name={'filter'} onChange={this.handleFilterChange}>
								{filters.videoFilters.map((filter) => <option value={filter.id} key={filter.id}>{filter.title}</option>)}
								{filters.audioFilters.map((filter) => <option value={filter.id} key={filter.id}>{filter.title}</option>)}
							</select>
							<br/>
							{AddFilterDialog.getFilter(this.state.filter).in[0].id === 'level' &&
								<>
								<label htmlFor={'level'}>Úroveň: </label>
								<input type={'range'} name={'level'} min={0} max={200} defaultValue={100} onChange={this.handleLevelChange}/>
								<span> {this.state.level} %</span>
								</>
							}
							{AddFilterDialog.getFilter(this.state.filter).in[0].id === 'duration' &&
								<>
								<label htmlFor={'duration'}>Doba trvání: </label>
								<input type={'text'} name={'duration'} defaultValue={'00:00:00,000'} required={true} pattern={'^\\d{2,}:\\d{2}:\\d{2},\\d{3}$'} title={'Doba trvání ve formátu 00:00:00,000'} onChange={this.handleLevelChange}/>
								</>
							}
							<br/>
							<input type={'submit'} value={'Přidat filtr'}/>
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
			filter: filters.videoFilters[0].id,
			level: 100,
		});
		this.props.onClose();
	}

	handleAddFilter(event) {
		event.preventDefault();

		let filter = AddFilterDialog.getFilter(this.state.filter);
		if (filter.in[0].id === 'duration' && !timeManager.isValidDuration(this.state.level)) {
			alert('Délka trvání musí být nenulová, ve formátu 00:00:00,000');
			return;
		}

		let newFilter = {
			filter: this.state.filter,
			params: {},
		};
		const input = {};

		for (let itemPath of this.props.item) {
			const item = this.props.getItem(itemPath);
			const itemParts = itemPath.split(':');
			newFilter.track = itemParts[0];
			newFilter.item = Number(itemParts[1]);

			for (let output of filter.out) {
				input[filter.in[0].id] = this.state.level;
				newFilter.params[output.id] = output.value(input, item);
			}

			this.props.onAdd(newFilter);
		}

		this.handleCloseDialog();
	}

	/**
	 * Get filter object form config by its ID.
	 *
	 * @param {string} id
	 * @return {Object|null}
	 */
	static getFilter(id) {
		for (let filter of filters.videoFilters) {
			if (filter.id === id) {
				return filter;
			}
		}
		for (let filter of filters.audioFilters) {
			if (filter.id === id) {
				return filter;
			}
		}
		return null;
	}
}
