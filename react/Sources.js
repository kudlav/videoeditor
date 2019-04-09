import React, { Component } from 'react';
import Dropzone from 'react-dropzone-uploader'

export default class Sources extends Component {
	constructor(props) {
		super(props);
		this.state = { items: this.props.items };
	}

	addResource(resource) {
		const items = this.state.items.slice();
		items.push(resource);
		this.setState({items: items});
	}

	render() {
		return (
			<>
            <h3><i className="material-icons" aria-hidden="true">video_library</i>Seznam záběrů</h3>
			<table>
				<tbody>
					{this.state.items.map(item => <SourcesTableRow key={item.id} value={item} />)}
					<tr>
						<td colSpan="3">
							<Uploader value={resource => this.addResource(resource)} />
						</td>
					</tr>
				</tbody>
			</table>
			</>
		);
	}
}

const SourcesTableRow = props => (
	<tr>
		<td>
			<div><i className="material-icons resource-preview" aria-hidden="true">panorama</i></div>
		</td>
		<td>
			{props.value.name}<br/>
			<small>Délka: {props.value.duration}</small>
		</td>
		<td className="column-right">
			<a><i className="material-icons" aria-hidden="true">control_point</i></a>
			<a><i className="material-icons" aria-hidden="true">delete</i></a>
		</td>
	</tr>
);

class Uploader extends Component {

	constructor(props) {
		super(props);
		this.handleChangeStatus = this.handleChangeStatus.bind(this);
	}

	static getUploadParams() {
		return { url: '/api/project/1234/file' };
	}

	handleChangeStatus({ meta, xhr, remove }, status) {
		if (status === 'done') {
			console.log(`${meta.name} uploaded!`);
			const response = JSON.parse(xhr.response);
			this.props.value({
				id: response.resource_id,
				name: meta.name,
				duration: response.length,
				mime: response.resource_mime,
			});
			remove();
		} else if (status === 'aborted') {
			console.log(`${meta.name}, upload failed...`);
		}
	}

	render () {
		return (
			<Dropzone
				getUploadParams={Uploader.getUploadParams}
				onChangeStatus={this.handleChangeStatus}
				accept="image/*,audio/*,video/*"
				inputContent={(files, extra) => (extra.reject ? 'Nahrávat lze pouze video, audio a obrázkové soubory.' : 'Nahrát soubory')}
				inputWithFilesContent={'Nahrát soubory'}
				styles={{
					dropzoneReject: { borderColor: '#7a281b', backgroundColor: '#DAA' },
					inputLabel: (files, extra) => (extra.reject ? { color: 'red' } : {}),
				}}
			/>
		)
	}
}
