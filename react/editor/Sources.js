/**
 * @file Sources.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import {server} from '../../config';
import timeManager from '../../models/timeManager';
import Uploader from './Uploader';
import SourcesTableRow from './SourcesTableRow';
import PropTypes from 'prop-types';

export default class Sources extends Component {
	constructor(props) {
		super(props);

		this.delResource = this.delResource.bind(this);
		this.putResource = this.putResource.bind(this);
	}

	delResource(id) {
		const url = `${server.apiUrl}/project/${this.props.project}/file/${id}`;
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
			.catch(error => this.props.fetchError(error.message))
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

		const track = (this.props.items[id].mime.includes('audio/')) ? 'audiotrack0' : 'videotrack0';

		// Send request to API
		const url = `${server.apiUrl}/project/${this.props.project}/file/${id}`;
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
			.catch(error => this.props.fetchError(error.message))
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
								key={key}
								item={this.props.items[key]}
								onRemove={this.delResource}
								onInsert={this.putResource}
							/>)
						}
						<tr>
							<td colSpan="3">
								<Uploader
									onAdd={(resource) => this.props.onAddResource(resource)}
									project={this.props.project}
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}
}

Sources.propTypes = {
	project: PropTypes.string.isRequired,
	items: PropTypes.object.isRequired,
	onAddResource: PropTypes.func.isRequired,
	onDelResource: PropTypes.func.isRequired,
	onPutResource: PropTypes.func.isRequired,
	fetchError: PropTypes.func.isRequired,
};
