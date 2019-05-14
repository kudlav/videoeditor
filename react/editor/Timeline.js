import React, { Component } from 'react';
import vis from 'vis';
import timeManager from '../../models/timeManager';
import AddFilterDialog from './AddFilterDialog';
import Editor from './Editor';
import {server} from '../../config';

export default class Timeline extends Component {
	constructor(props) {
		super(props);

		this.timeline = null;

		this.state = {
			selectedItems: [],
			showAddFilterDialog: false,
			duration: '00:00:00,000',
			timePointer: '00:00:00,000',
		};

		this.onSelect = this.onSelect.bind(this);
		this.onTimeChange = this.onTimeChange.bind(this);
		this.onMoving = this.onMoving.bind(this);
		this.onMove = this.onMove.bind(this);
		this.buttonFilter = this.buttonFilter.bind(this);
		this.buttonSplit = this.buttonSplit.bind(this);
		this.buttonDel = this.buttonDel.bind(this);
		this.closeAddFilterDialog = this.closeAddFilterDialog.bind(this);
		this.getItem = this.getItem.bind(this);
	}

	componentDidMount() {
		const container = document.getElementById('vis-timeline');
		const options = {
			orientation: 'top',
			min: new Date(1970, 0, 1),
			max: new Date(1970, 0, 1, 23, 59, 59, 999),
			showCurrentTime: false,
			multiselect: false,
			multiselectPerGroup: true,
			stack: false,
			zoomMin: 100,
			zoomMax: 21600000,
			editable: {
				updateTime: true,
			},
			onMove: this.onMove,
			onMoving: this.onMoving,
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
		this.timeline.addCustomTime(new Date(1970, 0, 1));
		this.timeline.setCustomTimeTitle('00:00:00,000');
		this.timeline.on('select', this.onSelect);
		this.timeline.on('timechange', this.onTimeChange);
		this.timeline.on('moving', this.onMoving);
		this.timeline.on('move', this.onMove);
	}

	componentDidUpdate(prevProps) {

		if (prevProps.items === this.props.items) return;

		const groups = [];
		const items = [];

		let duration = '00:00:00,000';
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

			if (actualTime > duration) {
				duration = actualTime;
			}
		}

		if (this.state.duration !== duration) this.setState({duration: duration});

		this.timeline.setData({
			items: items,
			groups: groups,
		});

		this.timeline.fit();
	}

	render() {
		return (
			<>
			<button onClick={this.buttonFilter}><i className="material-icons" aria-hidden="true">flare</i>Filtry</button>
			{/*<button><i className="material-icons" aria-hidden="true">photo_filter</i>Přidat přechod</button>*/}
			<button onClick={this.buttonSplit}><i className="material-icons" aria-hidden="true">flip</i>Rozdělit v bodě</button>
			{/*<button><i className="material-icons" aria-hidden="true">menu</i>Vlastnosti</button>*/}
			<button onClick={this.buttonDel}><i className="material-icons" aria-hidden="true">remove</i>Odebrat</button>
			<div id="time">{this.state.timePointer} / {this.state.duration}</div>
			<div id="vis-timeline"/>
			{this.state.showAddFilterDialog && <AddFilterDialog
				item={this.state.selectedItems[0]}
				getItem={this.getItem}
				project={this.props.project}
				onClose={this.closeAddFilterDialog}
				onAdd={(filter) => this.props.onAddFilter(filter)}
				onDel={(filter) => this.props.onDelFilter(filter)}
			/>}
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

	buttonSplit() {
		if (this.state.selectedItems.length !== 1) return;

		const item = this.getItem(this.state.selectedItems[0]);
		const splitTime = Timeline.dateToString(this.timeline.getCustomTime());
		const splitItemTime = timeManager.subDuration(splitTime, item.start);
		if (splitTime <= item.start || splitTime >= item.end) return;

		const itemPath = this.state.selectedItems[0].split(':');
		const url = `${server.apiUrl}/project/${this.props.project}/item/split`;
		const params = {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				track: itemPath[0],
				item: Number(itemPath[1]),
				time: splitItemTime,
			}),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					this.props.loadData();
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => console.error(error))
		;
	}

