/**
 * @file PreviewTrack.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TimelineModel from './TimelineModel';

export default class PreviewTrack extends Component {

	render() {
		const currentTimestamp = TimelineModel.dateToString(this.props.time);
		const items = TimelineModel.getItemInRange(this.props.track, null, currentTimestamp, '23:59:59,999');

		return (
			<p>{this.props.track.id}: {items.length}</p>
		);
	}

}

PreviewTrack.propTypes = {
	track: PropTypes.object.isRequired,
	time: PropTypes.object.isRequired,
	playing: PropTypes.bool.isRequired,
};
