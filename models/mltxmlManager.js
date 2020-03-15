/**
 * @file Manager for work with MLT files
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import timeManager from './timeManager';

export default {

	/**
	 * Check if entry is without any filter or transition
	 *
	 * @param {Element} node
	 * @return {boolean}
	 */
	isSimpleNode(node) {
		return (node.tagName === 'entry');
	},


	/**
	 * Get NTH element of playlist - entry (for simple) / track (for complex)
	 *
	 * @param {Document} document
	 * @param {Element} track
	 * @param {Number} index
	 * @return {?Element}
	 */
	getItem(document, track, index) {
		let i = 0;
		const entries = track.childNodes;
		for (let entry of entries) {
			// Skip blank
			if (entry.tagName === 'blank') {
				// continue;
			}
			// Simple entry
			else if (new RegExp(/^producer/).test(entry.getAttribute('producer'))) {
				if (i === index) {
					return entry;
				}
				i++;
			}
			// Container of entries
			else {
				const tractor = document.getElementById(entry.getAttribute('producer'));
				const tracks = tractor.getElementsByTagName('multitrack').item(0).childNodes;
				for (let track of tracks) {
					if (i === index) {
						return track;
					}
					i++;
				}
			}
		}
		return null;
	},


	/**
	 * Get element at provided time. Can return nothing, one element or two elements if the time is just between two items.
	 *
	 * @param {Document} document
	 * @param {Node} track
	 * @param {string} time
	 * @returns {{entries: [Element], endTime: string}|{entries: [Element, Element], endTime: string}|{entries: [], endTime: string}}
	 */
	getItemAtTime(document, track, time) {
		let currentTime = '00:00:00,000';
		const entries = track.childNodes;
		for (let entry of entries) {
			// Blank
			if (entry.tagName === 'blank') {
				currentTime = timeManager.addDuration(currentTime, entry.getAttribute('length'));
			}
			// Simple entry
			else if (new RegExp(/^producer/).test(entry.getAttribute('producer'))) {
				currentTime = timeManager.addDuration(currentTime, this.getDuration(entry, document).time);
			}
			// Container of entries
			else {
				const tractor = document.getElementById(entry.getAttribute('producer'));
				const multitrack = tractor.getElementsByTagName('multitrack').item(0);
				currentTime = timeManager.addDuration(currentTime, this.getDuration(multitrack, document).time);
			}

			if (time < currentTime) { // Time is somewhere inside element
				return {
					endTime: currentTime,
					entries: [entry],
				};
			}
			else if (time === currentTime) { // Between two elements
				return {
					endTime: currentTime,
					entries: [entry, entry.nextSibling],
				};
			}
		}
		return {
			endTime: currentTime,
			entries: [],
		};
	},


	/**
	 * Get index of track in multitrack
	 *
	 * @param {Element} track
	 * @return {number}
	 */
	getTrackIndex(track) {
		let index = 0;
		track = track.previousElementSibling;
		while (track !== null) {
			track = track.previousElementSibling;
			index++;
		}
		return index;
	},


	/**
	 * Check if track is used in any filter or transition
	 *
	 * @param {Element} track
	 * @return {boolean}
	 */
	isUsedInTractor(track) {
		const tractor = track.parentElement.parentElement;
		const trackIndex = this.getTrackIndex(track);

		const filters = tractor.getElementsByTagName('filter');
		for (let filter of filters) {
			if (filter.getAttribute('track') === trackIndex.toString()) return true;
		}

		const transitions = tractor.getElementsByTagName('transition');
		for (let transition of transitions) {
			if (transition.getAttribute('a_track') === trackIndex.toString()) return true;
			if (transition.getAttribute('b_track') === trackIndex.toString()) return true;
		}

		return false;
	},


	/**
	 * Get in, out and duration of timeline item
	 *
	 * @param {Element} element
	 * @param {Document} document
	 * @return {{in: string, time: string, out: string}}
	 */
	getDuration(element, document) {
		const duration = {
			in: undefined,
			out: undefined,
			time: undefined,
		};
		if (element.tagName === 'multitrack') {
			const lastTrack = element.childNodes.item(element.childElementCount - 1);
			const playlist = document.getElementById(lastTrack.getAttribute('producer'));
			duration.time = playlist.childNodes.item(0).getAttribute('length');
			if (duration.time === null)
				duration.time = this.getDuration(playlist.childNodes.item(playlist.childElementCount - 1), document).time;
			else
				duration.time = timeManager.addDuration(duration.time, this.getDuration(playlist.childNodes.item(playlist.childElementCount - 1), document).time);
		}
		else {
			if (element.tagName === 'track') {
				const playlist = document.getElementById(element.getAttribute('producer'));
				element = playlist.getElementsByTagName('entry').item(0);
			}

			duration.in = element.getAttribute('in');
			duration.out = element.getAttribute('out');

			if (duration.in === null) {
				duration.in = '00:00:00,000';
			}

			if (duration.out === null) {
				const producer = document.getElementById(element.getAttribute('producer'));
				const properties = producer.getElementsByTagName('property');
				for (let property of properties) {
					if (property.getAttribute('name') === 'length') duration.out = property.innerHTML;
				}
			}

			if (duration.in > duration.out) throw(`Attribute in is greater than out: ${element.outerHTML}`);

			duration.time = timeManager.subDuration(duration.out, duration.in);
		}
		return duration;
	},


	/**
	 * Create playlist and put the item as entry into it
	 *
	 * @param {Node} item
	 * @param {Document} document
	 * @return {HTMLElement} new playlist element
	 */
	entryToPlaylist(item, document) {
		const playlists = document.querySelectorAll('mlt>playlist[id^="playlist"]');
		const lastPlaylist = playlists.item(0);
		const lastID = (lastPlaylist === null) ? -1 : lastPlaylist.id.match(/playlist(\d+)/)[1];

		const newPlaylist = document.createElement('playlist');
		newPlaylist.id = 'playlist' + (Number(lastID) + 1);
		newPlaylist.innerHTML = item.outerHTML;

		const producers = document.getElementsByTagName('producer');
		const lastProducer = producers.item(producers.length - 1);
		lastProducer.parentElement.insertBefore(newPlaylist, lastProducer.nextSibling);
		return newPlaylist;
	},


	/**
	 * Add playlist to multitrack with transition
	 *
	 * @param {Element} multitrack
	 * @param {Element} playlist
	 * @param {String} overlapping
	 * @param {String} transition
	 * @param {Document} document
	 */
	appendPlaylistToMultitrack(multitrack, playlist, overlapping, transition, document) {
		const duration = timeManager.subDuration(this.getDuration(multitrack, document).time, overlapping);
		if (playlist.getElementsByTagName('blank').length > 0)
			playlist.childNodes.item(0).remove();
		playlist.innerHTML = `<blank length="${duration}" />` + playlist.innerHTML;
		multitrack.innerHTML += `<track producer="${playlist.id}" />`;

		const transitionElement = document.createElement('transition');
		transitionElement.setAttribute('mlt_service', transition);
		transitionElement.setAttribute('in', duration);
		transitionElement.setAttribute('out', timeManager.addDuration(duration, overlapping));
		transitionElement.setAttribute('a_track', (multitrack.childElementCount - 2).toString());
		transitionElement.setAttribute('b_track', (multitrack.childElementCount - 1).toString());
		multitrack.parentElement.append(transitionElement);
	},


	/**
	 * Create tractor and put it before videotrack0
	 *
	 * @param {Document} document
	 * @return {Element} new tractor element
	 */
	createTractor(document) {
		const tractors = document.querySelectorAll('mlt>tractor[id^="tractor"]');
		const lastTractor = tractors.item(tractors.length - 1);
		const lastID = (lastTractor === null) ? -1 : lastTractor.id.match(/tractor(\d+)/)[1];

		const newTractor = document.createElement('tractor');
		newTractor.id = 'tractor' + (Number(lastID) + 1);
		const videotrack0 = document.getElementById('videotrack0');
		videotrack0.parentElement.insertBefore(newTractor, videotrack0);
		return newTractor;
	},


	/**
	 *
	 * @param {HTMLElement} track
	 * @param {String} timeStart
	 * @param {String} timeEnd
	 * @param {Document} document
	 * @return {Array}
	 */
	getItemInRange(track, timeStart, timeEnd, document) {
		const collision = [];
		let time = '00:00:00,000';
		const entries = track.childNodes;
		let start = false;
		for (let entry of entries) {
			// Blank
			if (entry.tagName === 'blank') {
				time = timeManager.addDuration(time, entry.getAttribute('length'));
			}
			// Simple entry
			else if (new RegExp(/^producer/).test(entry.getAttribute('producer'))) {
				time = timeManager.addDuration(time, this.getDuration(entry, document).time);
			}
			// Container of entries
			else {
				const tractor = document.getElementById(entry.getAttribute('producer'));
				const multitrack = tractor.getElementsByTagName('multitrack').item(0);
				time = timeManager.addDuration(time, this.getDuration(multitrack, document).time);
			}

			if (!start) { // Before interval
				if (timeStart < time) { // Reached interval
					start = true;
					if (entry.tagName !== 'blank') collision.push(entry);
				}
			}
			else { // Inside interval
				if (entry.tagName !== 'blank') collision.push(entry);
			}
			if (timeEnd <= time) { // Reached end of interval
				break;
			}
		}

		return collision;
	},


	/**
	 * Get property of producer/filter by name.
	 *
	 * @param {Element} element Element containing properties.
	 * @param {string} name Property name.
	 * @return {?string} Return value of property or null when property not found.
	 */
	getProperty(element, name) {
		const properties = element.getElementsByTagName('property');
		for (let property of properties) {
			if (property.getAttribute('name') === name) {
				return property.innerHTML;
			}
		}
		return null;
	}
};
