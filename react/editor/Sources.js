import React, { Component } from 'react';
import {server} from '../../config';
import timeManager from '../../models/timeManager';
import Uploader from './Uploader';
import SourcesTableRow from './SourcesTableRow';

export default class Sources extends Component {
	constructor(props) {
		super(props);
		this.state = {
			project: this.props.project,
		};

		this.delResource = this.delResource.bind(this);
		this.putResource = this.putResource.bind(this);
	}

	delResource(id) {
		const url = `${server.apiUrl}/project/${this.state.project}/file/${id}`;
		const params = {
			method: 'DELETE',
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					this.props.onDelResource(id);
				}
				else {
					alert(`${data.err}\n\n${data.msg}`);
				}
			})
			.catch(error => console.error(error))
		;
	}

	putResource(id) {
		// Get duration for image files
		let duration = null;
		if (new RegExp(/^image\//).test(this.props.items[id].mime)) {
			duration = prompt('Zadejte délku trvání', '00:00:00,000');
			if (duration === null) return;

			if (!timeManager.isValidDuration(duration)) {
				alert('Zadejte nenulovou délku ve formátu HH:MM:SS,sss');
				this.putResource(id);
				return;
			}
		}

		const track = (new RegExp(/^video\//).test(this.props.items[id].mime)) ? 'videotrack0' : 'audiotrack0';

		// Send request to API
		const url = `${server.apiUrl}/project/${this.state.project}/file/${id}`;
		const params = {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				track: track,
				duration: duration,
			}),
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					this.props.onPutResource(id, duration, track);
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
			<div id={'sources'}>
				<h3><i className="material-icons" aria-hidden="true">video_library</i>Seznam záběrů</h3>
				<table>
					<tbody>
						{Object.keys(this.props.items).map(key =>
							<SourcesTableRow
								key={this.props.items[key].id}
								item={this.props.items[key]}
								onRemove={this.delResource}
								onInsert={this.putResource}
							/>)
						}
						<tr>
							<td colSpan="3">
								<Uploader value={{
									onAdd: resource => this.props.onAddResource(resource),
									project: this.state.project,
								}}
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}
}
