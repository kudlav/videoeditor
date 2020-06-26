/**
 * @file Timeline.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import { Timeline as Vis } from 'vis-timeline/standalone';
import timeManager from '../../models/timeManager';
import TimelineModel from './TimelineModel';
import AddFilterDialog from './AddFilterDialog';
import {server} from '../../config';
import PropTypes from 'prop-types';

export default class Timeline extends Component {
	constructor(props) {
		super(props);

		this.timeline = null;

		this.state = {
			selectedItems: [],
			showAddFilterDialog: false,
			duration: '00:00:00,000',
		};

		this.onSelect = this.onSelect.bind(this);
		this.onTimeChange = this.onTimeChange.bind(this);
		this.onMoving = this.onMoving.bind(this);
		this.onMove = this.onMove.bind(this);
		this.buttonFilter = this.buttonFilter.bind(this);
		this.buttonSplit = this.buttonSplit.bind(this);
		this.buttonDel = this.buttonDel.bind(this);
		this.closeAddFilterDialog = this.closeAddFilterDialog.bind(this);
		this.getItemFromTrackIndex = this.getItemFromTrackIndex.bind(this);
		this.addTrack = this.addTrack.bind(this);
		this.delTrack = this.delTrack.bind(this);
	}

	componentDidMount() {
		const container = document.getElementById('timeline');
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
				updateGroup: true,
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
		this.timeline = new Vis(container, [], [], options);
		this.timeline.addCustomTime(new Date(1970, 0, 1));
		this.timeline.setCustomTimeTitle('00:00:00,000');
		this.timeline.on('select', this.onSelect);
		this.timeline.on('timechange', this.onTimeChange);
		this.timeline.on('moving', this.onMoving);
		this.timeline.on('move', this.onMove);
	}

	componentDidUpdate(prevProps) {

		const time = TimelineModel.dateToString(this.props.time);
		if (time > this.state.duration) {
			this.props.setTime(TimelineModel.dateFromString(this.state.duration));
		}
		else {
			this.timeline.setCustomTime(this.props.time);
			this.timeline.setCustomTimeTitle(TimelineModel.dateToString(this.props.time));
		}

		if (prevProps.items === this.props.items) return;

		const groups = [];
		const items = [];

		let duration = '00:00:00,000';
		const tracks = [...this.props.items.video, ...this.props.items.audio];
		const videoMatch = new RegExp(/^videotrack\d+/);
		for (let track of tracks) {
			groups.push({
				id: track.id,
				content: '<div style="width:0;height:66px;"></div>',
			});

			track.items.forEach((item, index) => {
				let content = this.props.resources[item.resource].name;
				if (item.filters.length > 0) content = '<div class="filter"></div><i class="filter material-icons">flare</i>' + content;
				items.push({
					id: track.id + ':' + index,
					content: content,
					start: TimelineModel.dateFromString(item.start),
					end: TimelineModel.dateFromString(item.end),
					group: track.id,
					className: (videoMatch.test(track.id)) ? 'video' : 'audio',
				});
			});

			if (track.duration > duration) {
				duration = track.duration;
			}
		}

		if (this.state.duration !== duration) this.setState({ duration: duration });

		const fitTimeline = (items.length > this.timeline.itemsData.length);

		this.timeline.setData({
			items: items,
			groups: groups,
		});

		if (fitTimeline) this.timeline.fit();
	}

	render() {
		return (
			<>
				<button onClick={this.buttonFilter}><i className="material-icons" aria-hidden="true">flare</i>Filtry</button>
				{/*<button><i className="material-icons" aria-hidden="true">photo_filter</i>Přidat přechod</button>*/}
				<button onClick={this.buttonSplit}><i className="material-icons" aria-hidden="true">flip</i>Rozdělit v bodě</button>
				{/*<button><i className="material-icons" aria-hidden="true">menu</i>Vlastnosti</button>*/}
				<button onClick={this.buttonDel}><i className="material-icons" aria-hidden="true">remove</i>Odebrat</button>
				<div id="time">{TimelineModel.dateToString(this.props.time)} / {this.state.duration}</div>
				<div id="timeline"/>
				{this.state.showAddFilterDialog && <AddFilterDialog
					item={this.state.selectedItems[0]}
					getItem={this.getItemFromTrackIndex}
					project={this.props.project}
					onClose={this.closeAddFilterDialog}
					onAdd={(filter) => this.props.onAddFilter(filter)}
					onDel={(filter) => this.props.onDelFilter(filter)}
					fetchError={this.props.fetchError}
				/>}
			</>
		);
	}

	onSelect(properties) {
		this.setState({ selectedItems: properties.items });
	}

	buttonFilter() {
		if (this.state.selectedItems.length === 0) return;
		this.setState({ showAddFilterDialog: true });
	}

	closeAddFilterDialog() {
		this.setState({ showAddFilterDialog: false });
	}

	buttonSplit() {
		if (this.state.selectedItems.length !== 1) return;

		const item = this.getItemFromTrackIndex(this.state.selectedItems[0]);
		const splitTime = TimelineModel.dateToString(this.timeline.getCustomTime());
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
			.catch(error => this.props.fetchError(error.message))
		;
	}

	buttonDel() {
		if (this.state.selectedItems.length !== 1) return;

		const itemPath = this.state.selectedItems[0].split(':');
		const url = `${server.apiUrl}/project/${this.props.project}/item`;
		const params = {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				track: itemPath[0],
				item: Number(itemPath[1]),
			}),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					const track = TimelineModel.findTrack(this.props.items, itemPath[0]);
					if (itemPath[0] !== 'videotrack0' && itemPath[0] !== 'audiotrack0' && TimelineModel.findItem(track.items, 1) === undefined) {
						this.delTrack(itemPath[0]);
					}
					else this.props.loadData();

					this.setState({ selectedItems: [] });
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => this.props.fetchError(error.message))
		;
	}

	getItemFromTrackIndex(trackIndex) {
		const itemPath = trackIndex.split(':');
		const trackItems = TimelineModel.findTrack(this.props.items, itemPath[0]).items;
		return TimelineModel.findItem(trackItems, Number(itemPath[1]));
	}

	onTimeChange(event) {
		const timePointer = TimelineModel.dateToString(event.time);

		if (event.time.getFullYear() < 1970) {
			this.props.setTime(new Date(1970, 0, 1));
		}
		else if (timePointer > this.state.duration) {
			this.props.setTime(TimelineModel.dateFromString(this.state.duration));
		}
		else {
			this.props.setTime(event.time);
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
					track: itemPath[0],
					trackTarget: item.group,
					item: Number(itemPath[1]),
					time: TimelineModel.dateToString(item.start),
				}),
			};

			fetch(url, params)
				.then(response => response.json())
				.then(data => {
					if (typeof data.err !== 'undefined') {
						alert(`${data.err}\n\n${data.msg}`);
					}
					else {
						if (itemPath[0] === item.group) { // Same track
							this.props.loadData();
						}
						else { // Moving between tracks
							const trackType = (item.group.includes('audio')) ? 'audio' : 'video';
							const prevTrack = TimelineModel.findTrack(this.props.items, itemPath[0]);
							const newTrack = TimelineModel.findTrack(this.props.items, item.group);

							const addTrack = (newTrack.items.length === 0); //
							const delTrack = (TimelineModel.findItem(prevTrack.items, 1) === undefined);

							if (addTrack && delTrack) this.addTrack(trackType, prevTrack.id);
							else if (addTrack) this.addTrack(trackType, null);
							else if (delTrack) this.delTrack(prevTrack.id);
							else this.props.loadData();
						}
					}
				})
				.catch(error => this.props.fetchError(error.message))
			;

		}
	}

	itemMove(item) {
		if (item.start.getFullYear() < 1970) return null; // Deny move before zero time
		else {
			const itemPath = item.id.split(':');

			if (!(item.group.includes('videotrack') && itemPath[0].includes('videotrack'))) {
				if (!(item.group.includes('audiotrack') && itemPath[0].includes('audiotrack'))) {
					return null;
				}
			}

			item.className = (item.className.includes('video')) ? 'video' : 'audio';
			const itemIndex = (itemPath[0] === item.group) ? Number(itemPath[1]) : null;
			const start = TimelineModel.dateToString(item.start);
			const end = TimelineModel.dateToString(item.end);
			const track = TimelineModel.findTrack(this.props.items, item.group);
			const collision = TimelineModel.getItemInRange(track, itemIndex, start, end);
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
					item.className = (item.className === 'video') ? 'video stick-right' : 'audio stick-right';
					itemEnd = collision[0].start;
					item.end = TimelineModel.dateFromString(itemEnd);

					itemStart = timeManager.subDuration(collision[0].start, duration);
					item.start = TimelineModel.dateFromString(itemStart);
					if (item.start === null) return null; // Not enough space at begining of timeline
				}
				else {
					// Put after
					item.className = (item.className === 'video') ? 'video stick-left' : 'audio stick-left';
					itemStart = collision[0].end;
					item.start = TimelineModel.dateFromString(collision[0].end);

					itemEnd = timeManager.addDuration(collision[0].end, duration);
					item.end = TimelineModel.dateFromString(itemEnd);
				}
				// Check if there is enough space
				const track = TimelineModel.findTrack(this.props.items, item.group);
				if (TimelineModel.getItemInRange(track, itemIndex, itemStart, itemEnd).length === 0) {
					return item;
				}
				return null;
			}
		}
	}

	addTrack(type, delTrack) {
		const url = `${server.apiUrl}/project/${this.props.project}/track`;
		const params = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				type: type,
			}),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err !== 'undefined') {
					alert(`${data.err}\n\n${data.msg}`);
				}

				if (delTrack !== null) this.delTrack(delTrack);
				else this.props.loadData();
			})
			.catch(error => this.props.fetchError(error.message))
		;
	}

	delTrack(trackId) {
		const url = `${server.apiUrl}/project/${this.props.project}/track/${trackId}`;
		const params = {
			method: 'DELETE',
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err !== 'undefined') {
					alert(`${data.err}\n\n${data.msg}`);
				}
				this.props.loadData();
			})
			.catch(error => this.props.fetchError(error.message))
		;
	}
}

Timeline.propTypes = {
	resources: PropTypes.object.isRequired,
	items: PropTypes.object.isRequired,
	project: PropTypes.string.isRequired,
	onAddFilter: PropTypes.func.isRequired,
	onDelFilter: PropTypes.func.isRequired,
	loadData: PropTypes.func.isRequired,
	fetchError: PropTypes.func.isRequired,
	time: PropTypes.object.isRequired,
	setTime: PropTypes.func.isRequired
};