	buttonDel() {
		if (this.state.selectedItems.length !== 1) return;

		const itemPath = this.state.selectedItems[0].split(':');
		const url = `${server.apiUrl}/project/${this.props.project}/item`;
		const params = {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				track: itemPath[0],
				item: Number(itemPath[1]),
			}),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					this.props.loadData();
					this.setState({selectedItems: []});
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => console.error(error))
		;
	}

	getItem(trackIndex) {
		const itemPath = trackIndex.split(':');
		const trackItems = Editor.findTrack(this.props.items, itemPath[0]).items;
		return Editor.findItem(trackItems, Number(itemPath[1]));
	}

	getItemInRange(timelineID, itemID, start, end) {
		const track = Editor.findTrack(this.props.items, timelineID);
		const items = [];
		let time = '00:00:00,000';
		let index = 0;
		for (let item of track.items) {
			if (item.resource === 'blank') {
				time = timeManager.addDuration(item.length, time);
			}
			else {
				if (end <= time) break;
				const timeStart = time;
				time = timeManager.addDuration(time, item.out);
				time = timeManager.subDuration(time, item.in);
				// todo Subtract transition duration
				if (index++ === itemID) continue; // Same item
				if (start >= time) continue;
				items.push({
					start: timeStart,
					end: time,
				});
			}
		}
		return items;
	}

	onTimeChange(event) {
		const timePointer = Timeline.dateToString(event.time);

		if (event.time.getFullYear() < 1970) {
			this.timeline.setCustomTime(new Date(1970, 0, 1));
			this.timeline.setCustomTimeTitle('00:00:00,000');
			this.setState({timePointer: '00:00:00,000'});
		}
		else if (timePointer > this.state.duration) {
			const parsedDuration = this.state.duration.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
			this.timeline.setCustomTime(new Date(1970, 0, 1, parsedDuration[1], parsedDuration[2], parsedDuration[3], parsedDuration[4]));
			this.timeline.setCustomTimeTitle(this.state.duration);
			this.setState({timePointer: this.state.duration});
		}
		else {
			this.setState({timePointer: timePointer});
			this.timeline.setCustomTimeTitle(timePointer);
		}
	}

	onMoving(item, callback) {
		callback(this.itemMove(item));
	}

	onMove(item) {
		item.className = 'video';

		item = this.itemMove(item);

		if (item !== null) {
			const itemPath = item.id.split(':');
			const url = `${server.apiUrl}/project/${this.props.project}/item/move`;
			const params = {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					track: item.group,
					trackTarget: item.group,
					item: Number(itemPath[1]),
					time: Timeline.dateToString(item.start),
				}),
			};

			fetch(url, params)
				.then(response => response.json())
				.then(data => {
					if (typeof data.err !== 'undefined') {
						alert(`${data.err}\n\n${data.msg}`);
					}

					this.props.loadData();
				})
				.catch(error => console.error(error))
			;

		}
	}

	itemMove(item) {
		if (item.start.getFullYear() < 1970) return null; // Deny move before zero time
		else {
			item.className = 'video';
			const itemPath = item.id.split(':');
			const start = Timeline.dateToString(item.start);
			const end = Timeline.dateToString(item.end);
			const collision = this.getItemInRange(item.group, Number(itemPath[1]), start, end);
			if (collision.length === 0) {
				// Free
				return item;
			}
			else if (collision.length > 1) {
				// Not enough space
				return null;
			}
			else {
				// Space maybe available before/after item
				let itemStart = '';
				let itemEnd = '';
				const duration = timeManager.subDuration(end, start);
				if (timeManager.middleOfDuration(start, end) < timeManager.middleOfDuration(collision[0].start, collision[0].end)) {
					// Put before
					item.className = 'video stick-right';
					itemEnd = collision[0].start;
					const itemEndParsed = itemEnd.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					item.end = new Date(1970, 0, 1, itemEndParsed[1], itemEndParsed[2], itemEndParsed[3], itemEndParsed[4]);

					itemStart = timeManager.subDuration(collision[0].start, duration);
					const itemStartParsed = itemStart.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					if (itemStartParsed === null) return null; // Not enough space at begining of timeline
					item.start = new Date(1970, 0, 1, itemStartParsed[1], itemStartParsed[2], itemStartParsed[3], itemStartParsed[4]);
				}
				else {
					// Put after
					item.className = 'video stick-left';
					itemStart = collision[0].end;
					const itemStartParsed = collision[0].end.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					item.start = new Date(1970, 0, 1, itemStartParsed[1], itemStartParsed[2], itemStartParsed[3], itemStartParsed[4]);

					itemEnd = timeManager.addDuration(collision[0].end, duration);
					const itemEndParsed = itemEnd.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					item.end = new Date(1970, 0, 1, itemEndParsed[1], itemEndParsed[2], itemEndParsed[3], itemEndParsed[4]);
				}
				// Check if there is enough space
				if (this.getItemInRange(item.group, Number(itemPath[1]), itemStart, itemEnd).length === 0) {
					return item;
				}
				return null;
			}
		}
	}

	/**
	 * Get duration format from Date object
	 *
	 * @param {Date} date
	 * @return {string} Duration in format '00:00:00,000'
	 */
	static dateToString(date) {
		let string = `${date.getHours()}:`;
		if (string.length < 3) string = '0' + string;

		string += `00${date.getMinutes()}:`.slice(-3);
		string += `00${date.getSeconds()},`.slice(-3);
		string += `${date.getMilliseconds()}000`.slice(0,3);
		return string;
	}
}
