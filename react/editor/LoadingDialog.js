/**
 * @file LoadingDialog.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';

Modal.setAppElement(document.body);

export default class LoadingDialog extends Component {

	render() {
		return (
			<div>
				<Modal
					isOpen={this.props.show}
					contentLabel="Načítání"
					className={'modal'}
					overlayClassName={'overlay'}
				>

					<h2>Načítání videoeditoru</h2>
					<div>
						<div className="loader"/>
					</div>
				</Modal>
			</div>
		);
	}
}

LoadingDialog.propTypes = {
	show: PropTypes.bool.isRequired,
};
