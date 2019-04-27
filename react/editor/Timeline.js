import React, { Component } from 'react';
import vis from 'vis';
import timeManager from '../../models/timeManager';
import AddFilterDialog from './AddFilterDialog';
import Editor from './Editor';

export default class Timeline extends Component {
	constructor(props) {
		super(props);

		this.timeline = null;

		this.state = {
			selectedItems: [],
			showAddFilterDialog: false,
		};

		this.onSelect = this.onSelect.bind(this);
		this.buttonFilter = this.buttonFilter.bind(this);
		this.closeAddFilterDialog = this.closeAddFilterDialog.bind(this);
		this.addFilter = this.addFilter.bind(this);
		this.getItem = this.getItem.bind(this);
	}

	componentDidMount() {
		const container = document.getElementById('vis-timeline');
		const options = {
			orientation: 'top',
			min: new Date(1970, 0, 1),
			max: new Date(1970, 0, 1, 23, 59, 59, 999),
			showCurrentTime: false,
			multiselect: true,
			multiselectPerGroup: true,
			stack: false,
			zoomMin: 100,
			zoomMax: 21600000,
			format: {
				minorLabels: {
					millisecond:'SSS [ms]',
					second:     's [s]',
					minute:     'HH:mm:ss',
					hour:       'HH:mm:ss',
					weekday:    'HH:mm:ss',
					day:        'HH:mm:ss',
					week:       'HH:mm:ss',
					month:      'HH:mm:ss',
					year:       'HH:mm:ss'
				},
				majorLabels: {
					millisecond:'HH:mm:ss',
					second:     'HH:mm:ss',
					minute:     '',
					hour:       '',
					weekday:    '',
					day:        '',
					week:       '',
					month:      '',
					year:       ''
				}
			}
		};
		this.timeline = new vis.Timeline(container, [], [], options);
		this.timeline.on('select', this.onSelect);
	}

	componentDidUpdate(prevProps, prevState) {

		if (prevProps.items === this.props.items) return;

		const groups = [];
		const items = [];

		for (let track of this.props.items.video) {
			groups.push({
				id: track.id,
				content: '',
			});

			let actualTime = '00:00:00,000';
			let index = 0;

			for (let item of track.items) {
				if (item.resource === 'blank') {
					actualTime = timeManager.addDuration(item.length, actualTime);
				}
				else {
					const timeIn = actualTime.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					actualTime = timeManager.addDuration(actualTime, item.out);
					actualTime = timeManager.subDuration(actualTime, item.in);
					const timeOut = actualTime.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					let content = this.props.resources[item.resource].name;
					if (item.filters.length > 0) content = '<div class="filter"></div><i class="filter material-icons">flare</i>' + content;
					// todo Subtract transition duration
					items.push({
						id: track.id + ':' + index,
						content: content,
						start: new Date(1970, 0, 1, Number(timeIn[1]), Number(timeIn[2]), Number(timeIn[3]), Number(timeIn[4])),
						end: new Date(1970, 0, 1, Number(timeOut[1]), Number(timeOut[2]), Number(timeOut[3]), Number(timeOut[4])),
						group: track.id,
						className: 'video',
					});
					index++;
				}
			}
		}

		this.timeline.setData({
			items: items,
			groups: groups,
		});

		this.timeline.fit();
	}

	render() {
		return (
			<>
			<button onClick={this.buttonFilter}><i className="material-icons" aria-hidden="true">flare</i>Přidat filtr</button>
			<button><i className="material-icons" aria-hidden="true">photo_filter</i>Přidat přechod</button>
			<button><i className="material-icons" aria-hidden="true">flip</i>Rozdělit v bodě</button>
			<button><i className="material-icons" aria-hidden="true">menu</i>Vlastnosti</button>
			<button><i className="material-icons" aria-hidden="true">remove</i>Odebrat</button>
			<div id="time">00:00:00 / 00:00:00</div>
			<div id="vis-timeline"/>
			<AddFilterDialog show={this.state.showAddFilterDialog} item={this.state.selectedItems} getItem={this.getItem} onClose={this.closeAddFilterDialog} onAdd={this.addFilter}/>
			</>
		);
	}

	onSelect(properties) {
		this.setState({selectedItems: properties.items});
	}

	buttonFilter() {
		if (this.state.selectedItems.length === 0) return;

		this.setState({showAddFilterDialog: true});
	}

	closeAddFilterDialog() {
		this.setState({showAddFilterDialog: false});
	}

	addFilter(filter) {
		this.props.onAddFilter(filter);
	}

	getItem(trackIndex) {
		const itemPath = trackIndex.split(':');
		const trackItems = Editor.findTrack(this.props.items, itemPath[0]).items;
		return Editor.findItem(trackItems, Number(itemPath[1]));
	}
}
