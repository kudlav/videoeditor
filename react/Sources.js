import React, { Component } from 'react';
import Dropzone from 'react-dropzone-uploader'

export default class Sources extends Component {
	constructor(props) {
		super(props);
		this.state = { items: this.props.items };
	}

	render() {
		const { items } = this.props;

		return (
			<>
            <h3><i className="material-icons" aria-hidden="true">video_library</i>Seznam záběrů</h3>
			<table>
				<tbody>
					{items.map(row => {
						<SourcesTableRow row={row} />
					})}
					<tr>
						<td colSpan="3">
							<Uploader />
						</td>
					</tr>
				</tbody>
			</table>
			</>
		);
	}
}

const SourcesTableRow = ({row}) => (
	<tr>/*
		<td key={row.name}>{row.name}</td>
		<td key={row.id}>{row.id}</td>
		<td key={row.price}>{row.price}</td>
	*/</tr>
);

class Uploader extends Component {

	getUploadParams({ meta }) {
		return { url: '/api/project/1234/file' };
	}

	handleChangeStatus({ meta, xhr, remove }, status) {
		if (status === 'done') {
			console.log(`${meta.name} uploaded!`);
			console.log(xhr);
			remove();
		} else if (status === 'aborted') {
			console.log(`${meta.name}, upload failed...`);
		}
	}

	render () {
		return (
			<Dropzone
				getUploadParams={this.getUploadParams}
				onChangeStatus={this.handleChangeStatus}
				accept="image/*,audio/*,video/*"
				inputContent={(files, extra) => (extra.reject ? 'Nahrávat lze pouze video, audio a obrázkové soubory.' : 'Nahrát soubory')}
				styles={{
					dropzoneReject: { borderColor: '#7a281b', backgroundColor: '#DAA' },
					inputLabel: (files, extra) => (extra.reject ? { color: 'red' } : {}),
				}}
			/>
		)
	}
}
