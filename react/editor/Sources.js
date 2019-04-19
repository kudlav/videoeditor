import React, { Component } from 'react';
import config from '../../config'
import Uploader from './Uploader';
import SourcesTableRow from './SourcesTableRow';

export default class Sources extends Component {
	constructor(props) {
		super(props);
		this.state = {
			project: this.props.project,
		};
	}

	delResource(id) {
		const url = `${config.apiUrl}/project/${this.state.project}/file/${id}`;
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

	render() {
		return (
			<div id={'sources'}>
				<h3><i className="material-icons" aria-hidden="true">video_library</i>Seznam záběrů</h3>
				<table>
					<tbody>
						{Object.keys(this.props.items).map(key =>
							<SourcesTableRow
								key={this.props.items[key].id}
								value={{
									item: this.props.items[key],
									onRemove: id => this.delResource(id),
								}}
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
