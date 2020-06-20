/**
 * @file SubmitToolbar.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class SubmitToolbar extends Component {

	render() {
		return (
			<div className="right">
				{this.props.progress === 100 &&
					<a href={'/project/' + this.props.project + '/output.mp4'} target="_blank" rel="noreferrer">
						Zobrazit výsledné video
					</a>
				}
				{this.props.progress !== null && this.props.progress < 100 ?
					<div>
						<label htmlFor="progress">Zpracování videa: </label>
						{this.props.progress}%<progress id="progress" value={this.props.progress} max="100" />
						<button disabled><i className="material-icons" aria-hidden="true">done_outline</i>Dokončit
						</button>
					</div>
					:
					<button onClick={this.props.openSubmitDialog} className="success">
						<i className="material-icons" aria-hidden="true">done_outline</i>Dokončit
					</button>
				}
			</div>
		);
	}

}

SubmitToolbar.propTypes = {
	progress: PropTypes.number,
	project: PropTypes.string.isRequired,
	openSubmitDialog: PropTypes.func.isRequired
};
