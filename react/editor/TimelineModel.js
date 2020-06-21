/**
 * @file TimelineModel.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import timeManager from '../../models/timeManager';

export default {

	/**
	 * Get nth item of track. Blanks are ignored, first element is zero element.
	 *
	 * @param {Array} items
	 * @param {Number} position
	 * @return {null|Object}
	 */
	findItem(items, position) {
		let time = '00:00:00,000';
		let index = 0;
		for (let item of items) {
			if (item.resource === 'blank') {
				time = timeManager.addDuration(item.length, time);
			}
			else {
				let startTime = time;
				time = timeManager.addDuration(time, item.out);
				time = timeManager.subDuration(time, item.in);
				// todo Subtract transition duration
				if (index === position) {
					return {
						item: item,
						start: startTime,
						end: time,
					};
				}
				index++;
			}
		}
		return null;
	},

	/**
	 * Get track with specified trackId
	 *
	 * @param {Object} timeline
	 * @param {string} trackId
	 * @return {null|Object}
	 */
	findTrack(timeline, trackId) {
		let track = null;
		for (let videotrack of timeline.video) {
			if (videotrack.id === trackId) {
				track = videotrack;
				break;
			}
		}
		if (track === null) {
			for (let audiotrack of timeline.audio) {
				if (audiotrack.id === trackId) {
					track = audiotrack;
					break;
				}
			}
		}
		return track;
	},

	/**
	 * Get item(s) withing provided interval
	 *
	 * @param {Object} track Track object with 'id' and 'items' key.
	 * @param {number | null} itemID If set, item with this index will be excluded from search
	 * @param {string} start
	 * @param {string} end
	 */
	getItemInRange(track, itemID, start, end) {
		const items = [];
		let time = '00:00:00,000';
		let index = 0;
		for (let item of track.items) {
			if (item.resource === 'blank') {
				time = timeManager.addDuration(item.length, time);
			}
			else {
				if (end <= time) break;
				const timeStart = time;
				time = timeManager.addDuration(time, item.out);
				time = timeManager.subDuration(time, item.in);
				// todo Subtract transition duration
				if (index++ === itemID) continue; // Same item
				if (start >= time) continue;
				items.push({
					start: timeStart,
					end: time,
				});
			}
		}
		return items;
	},

	/**
	 * Get duration format from Date object
	 *
	 * @param {Date} date
	 * @return {string} Duration in format '00:00:00,000'
	 */
	dateToString(date) {
		let string = `${date.getHours()}:`;
		if (string.length < 3) string = '0' + string;

		string += `00${date.getMinutes()}:`.slice(-3);
		string += `00${date.getSeconds()},`.slice(-3);
		string += `${date.getMilliseconds()}000`.slice(0,3);
		return string;
	}

}
