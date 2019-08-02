/**
 * @file FetchErrorDialog.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import Modal from 'react-modal';
import PropTypes from 'prop-types';

Modal.setAppElement(document.body);

export default class FetchErrorDialog extends Component {

	render() {
		return (
			<div>
				<Modal
					isOpen={true}
					contentLabel="Chyba komunikace se serverem"
					className={'modal'}
					overlayClassName={'overlay'}
				>

					<h2 className={'error'}><img src={'/icons/error.svg'} alt={'error'}/>Chyba komunikace se serverem</h2>
					<div>
						<i>{this.props.msg}</i>
						<p>Opakujte akci nebo obnovte stránku v prohlížeči.</p>
						<button onClick={() => this.props.onClose()}>Zavřít</button>
					</div>
				</Modal>
			</div>
		);
	}
}

FetchErrorDialog.propTypes = {
	msg: PropTypes.string,
	onClose: PropTypes.func.isRequired,
};
