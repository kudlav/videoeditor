import React, { Component } from 'react';
import LoadingDialog from "./LoadingDialog";
import SubmitDialog from './SubmitDialog';
import Sources from "./Sources";
import Timeline from "./Timeline";
import config from "../../config";

export default class Editor extends Component {

	constructor(props) {
		super(props);
		this.addResource = this.addResource.bind(this);
		this.delResource = this.delResource.bind(this);
		this.putResource = this.putResource.bind(this);
		this.addFilter = this.addFilter.bind(this);
		this.openSubmitDialog = this.openSubmitDialog.bind(this);
		this.closeSubmitDialog = this.closeSubmitDialog.bind(this);

		this.state = {
			project: window.location.href.match(/project\/([^\/]*)/)[1],
			resources: {},
			timeline: {},
			loading: true,
			showSubmitDialog: false,
		};

		const url = `${config.apiUrl}/project/${this.state.project}`;
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
					this.loadFinished();
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
			<>
			<header>
				<LoadingDialog show={this.state.loading}/>
				<button className="error"><i className="material-icons" aria-hidden="true">arrow_back</i>Zrušit úpravy
				</button>
				<SubmitDialog show={this.state.showSubmitDialog} project={this.state.project} onClose={this.closeSubmitDialog}/>
				<div className="divider"/>
				<button><i className="material-icons" aria-hidden="true">language</i>Jazyk</button>
				<button><i className="material-icons" aria-hidden="true">save_alt</i>Exportovat</button>
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
					/>
					<div id='preview'>
						<h3><i className="material-icons" aria-hidden={true}> movie_filter </i>Náhled</h3>
						<video><source type="video/mp4" src="https://www.w3schools.com/html/mov_bbb.mp4"/></video>
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
					onAddFilter={this.addFilter}
				/>
			</footer>
			</>
		);
	}

	loadFinished() {
		this.setState({loading: false});
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

		track.items.push({
			resource: id,
			in: '00:00:00,000',
			out: (duration !== null) ? duration : this.state.resources[id].duration,
			filters: [],
			transitionTo: null,
			transitionFrom: null,
		});
		this.setState({timeline: timeline});
	}

	addFilter(parameters) {
		const url = `${config.apiUrl}/project/${this.state.project}/filter`;
		const params = {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(parameters),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					const timeline = Object.assign({}, this.state.timeline);

					const track = Editor.findTrack(timeline, parameters.track);
					const item = Editor.findItem(track.items, parameters.item);

					item.filters.push({
						service: parameters.filter,
					});
					this.setState({timeline: timeline});
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => console.error(error))
		;
	}

	openSubmitDialog() {
		this.setState({showSubmitDialog: true});
	}

	closeSubmitDialog() {
		this.setState({showSubmitDialog: false});
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
		let index = 0;
		for (let item of items) {
			if (item.resource === 'blank') continue;
			if (index === position) return item;
			index++;
		}
		return null;
	}
}
