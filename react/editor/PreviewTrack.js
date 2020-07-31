/**
 * @file PreviewTrack.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TimelineModel from './TimelineModel';

export default class PreviewTrack extends Component {

	constructor(props) {
		super(props);

		this.items = null;
		this.currentItem = null;

		this.prevA = React.createRef();
		this.prevALoaded = true;
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (this.prevA.current) {
			if (!this.prevALoaded) {
				this.prevA.current.onloadeddata = video => {
					video.target.currentTime = this.calcCurrentTime();
				};
				this.prevA.current.load();
				this.prevALoaded = true;
			}

			if (this.props.playing && !prevProps.playing) { // play
				this.prevA.current.play();
			}
			else if (!this.props.playing && prevProps.playing) { // pause
				this.prevA.current.pause();
				this.prevA.current.currentTime = this.calcCurrentTime();
			}
			else if (!this.props.playing && !prevProps.playing) { // move
				this.prevA.current.currentTime = this.calcCurrentTime();
			}
		}
	}

	render() {
		if (this.items === null || this.props.playing === false) {
			this.items = TimelineModel.getItemInRange(this.props.track, null, this.props.time, '23:59:59,999');
		}

		if (this.items.length > 0 && this.items[0].start <= this.props.time) {
			if (this.currentItem !== null && this.currentItem.resource !== this.items[0].resource) {
				this.prevALoaded = false; // source has changed, reload video
			}
			this.currentItem = this.items[0];
			this.items.splice(0, 1);
		}

		if (this.currentItem === null) return null;

		const prevAext = this.props.resources[this.currentItem.resource].name.split('.').pop();

		return (
			<video ref={this.prevA}>
				<source
					type={this.props.resources[this.currentItem.resource].mime}
					src={this.props.project + '/file/' + this.currentItem.resource + '?ext=' + prevAext}
				/>
			</video>
		);
	}

	calcCurrentTime() {
		return Math.floor(( TimelineModel.dateFromString(this.props.time).getTime()
			- TimelineModel.dateFromString(this.currentItem.start).getTime()
			+ TimelineModel.dateFromString(this.currentItem.in).getTime()
		) / 1000); // convert ms to seconds
	}

}

PreviewTrack.propTypes = {
	project: PropTypes.string.isRequired,
	resources: PropTypes.object.isRequired,
	track: PropTypes.object.isRequired,
	time: PropTypes.string.isRequired,
	playing: PropTypes.bool.isRequired,
};
