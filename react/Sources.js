import React, { Component } from 'react';
import Dropzone from 'react-dropzone-uploader'
import config from '../config'

export default class Sources extends Component {
	constructor(props) {
		super(props);
		this.state = {
			items: this.props.items,
			project: this.props.project,
		};
	}

	addResource(resource) {
		const items = Object.assign({}, this.state.items);
		items[resource.id] = resource;
		this.setState({items: items});
	}

	delResource(id) {
		const url = `${config.apiPath}/project/${this.state.project}/file/${id}`;
		const params = {
			method: 'DELETE',
		};

		fetch(url, params)
			.then(response => response.json())
			.then(data => {
				if (typeof data.err === 'undefined') {
					const items = Object.assign({}, this.state.items);
					delete items[id];
					this.setState({items: items});
					console.log(data);
					alert(data.msg);
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
            <h3><i className="material-icons" aria-hidden="true">video_library</i>Seznam záběrů</h3>
			<table>
				<tbody>
					{Object.keys(this.state.items).map(key =>
						<SourcesTableRow
							key={this.state.items[key].id}
							value={{item: this.state.items[key], onRemove: id => this.delResource(id)}}
						/>)
					}
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

class SourcesTableRow extends Component {
	constructor(props) {
		super(props);
		this.item = this.props.value.item;
	}

	render() {
		return (
			<tr>
				<td>
					<div><i className="material-icons resource-preview" aria-hidden="true">panorama</i></div>
				</td>
				<td>
					{this.item.name}<br/>
					{this.item.duration !== null && <small>Délka: {this.item.duration}</small>}
				</td>
				<td className="column-right">
					<button><i className="material-icons" aria-hidden="true">control_point</i></button>
					<button onClick={() => this.props.value.onRemove(this.item.id)}><i className="material-icons" aria-hidden="true">delete</i></button>
				</td>
			</tr>
		)
	}
}

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
