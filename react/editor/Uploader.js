/**
 * @file Uploader.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import Dropzone from 'react-dropzone-uploader';
import PropTypes from 'prop-types';

export default class Uploader extends Component {

	constructor(props) {
		super(props);
		this.handleChangeStatus = this.handleChangeStatus.bind(this);
		this.getUploadParams = this.getUploadParams.bind(this);
	}

	getUploadParams() {
		return {
			url: `/api/project/${this.props.project}/file`,
		};
	}

	handleChangeStatus({ meta, xhr, remove }, status) {
		if (status === 'done') {
			const response = JSON.parse(xhr.response);
			this.props.onAdd({
				id: response.resource_id,
				name: meta.name,
				duration: response.length,
				mime: response.resource_mime,
			});
			remove();
		} else if (status === 'aborted') {
			alert(`${meta.name}, upload failed...`);
		}
	}

	render () {
		return (
			<Dropzone
				getUploadParams={this.getUploadParams}
				onChangeStatus={this.handleChangeStatus}
				accept="image/*,audio/*,video/*"
				inputContent={(files, extra) => (extra.reject ? 'Nahrávat lze pouze video, audio a obrázkové soubory.' : 'Nahrát soubory')}
				inputWithFilesContent={'Nahrát soubory'}
				styles={{
					dropzoneReject: { borderColor: '#7a281b', backgroundColor: '#DAA' },
				}}
			/>
		);
	}
}

Uploader.propTypes = {
	onAdd: PropTypes.func.isRequired,
	project: PropTypes.string.isRequired,
};
