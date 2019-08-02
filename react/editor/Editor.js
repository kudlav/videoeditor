/**
 * @file Editor.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import LoadingDialog from './LoadingDialog';
import SubmitDialog from './SubmitDialog';
import Sources from './Sources';
import Timeline from './Timeline';
import {server} from '../../config';
import timeManager from '../../models/timeManager';
import FetchErrorDialog from './FetchErrorDialog';

export default class Editor extends Component {

	constructor(props) {
		super(props);
		this.loadData = this.loadData.bind(this);
		this.addResource = this.addResource.bind(this);
		this.delResource = this.delResource.bind(this);
		this.putResource = this.putResource.bind(this);
		this.addFilter = this.addFilter.bind(this);
		this.delFilter = this.delFilter.bind(this);
		this.addTrack = this.addTrack.bind(this);
		this.openSubmitDialog = this.openSubmitDialog.bind(this);
		this.closeSubmitDialog = this.closeSubmitDialog.bind(this);
		this.openFetchErrorDialog = this.openFetchErrorDialog.bind(this);
		this.closeFetchErrorDialog = this.closeFetchErrorDialog.bind(this);

		this.state = {
			project: window.location.href.match(/project\/([^/]*)/)[1],
			resources: {},
			timeline: {},
			loading: true,
			showSubmitDialog: false,
			showFetchError: false,
			fetchError: '',
		};

		this.loadData();
	}

	render() {
		return (
			<>
			<header>
				<LoadingDialog show={this.state.loading}/>
				<SubmitDialog show={this.state.showSubmitDialog} project={this.state.project} onClose={this.closeSubmitDialog}/>
				{this.state.showFetchError && <FetchErrorDialog msg={this.state.fetchError} onClose={this.closeFetchErrorDialog}/>}
				<a href={'/'}><button className="error"><i className="material-icons" aria-hidden="true">arrow_back</i>Zrušit úpravy</button></a>
				<div className="divider"/>
				{/*<button><i className="material-icons" aria-hidden="true">language</i>Jazyk</button>*/}
				{/*<button><i className="material-icons" aria-hidden="true">save_alt</i>Exportovat</button>*/}
				<button onClick={this.openSubmitDialog} className="success" style={{float: 'right'}}><i className="material-icons" aria-hidden="true">done_outline</i>Dokončit</button>
			</header>
			<main>
				<div>
					<Sources
						project={this.state.project}
						items={this.state.resources}
						onAddResource={this.addResource}
						onDelResource={this.delResource}
						onPutResource={this.putResource}
						fetchError={this.openFetchErrorDialog}
					/>
					<div id='preview'>
						<h3><i className="material-icons" aria-hidden={true}> movie_filter </i>Náhled</h3>
						<video/>
						<br/>
						<div className="prev-toolbar">
							<button className="no-border" title="Zastavit přehrávání"><i className="material-icons" aria-hidden="true">stop</i></button>
							<button title="Pokračovat v přehrávání"><i className="material-icons" aria-hidden="true">play_arrow</i></button>
							<button title="Pozastavit přehrávání"><i className="material-icons" aria-hidden="true">pause</i></button>
							<button title="Předchozí událost"><i className="material-icons" aria-hidden="true">skip_previous</i></button>
							<button title="Následující událost"><i className="material-icons" aria-hidden="true">skip_next</i></button>
						</div>
					</div>
				</div>
			</main>
			<footer>
				<Timeline
					resources={this.state.resources}
					items={this.state.timeline}
					project={this.state.project}
					onAddFilter={this.addFilter}
					onDelFilter={this.delFilter}
					loadData={this.loadData}
					fetchError={this.openFetchErrorDialog}
				/>
			</footer>
			</>
		);
	}

	loadData() {
		const url = `${server.apiUrl}/project/${this.state.project}`;
		const params = {
			method: 'GET',
		};
		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					this.setState({
						resources: data.resources,
						timeline: data.timeline,
					});
					this.setState({loading: false});
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => this.openFetchErrorDialog(error.message))
		;
	}

	addResource(resource) {
		const resources = Object.assign({}, this.state.resources);
		resources[resource.id] = resource;
		this.setState({resources: resources});
	}

	delResource(id) {
		const resources = Object.assign({}, this.state.resources);
		delete resources[id];
		this.setState({resources: resources});
	}

	putResource(id, duration, trackId) {
		const timeline = Object.assign({}, this.state.timeline);
		const track = Editor.findTrack(timeline, trackId);
		const trackLength = track.items.length;

		track.items.push({
			resource: id,
			in: '00:00:00,000',
			out: (duration !== null) ? duration : this.state.resources[id].duration,
			filters: [],
			transitionTo: null,
			transitionFrom: null,
		});
		this.setState({timeline: timeline});

		if (trackLength === 0) {
			this.addTrack((trackId.includes('audio')) ? 'audio' : 'video');
		}
	}

	addTrack(type) {
		const url = `${server.apiUrl}/project/${this.state.project}/track`;
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

				this.loadData();
			})
			.catch(error => this.openFetchErrorDialog(error.message))
		;
	}

	addFilter(parameters) {
		const url = `${server.apiUrl}/project/${this.state.project}/filter`;
		const params = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(parameters),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					const timeline = Object.assign({}, this.state.timeline);

					const track = Editor.findTrack(timeline, parameters.track);
					const item = Editor.findItem(track.items, parameters.item).item;

					item.filters.push({
						service: parameters.filter,
					});
					this.setState({timeline: timeline});
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => this.openFetchErrorDialog(error.message))
		;
	}

	delFilter(parameters) {
		const timeline = Object.assign({}, this.state.timeline);
		const track = Editor.findTrack(timeline, parameters.track);
		const item = Editor.findItem(track.items, parameters.item).item;

		item.filters = item.filters.filter(filter => filter.service !== parameters.filter);

		this.setState({timeline: timeline});
	}

	openSubmitDialog() {
		this.setState({showSubmitDialog: true});
	}

	closeSubmitDialog() {
		this.setState({showSubmitDialog: false});
	}

	/**
	 * Show Connection error dialog
	 *
	 * @param {String} msg
	 */
	openFetchErrorDialog(msg) {
		this.setState({
			showFetchError: true,
			fetchError: msg,
		});
	}

	/**
	 * Close Connection error dialog
	 */
	closeFetchErrorDialog() {
		this.setState({
			showFetchError: false,
			fetchError: '',
		});
	}

	/**
	 * Get track with specified trackId
	 *
	 * @param {Object} timeline
	 * @param {String} trackId
	 * @return {null|Object}
	 */
	static findTrack(timeline, trackId) {
		let track = null;
		for (let videotrack of timeline.video) {
			if (videotrack.id === trackId) {
				track = videotrack;
				break;
			}
		}
		if (track === null) {
			for (let audiotrack of timeline.audio) {
				if (audiotrack.id === trackId) {
					track = audiotrack;
					break;
				}
			}
		}

		return track;
	}

	/**
	 * Get nth item of track. Blanks are ignored, first element is zero element.
	 *
	 * @param {Array} items
	 * @param {Number} position
	 * @return {null|Object}
	 */
	static findItem(items, position) {
		let time = '00:00:00,000';
		let index = 0;
		for (let item of items) {
			if (item.resource === 'blank') {
				time = timeManager.addDuration(item.length, time);
			}
			else {
				let startTime = time;
				time = timeManager.addDuration(time, item.out);
				time = timeManager.subDuration(time, item.in);
				// todo Subtract transition duration
				if (index === position) {
					return {
						item: item,
						start: startTime,
						end: time,
					};
				}
				index++;
			}
		}
		return null;
	}
}
