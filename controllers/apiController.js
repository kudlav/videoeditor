/**
 * @file Controller for REST API
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import {config} from '../config';
import mltxmlManager from '../models/mltxmlManager';
import fileManager from '../models/fileManager';
import timeManager from '../models/timeManager';
import emailManager from '../models/emailManager';
import projectManager from '../models/projectManager';
import log from '../models/logger';
import error from '../models/errors';
import {isset, isNaturalNumber} from '../models/utils';

import {nanoid} from 'nanoid';
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Busboy = require('busboy');

exports.default = (req, res) => {

	res.json({ msg: 'For API documentation see https://github.com/kudlav/videoeditor' });

};


exports.projectPOST = (req, res, next) => {

	let projectID = nanoid(32);
	fs.mkdir(path.join(config.projectPath, projectID), { recursive: true }, (err) => {
		if (err) return next(err);

		projectManager.save(projectID, projectManager.init()).then(
			() => res.json({ project: projectID }),
			err => next(err)
		);
	});

};


exports.projectGET = (req, res) => {

	projectManager.load(req.params.projectID, 'r').then(
		async ([document]) => {

			// Resources
			const resources = {};
			const producerNodes = document.getElementsByTagName('producer');
			for (let producer of producerNodes) {
				let id = producer.id.replace(/^producer/, '');
				let resource = {
					id: id,
					duration: null,
					mime: null,
					name: null,
				};
				const properties = producer.getElementsByTagName('property');
				for (let property of properties) {
					switch (property.getAttribute('name')) {
						case 'musecut:mime_type':
							resource.mime = property.innerHTML;
							break;
						case 'length':
							resource.duration = property.innerHTML;
							break;
						case 'musecut:name':
							resource.name = property.innerHTML;
					}
				}
				resources[id] = resource;
			}

			// Timeline
			const timeline = {
				audio: [],
				video: [],
			};
			const tracks = document.querySelectorAll('mlt>playlist[id*="track"]');
			for (let track of tracks) {
				const trackEntry = {
					id: track.id,
					items: [],
				};

				const entries = track.childNodes;
				let time = '00:00:00,000';
				for (let entry of entries) {
					if (entry.tagName === 'blank') {
						time = timeManager.addDuration(entry.getAttribute('length'), time);
					}
					// Simple entry
					else if (new RegExp(/^producer/).test(entry.getAttribute('producer'))) {
						const duration = mltxmlManager.getDuration(entry, document);
						const startTime = time;
						time = timeManager.addDuration(duration.time, time);
						trackEntry.items.push({
							resource: entry.getAttribute('producer').replace(/^producer/, ''),
							in: duration.in,
							out: duration.out,
							start: startTime,
							end: time,
							filters: [],
							transitionTo: null,
							transitionFrom: null,
						});
					}
					// Tractor with playlist
					else {
						const tractor = document.getElementById(entry.getAttribute('producer'));
						const tracks = tractor.getElementsByTagName('multitrack').item(0).childNodes;
						const trackFilters = tractor.getElementsByTagName('filter');
						let index = 0;
						for (let track of tracks) {
							const playlist = document.getElementById(track.getAttribute('producer'));
							const playlistEntry = playlist.getElementsByTagName('entry').item(0);
							const duration = mltxmlManager.getDuration(playlistEntry, document);
							const startTime = time;
							time = timeManager.addDuration(duration.time, time);
							let filters = [];
							for (let trackFilter of trackFilters) {
								if (trackFilter.getAttribute('track') === index.toString()) {
									let serviceAlias = null;
									for (let param of trackFilter.childNodes) {
										if (param.getAttribute('name') === 'musecut:filter') {
											serviceAlias = param.innerHTML;
										}
									}
									if (serviceAlias !== null) {
										filters.push({
											service: serviceAlias,
										});
									} else {
										filters.push({
											service: trackFilter.getAttribute('mlt_service'),
										});
									}
								}
							}
							trackEntry.items.push({
								resource: playlistEntry.getAttribute('producer').replace(/^producer/, ''),
								in: duration.in,
								out: duration.out,
								start: startTime,
								end: time,
								filters: filters,
								transitionTo: null,
								transitionFrom: null,
							});
							index++;
						}
					}
				}
				trackEntry['duration'] = time;

				if (new RegExp(/^videotrack\d+/).test(track.id)) {
					timeline.video.push(trackEntry);
				} else {
					timeline.audio.push(trackEntry);
				}
			}

			// Processing
			let processing = await new Promise((resolve) => {
				const projectPath = projectManager.getDirectory(req.params.projectID);
				fs.access(path.join(projectPath, 'processing'), fs.constants.F_OK, (err) => {
					if (err) resolve(null);
					else { // project is processing right now
						exec(`cat ${path.join(projectPath, 'stderr.log')} | tr "\\r\\n" "\\n" | tr "\\r" "\\n" |` +
							' grep percentage: | tail -1 | sed "s/.*percentage://"', (error, stdout) => {
							if (error) {
								log.error(error);
								resolve(null);
							}
							const parsed = Number.parseInt(stdout.trim());
							resolve((!Number.isNaN(parsed)) ? parsed : null);
						});
					}
				});
			});

			res.json({
				project: req.params.projectID,
				resources: resources,
				timeline: timeline,
				processing: processing
			});
		},
		err => fileErr(err, res)
	);
};


exports.projectPUT = (req, res, next) => {

	const projectPath = projectManager.getDirectory(req.params.projectID);

	fs.open(path.join(projectPath, 'processing'), 'wx', (err, file) => {
		if (err) {
			switch (err.code) {
				case 'EEXIST':
					return errorResponse(error.projectStillRendering403, res);
				case 'ENOENT':
					return errorResponse(error.projectNotFound404, res);
				default:
					return next(err);
			}
		}
		fs.close(file, (err) => {
			if (err) log.error(err.stack);
		});

		exec(`cd ${projectPath} && melt project.mlt -consumer avformat:output.mp4 acodec=aac vcodec=libx264 > stdout.log 2> stderr.log`, (err) => {
			if (err) log.error(`exec error: ${err}`);
			else log.info(`Project "${req.params.projectID}" finished`);

			fs.unlink(path.join(projectPath, 'processing'), (err) => {
				if (err) log.error(err.stack);
			});

			if (isset(req.body.email))
				emailManager.sendProjectFinished(req.body.email, req.params.projectID, !(err));
		});
		res.json({ msg: 'Zpracování zahájeno' });
	});

};


exports.projectFilePOST = (req, res, next) => {

	let busboy;
	try {
		busboy = new Busboy({
			headers: req.headers,
			highWaterMark: 2 * 1024 * 1024, // Set 2MiB buffer
			limits: { files: 1 },
		});
	} catch (_) {/* continue */}
	if (!busboy)
		return errorResponse(error.uploadMissingFile400, res);

	busboy.on('file', (fieldname, file, filename, transferEncoding, mimeType) => {

		const fileID = nanoid();
		const extension = path.extname(filename);
		let filepath = path.join(config.projectPath, req.params.projectID, fileID);
		if (extension.length > 1) filepath += extension;

		// Create a write stream of the new file
		const fstream = fs.createWriteStream(filepath);

		log.info(`Upload of "${filename}" started`);

		// Pipe it trough
		file.pipe(fstream);

		// On finish of the upload
		fstream.on('finish', () => {
			log.info(`Upload of "${filename}" finished`);

			fileManager.getDuration(filepath, mimeType).then(
				length => {
					projectManager.load(req.params.projectID, 'w').then(
						([document, , release]) => {
							const node = document.createElement('producer');
							node.id = 'producer' + fileID;
							node.innerHTML = `<property name="resource">${path.resolve(filepath)}</property>`;
							node.innerHTML += `<property name="musecut:mime_type">${mimeType}</property>`;
							node.innerHTML += `<property name="musecut:name">${filename}</property>`;
							if (length !== null) {
								if (timeManager.isValidDuration(length))
									node.innerHTML += `<property name="length">${length}</property>`;
								else {
									length = null;
									log.fatal(`Unable to get duration of ${mimeType}: ${filepath}`);
								}
							}

							const root = document.getElementsByTagName('mlt').item(0);
							root.prepend(node);
							projectManager.save(req.params.projectID, root.outerHTML, release).then(
								() => res.json({
									msg: `Upload of "${filename}" OK`,
									resource_id: fileID,
									resource_mime: mimeType,
									length: length,
								}),
								err => next(err)
							);
						},
						err => fileErr(err, res)
					);
				}
			);
		});
		fstream.on('error', () => errorResponse(error.projectNotFound404, res));
	});

	return req.pipe(busboy); // Pipe it trough busboy

};


exports.projectFileDELETE = (req, res, next) => {

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const entries = document.querySelectorAll(`mlt>playlist>entry[producer="producer${req.params.fileID}"]`);
			if (entries.length > 0)
				return errorResponse(error.sourceInUse403, res, release);

			const producer = document.querySelector(`mlt>producer[id="producer${req.params.fileID}"]`);
			if (producer === null)
				return errorResponse(error.sourceNotFound404, res, release);

			const filename = mltxmlManager.getProperty(producer, 'resource');
			if (filename === null) {
				release();
				return next(`Project "${req.params.projectID}", producer${req.params.fileID} misses resource tag`);
			}

			// Try to remove file, log failure
			fs.unlink(filename, (err) => {
				if (err) log.error(err);
			});

			producer.remove();

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Zdroj byl úspěšně odebrán' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectFilePUT = (req, res, next) => {

	// Required parameters: track
	if (!isset(req.body.track))
		return errorResponse(error.parameterTrackMissing400, res);

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const producer = document.getElementById(`producer${req.params.fileID}`);
			if (producer === null)
				return errorResponse(error.sourceNotFound404, res, release);

			const length = mltxmlManager.getProperty(producer, 'length');

			const track = document.getElementById(req.body.track);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.body.track), res, release);

			const newEntry = document.createElement('entry');
			newEntry.setAttribute('producer', 'producer' + req.params.fileID);

			const mime = mltxmlManager.getProperty(producer, 'musecut:mime_type');
			if (mime === null) {
				release();
				return next(`Project "${req.params.projectID}", producer "${req.params.fileID}" missing mime_type tag`);
			}
			else if (new RegExp(/^image\//).test(mime)) {
				if (new RegExp(/^videotrack\d+/).test(req.body.track) === false)
					return errorResponse(error.imgWrongTrack400, res, release);

				// Images needs duration parameter
				if (!timeManager.isValidDuration(req.body.duration))
					return errorResponse(error.parameterDurationMissing400, res, release);

				newEntry.setAttribute('in', '00:00:00,000');
				newEntry.setAttribute('out', req.body.duration);
			}
			else if (new RegExp(/^video\//).test(mime)) {
				if (length === null) {
					log.error(`Project "${req.params.projectID}", producer "${req.params.fileID}" missing length tag`);
					return errorResponse(error.videoDurationMissing400, res, release);
				}
				if (new RegExp(/^videotrack\d+/).test(req.body.track) === false)
					return errorResponse(error.videoWrongTrack400, res, release);
			}
			else if (new RegExp(/^audio\//).test(mime)) {
				if (length === null) {
					log.error(`Project "${req.params.projectID}", producer "${req.params.fileID}" missing length tag`);
					return errorResponse(error.audioDurationMissing400, res, release);
				}
				if (new RegExp(/^audiotrack\d+/).test(req.body.track) === false)
					return errorResponse(error.audioWrongTrack400, res, release);
			}
			else { // Reject everything except images, videos and audio
				return errorResponse(error.fileWrongTrack403, res, release);
			}

			track.appendChild(newEntry);

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({
					msg: 'Položka přidána na časovou osu',
					timeline: req.body.track,
				}),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectFilterPOST = (req, res, next) => {

	// Required parameters: track, item, filter
	if (!isset(req.body.track, req.body.item, req.body.filter))
		return errorResponse(error.parameterFilterMissing400, res);

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.body.track), res, release);

			const item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null)
				return errorResponse(error.itemNotFound404(req.body.item, req.body.track), res, release);

			let trackIndex;
			let newTractor;

			if (mltxmlManager.isSimpleNode(item)) {
				// Create playlist after last producer
				const newPlaylist = mltxmlManager.entryToPlaylist(item, document);

				// Create tractor before videotrack0
				newTractor = mltxmlManager.createTractor(document);
				newTractor.innerHTML = `<multitrack><track producer="${newPlaylist.id}"/></multitrack>`;

				trackIndex = 0;

				// Update track playlist
				item.removeAttribute('in');
				item.removeAttribute('out');
				item.setAttribute('producer', newTractor.id);
			}
			else {
				trackIndex = mltxmlManager.getTrackIndex(item);

				// Check if filter is already applied
				const filters = item.parentElement.parentElement.getElementsByTagName('filter');
				for (let filter of filters) {
					let filterName;
					if (filter.getAttribute('musecut:filter') !== null) filterName = filter.getAttribute('musecut:filter');
					else filterName = filter.getAttribute('mlt_service');
					if (filterName === req.body.filter && filter.getAttribute('track') === trackIndex.toString())
						return errorResponse(error.filterExists403(req.body.item, req.body.track, req.body.filter), res, release);
				}

				newTractor = item.parentElement.parentElement;
			}

			// Add new filter
			const newFilter = document.createElement('filter');
			let filterName = req.body.filter;
			if (isset(config.mapFilterNames[req.body.filter])) {
				filterName = config.mapFilterNames[req.body.filter];
				const newPropery = document.createElement('property');
				newPropery.setAttribute('name', 'musecut:filter');
				newPropery.innerHTML = req.body.filter;
				newFilter.appendChild(newPropery);
			}
			newFilter.setAttribute('mlt_service', filterName);
			newFilter.setAttribute('track', trackIndex.toString());
			newTractor.appendChild(newFilter);

			if (isset(req.body.params)) {
				for (let param in req.body.params) {
					const newPropery = document.createElement('property');
					newPropery.setAttribute('name', param);
					if (typeof req.body.params[param]  === 'number') {
						const value = req.body.params[param].toString();
						newPropery.innerHTML = value.replace(/\./, ',');
					}
					else {
						newPropery.innerHTML = req.body.params[param];
					}
					newFilter.appendChild(newPropery);
				}
			}

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Filtr přidán' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectFilterDELETE = (req, res, next) => {

	// Required parameters: track, item, filter
	if (!isset(req.body.track, req.body.item, req.body.filter))
		return errorResponse(error.parameterFilterMissing400, res);

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.body.track), res, release);

			const item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null)
				return errorResponse(error.itemNotFound404(req.body.item, req.body.track), res, release);

			let filterName = req.body.filter;
			if (isset(config.mapFilterNames[req.body.filter]))
				filterName = config.mapFilterNames[req.body.filter];

			const tractor = item.parentElement.parentElement;
			const trackIndex = mltxmlManager.getTrackIndex(item);
			const filters = tractor.getElementsByTagName('filter');
			let filter;
			for (let entry of filters) {
				if (entry.getAttribute('mlt_service') === filterName && entry.getAttribute('track') === trackIndex.toString()) {
					if (filterName === req.body.filter) {
						filter = entry;
						break;
					}
					// filterName is alias
					const alias = mltxmlManager.getProperty(entry, 'musecut:filter');
					if (alias === req.body.filter) {
						filter = entry;
						break;
					}
				}
			}

			// Check if filter exists
			if (mltxmlManager.isSimpleNode(item) || filter === undefined)
				return errorResponse(error.filterNotFound404(req.body.item, req.body.track, req.body.filter), res, release);

			filter.remove();

			// Tractor without filters, with one track
			if (!mltxmlManager.isUsedInTractor(item) && tractor.getElementsByTagName('multitrack').item(0).childElementCount === 1) {
				const playlist = document.getElementById(item.getAttribute('producer'));
				const entry = playlist.getElementsByTagName('entry').item(0);
				const tractorUsage = document.querySelector(`mlt>playlist>entry[producer="${tractor.id}"]`);
				tractorUsage.parentElement.insertBefore(entry, tractorUsage);

				tractorUsage.remove();
				tractor.remove();
				playlist.remove();
			}

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Filtr odebrán' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectTransitionPOST = (req, res, next) => {

	// Required parameters: track, itemA, itemB, transition, duration
	if (!isset(req.body.track, req.body.itemA, req.body.itemB, req.body.transition, req.body.duration))
		return errorResponse(error.parameterTransitionMissing400, res);

	if (!isNaturalNumber(req.body.itemA, req.body.itemB) || !timeManager.isValidDuration(req.body.duration))
		return errorResponse(error.parameterTransitionWrong400, res);

	if ((req.body.itemB - req.body.itemA) !== 1)
		return errorResponse(error.parameterTransitionOrder400, res);

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.body.track), res, release);

			const itemA = mltxmlManager.getItem(document, track, req.body.itemA);
			const itemB = mltxmlManager.getItem(document, track, req.body.itemB);

			if (itemA === null)
				return errorResponse(error.itemNotFound404(req.body.itemA, req.body.track), res, release);
			if (itemB === null)
				return errorResponse(error.itemNotFound404(req.body.itemB, req.body.track), res, release);

			const durationA = mltxmlManager.getDuration(itemA, document);
			const durationB = mltxmlManager.getDuration(itemB, document);
			const waitBeforeTransition = timeManager.subDuration(durationA.out, req. body.duration);
			if (req.body.duration > durationA.time || req.body.duration > durationB.time)
				return errorResponse(error.transitionTooLong400, res, release);

			// Simple + Simple
			if (mltxmlManager.isSimpleNode(itemA) && mltxmlManager.isSimpleNode(itemB)) {
				// Create playlist after last producer
				const newPlaylistA = mltxmlManager.entryToPlaylist(itemA, document);
				const newPlaylistB = mltxmlManager.entryToPlaylist(itemB, document);
				newPlaylistB.innerHTML = `<blank length="${waitBeforeTransition}" />` + newPlaylistB.innerHTML;

				// Create tractor before videotrack0
				const newTractor = mltxmlManager.createTractor(document);
				newTractor.innerHTML = `<multitrack><track producer="${newPlaylistA.id}"/><track producer="${newPlaylistB.id}"/></multitrack>`;
				newTractor.innerHTML += `<transition mlt_service="${req.body.transition}" in="${waitBeforeTransition}" out="${durationA.out}" a_track="0" b_track="1"/>`;

				// Update track
				itemA.removeAttribute('in');
				itemA.removeAttribute('out');
				itemA.setAttribute('producer', newTractor.id);
				itemB.remove();
			}
			// Complex + Simple
			else if (!mltxmlManager.isSimpleNode(itemA) && mltxmlManager.isSimpleNode(itemB)) {
				const newPlaylist = mltxmlManager.entryToPlaylist(itemB, document);
				mltxmlManager.appendPlaylistToMultitrack(itemA.parentElement, newPlaylist, req.body.duration, req.body.transition, document);
				itemB.remove();
			}
			// Complex + Complex
			else if (!mltxmlManager.isSimpleNode(itemA)) {
				const multitrackA = itemA.parentElement;
				const multitrackB = itemB.parentElement;
				if (multitrackA === multitrackB)
					return errorResponse(error.transitionExists403, res, release);

				let duration = req.body.duration;
				let transition = req.body.transition;
				let newTrackIndex = multitrackB.childElementCount;
				let oldTrackIndex = 0;
				const transitions = multitrackB.parentElement.getElementsByTagName('transition');
				const filters = multitrackB.parentElement.getElementsByTagName('filter');
				const tracksB = multitrackB.childNodes;
				for (let
					track of tracksB) {
					// Merge transition
					if (!isset(transition)) {
						for (let transitionElement of transitions) {
							if (transitionElement.getAttribute('b_track') === oldTrackIndex.toString()) {
								transition = transitionElement.getAttribute('mlt_service');
								duration = timeManager.subDuration(transitionElement.getAttribute('out'), transitionElement.getAttribute('in'));
							}
						}
					}

					// Merge filters
					for (let filter of filters) {
						if (filter.getAttribute('track') === oldTrackIndex.toString()) {
							filter.setAttribute('track', newTrackIndex.toString());
							multitrackA.parentElement.append(filter);
						}
					}

					let playlist = document.getElementById(track.getAttribute('producer'));
					mltxmlManager.appendPlaylistToMultitrack(multitrackA, playlist, duration, transition, document);

					transition = undefined;
					duration = undefined;
					newTrackIndex++;
					oldTrackIndex++;
				}
				const tractorB = multitrackB.parentElement;
				const tractorBentry = document.querySelector(`mlt>playlist>entry[producer="${tractorB.id}"]`);
				tractorBentry.remove();
				tractorB.remove();
			}
			// Simple + Complex
			else {
				const durationA = timeManager.subDuration(mltxmlManager.getDuration(itemA, document).time, req.body.duration);
				const multitrackB = itemB.parentElement;
				// Re-index transition, adjust IN/OUT timing
				const transitions = multitrackB.parentElement.getElementsByTagName('transition');
				for (let transition of transitions) {
					transition.setAttribute('a_track', Number(transition.getAttribute('a_track')) + 1);
					transition.setAttribute('b_track', Number(transition.getAttribute('b_track')) + 1);
					transition.setAttribute('in', timeManager.addDuration(transition.getAttribute('in'), durationA));
					transition.setAttribute('out', timeManager.addDuration(transition.getAttribute('out'), durationA));
				}
				// Re-index filters
				const filters = multitrackB.parentElement.getElementsByTagName('filter');
				for (let filter of filters) {
					filter.setAttribute('track', Number(filter.getAttribute('track')) + 1);
				}
				// Adjust blank duration of tracks
				const tracks = multitrackB.childNodes;
				for (let track of tracks) {
					let playlist = document.getElementById(track.getAttribute('producer'));
					let blank = playlist.getElementsByTagName('blank').item(0);
					if (blank === null)
						playlist.innerHTML = `<blank length="${durationA}" />` + playlist.innerHTML;
					else
						blank.setAttribute('length', timeManager.addDuration(blank.getAttribute('length'), durationA));
				}
				// Prepend multitrack with item
				const newPlaylist = mltxmlManager.entryToPlaylist(itemA, document);
				multitrackB.innerHTML = `<track producer="${newPlaylist.id}" />` + multitrackB.innerHTML;
				// Add new transition
				multitrackB.parentElement.innerHTML += `<transition mlt_service="${req.body.transition}" in="${durationA}" out="${mltxmlManager.getDuration(itemA, document).time}" a_track="0" b_track="1" />`;

				itemA.remove();
			}

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Přechod aplikován' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectItemDELETE = (req, res, next) => {

	// Required parameters: track, item
	if (!isset(req.body.track, req.body.item))
		return errorResponse(error.parameterItemMissing400, res);

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.body.track), res, release);

			let item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null)
				return errorResponse(error.itemNotFound404(req.body.item, req.body.track), res, release);

			let entry;
			let duration = mltxmlManager.getDuration(item, document).time;

			if (mltxmlManager.isSimpleNode(item)) { // It's simple element
				entry = item;
			}
			else {
				const tractor = item.parentElement.parentElement;
				if (tractor.getElementsByTagName('transition').length === 0) { // It's element with filter(s)
					const playlist = document.querySelector(`mlt>playlist[id="${item.getAttribute('producer')}"]`);
					entry = document.querySelector(`mlt>playlist>entry[producer="${tractor.id}"]`);

					tractor.remove();
					playlist.remove();
				}
				else { // It's element with transition(s)
					release();
					return; // TODO
				}
			}

			const prevEntry = entry.previousElementSibling;
			const nextEntry = entry.nextElementSibling;
			if (nextEntry !== null) {
				// Replace with blank
				if (prevEntry !== null && prevEntry.tagName === 'blank') {
					duration = timeManager.addDuration(duration, prevEntry.getAttribute('length'));
					prevEntry.remove();
				}
				if (nextEntry.tagName === 'blank') {
					duration = timeManager.addDuration(duration, nextEntry.getAttribute('length'));
					nextEntry.remove();
				}
				entry.outerHTML = `<blank length="${duration}"/>`;
			}
			else {
				// Last item, just delete
				if (prevEntry !== null && prevEntry.tagName === 'blank') prevEntry.remove();
				entry.remove();
			}

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Položka smazána' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectItemPUTmove = (req, res, next) => {

	// Required parameters: track, trackTarget, item, time
	if (!isset(req.body.track, req.body.trackTarget, req.body.item, req.body.time))
		return errorResponse(error.parameterMoveMissing400, res);

	if (req.body.time !== '00:00:00,000' && !timeManager.isValidDuration(req.body.time))
		return errorResponse(error.parameterTimeWrong400, res);

	if (!(req.body.trackTarget.includes('videotrack') && req.body.track.includes('videotrack'))) {
		if (!(req.body.trackTarget.includes('audiotrack') && req.body.track.includes('audiotrack')))
			return errorResponse(error.tracksIncompatible400, res);
	}

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			const trackTarget = document.getElementById(req.body.trackTarget);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.body.track), res, release);
			if (trackTarget === null)
				return errorResponse(error.trackNotFound404(req.body.trackTarget), res, release);

			let item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null)
				return errorResponse(error.itemNotFound404(req.body.item, req.body.track), res, release);

			if (!mltxmlManager.isSimpleNode(item)) {
				item = item.parentElement; // Get multitrack of complex item
			}

			const itemDuration = mltxmlManager.getDuration(item, document).time;

			if (!mltxmlManager.isSimpleNode(item)) {
				item = item.parentElement; // Get tractor of complex item
				item = document.querySelector(`mlt>playlist>entry[producer="${item.id}"]`); // Get videotrack entry
			}

			// Add blank to old location
			const prevElement = item.previousElementSibling;
			const nextElement = item.nextElementSibling;
			let leftDuration = itemDuration;

			if (prevElement !== null && prevElement.tagName === 'blank') {
				leftDuration = timeManager.addDuration(leftDuration, prevElement.getAttribute('length'));
				prevElement.remove();
			}
			if (nextElement !== null && nextElement.tagName === 'blank') {
				leftDuration = timeManager.addDuration(leftDuration, nextElement.getAttribute('length'));
				nextElement.remove();
			}
			if (nextElement !== null) {
				const newBlank = document.createElement('blank');
				newBlank.setAttribute('length', leftDuration);
				track.insertBefore(newBlank, item);
			}
			item.remove();

			// Check free space
			if (mltxmlManager.getItemInRange(trackTarget, req.body.time, timeManager.addDuration(req.body.time, itemDuration), document).length > 0)
				return errorResponse(error.moveNoSpace403, res, release);

			let targetElement = mltxmlManager.getItemAtTime(document, trackTarget, req.body.time);

			// Prepare target place
			if (targetElement.entries.length === 0) { // End of timeline
				if (targetElement.endTime < req.body.time) {
					const newBlank = document.createElement('blank');
					newBlank.setAttribute('length', timeManager.subDuration(req.body.time, targetElement.endTime));
					trackTarget.appendChild(newBlank);
				}
				trackTarget.appendChild(item);
			}
			else if (targetElement.entries.length === 1) { // Inside blank
				const afterLength = timeManager.subDuration(targetElement.endTime, timeManager.addDuration(req.body.time, itemDuration));
				const afterBlank = document.createElement('blank');
				afterBlank.setAttribute('length', afterLength);

				const beforeLength = timeManager.subDuration(targetElement.entries[0].getAttribute('length'), timeManager.addDuration(afterLength, itemDuration));
				const beforeBlank = document.createElement('blank');
				beforeBlank.setAttribute('length', beforeLength);

				if (beforeLength !== '00:00:00,000') trackTarget.insertBefore(beforeBlank, targetElement.entries[0]);
				trackTarget.insertBefore(item, targetElement.entries[0]);
				if (afterLength !== '00:00:00,000' && targetElement.entries[0].nextElementSibling !== null) trackTarget.insertBefore(afterBlank, targetElement.entries[0]);
				targetElement.entries[0].remove();
			}
			else { // Between two elements
				const blank =  (targetElement.entries[0].tagName === 'blank') ? targetElement.entries[0] : targetElement.entries[1];
				if (blank !== null) {
					blank.setAttribute('length', timeManager.subDuration(blank.getAttribute('length'), itemDuration));
					if (blank.getAttribute('lenght') === '00:00:00,000') blank.remove();
				}
				trackTarget.insertBefore(item, targetElement.entries[1]);
			}

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Položka přesunuta' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectItemPUTsplit = (req, res, next) => {
	// Required parameters: track, item, time
	if (!isset(req.body.track, req.body.item, req.body.time))
		return errorResponse(error.parameterSplitMissing400, res);

	if (!timeManager.isValidDuration(req.body.time))
		return errorResponse(error.parameterTimeWrong400, res);

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.body.track), res, release);

			let item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null)
				return errorResponse(error.itemNotFound404(req.body.item, req.body.track), res, release);

			const time = mltxmlManager.getDuration(item, document);

			if (req.body.time >= time.time)
				return errorResponse(error.parameterTimeRange400(time.time), res, release);

			let splitTime = req.body.time;
			if (time.in !== '00:00:00,000') splitTime = timeManager.addDuration(time.in, req.body.time);

			if (mltxmlManager.isSimpleNode(item)) { // It's simple element
				const itemCopy = item.cloneNode();
				track.insertBefore(itemCopy, item);
				itemCopy.setAttribute('out', splitTime);
				item.setAttribute('in', splitTime);
			}
			else {
				const tractor = item.parentElement.parentElement;
				if (tractor.getElementsByTagName('transition').length === 0) { // It's element with filter(s)
					const trackItem = document.querySelector(`mlt>playlist[id="${item.getAttribute('producer')}"]`).getElementsByTagName('entry')[0];
					const trackItemCopy = trackItem.cloneNode();
					trackItemCopy.setAttribute('out', splitTime);
					trackItem.setAttribute('in', splitTime);

					const playlistCopy = mltxmlManager.entryToPlaylist(trackItemCopy, document);

					const tractorCopy = mltxmlManager.createTractor(document);
					tractorCopy.innerHTML = `<multitrack><track producer="${playlistCopy.id}"/></multitrack>`;
					const filters = tractor.getElementsByTagName('filter');
					for (let filter of filters) {
						tractorCopy.innerHTML += filter.outerHTML;
					}

					const videotrackRefCopy = document.createElement('entry');
					videotrackRefCopy.setAttribute('producer', tractorCopy.id);
					const videotrackRef = document.querySelector(`mlt>playlist>entry[producer="${tractor.id}"]`);
					track.insertBefore(videotrackRefCopy, videotrackRef);
				}
				else { // It's element with transition(s)
					release();
					return; // TODO
				}
			}

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Položka rozdělena' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);
};


exports.projectTrackPOST = (req, res, next) => {
	// Required parameters: type
	if (!isset(req.body.type) || (req.body.type !== 'video' && req.body.type !== 'audio'))
		return errorResponse(error.parameterTrackTypeMissing400, res);

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);
			const mainTractor = document.querySelector('mlt>tractor[id="main"]');

			const tracks = document.querySelectorAll(`mlt>playlist[id^="${req.body.type}track"]`);
			const lastTrack = tracks.item(tracks.length - 1).id;
			const lastID = lastTrack.match(/^(.+)track(\d+)/);

			const newTractor = document.createElement('playlist');
			newTractor.id = lastID[1] + 'track' + (Number(lastID[2]) + 1);
			root.insertBefore(newTractor, mainTractor);

			const newTrack = document.createElement('track');
			newTrack.setAttribute('producer', newTractor.id);
			mainTractor.getElementsByTagName('multitrack').item(0).appendChild(newTrack);

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({
					msg: 'Stopa přidána',
					track: newTractor.id,
				}),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);
};


exports.projectTrackDELETE = (req, res, next) => {

	projectManager.load(req.params.projectID, 'w').then(
		([document, , release]) => {
			const root = document.getElementsByTagName('mlt').item(0);
			let trackID = req.params.trackID;

			const track = document.getElementById(req.params.trackID);
			if (track === null)
				return errorResponse(error.trackNotFound404(req.params.trackID), res, release);

			// Removing default track
			if (req.params.trackID === 'videotrack0' || req.params.trackID === 'audiotrack0') {
				const type  = (req.params.trackID.includes('video')) ? 'videotrack' : 'audiotrack';
				let nextTrack = null;
				let nextElement = track.nextElementSibling;
				while (nextElement !== null) {
					if (nextElement.id.includes(type)) {
						nextTrack = nextElement;
						break;
					}
					nextElement = nextElement.nextElementSibling;
				}

				if (nextTrack === null)
					return errorResponse(error.trackDefaultDel403, res, release);

				trackID = nextElement.id;
				nextElement.id = type + '0'; // Rename next element to videotrack0/audiotrack0
			}

			const trackRef = document.querySelector(`mlt>tractor>multitrack>track[producer="${trackID}"]`);
			trackRef.remove();

			// Remove track including items containers
			const entries = track.childNodes;
			for (let entry of entries) {
				// Container of entries
				if (entry.tagName !== 'blank' && !(new RegExp(/^producer/).test(entry.getAttribute('producer')))) {
					const tractor = document.getElementById(entry.getAttribute('producer'));
					const tracks = tractor.getElementsByTagName('multitrack').item(0).childNodes;
					for (let track of tracks) {
						document.getElementById(track.getAttribute('producer')).remove();
					}
					tractor.remove();
				}
			}
			track.remove();

			projectManager.save(req.params.projectID, root.outerHTML, release).then(
				() => res.json({ msg: 'Stopa smazána' }),
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);
};


/**
 * Handle error while opening project directory.
 *
 * @param err
 * @param res
 */
function fileErr(err, res) {
	if (err.code === 'ENOENT')
		errorResponse(error.projectNotFound404, res);
	else {
		log.error(err.stack);
		errorResponse(error.projectFailedOpen500, res);
	}
}


/**
 * Send error response to a client
 *
 * @param {Object} error Object containing code, err, msg
 * @param {Object} res Express response object.
 * @param {function} [destructor] Optional function called before sending error to a client
 */
function errorResponse(error, res, destructor = null) {
	if (destructor !== null) destructor();

	res.status(error.code).json({
		err: error.err,
		msg: error.msg,
	});
}
