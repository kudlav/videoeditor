/**
 * @file Controller for REST API
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import config from '../config';
import mltxmlManager from '../models/mltxmlManager';
import fileManager from '../models/fileManager';
import timeManager from '../models/timeManager';
import emailManager from '../models/emailManager';

const fs = require('fs');
const path = require('path');
const nanoid = require('nanoid');
const { exec } = require('child_process');
const { JSDOM } = require('jsdom');

exports.default = (req, res) => {

	res.json({
		msg: 'For API documentation see https://github.com/kudlav/videoeditor',
	});

};


exports.projectPOST = (req, res, next) => {

	const data = `<mlt>
  <playlist id="videotrack0"/>
  <playlist id="audiotrack0"/>
    <tractor id="main">
      <multitrack>
        <track producer="videotrack0" />
        <track producer="audiotrack0" />
      </multitrack>
  </tractor>
</mlt>`;

	let projectID = nanoid(32);

	fs.mkdir(path.join(config.projectPath, projectID), { recursive: true }, (err) => {
		if (err) return next(err);
	});

	mltxmlManager.saveMLT(projectID, data).then(
		() => {
			res.json({
				project: projectID,
			});
		},
		err => next(err)
	);

};


exports.projectGET = (req, res) => {
	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;

			// Resources
			let resources = {};
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
				for (let entry of entries) {
					if (entry.tagName === 'blank') {
						trackEntry.items.push({
							resource: 'blank',
							length: entry.getAttribute('length'),
						});
					}
					// Simple entry
					else if (new RegExp(/^producer/).test(entry.getAttribute('producer'))) {
						const duration = mltxmlManager.getDuration(entry, document);
						trackEntry.items.push({
							resource: entry.getAttribute('producer').replace(/^producer/, ''),
							in: duration.in,
							out: duration.out,
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
									}
									else {
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
								filters: filters,
								transitionTo: null,
								transitionFrom: null,
							});
							index++;
						}
					}
				}

				if (new RegExp(/^videotrack\d+/).test(track.id)) {
					timeline.video.push(trackEntry);
				}
				else {
					timeline.audio.push(trackEntry);
				}
			}

			res.json({
				project: req.params.projectID,
				resources: resources,
				timeline: timeline,
			});
		},
		err => fileErr(err, res)
	);
};


exports.projectFilePOST = (req, res, next) => {

	if (!isset(req.busboy)) {
		res.status(400);
		res.json({
			err: 'Chybí soubor.',
			msg: 'Tělo požadavku musí obsahovat soubor k nahrání.',
		});
		return;
	}

	req.busboy.on('file', (fieldname, file, filename, transferEncoding, mimeType) => {

		const fileID = nanoid();
		const extension = path.extname(filename);
		let filepath = path.join(config.projectPath, req.params.projectID, fileID);
		if (extension.length > 1) filepath += extension;

		// Create a write stream of the new file
		const fstream = fs.createWriteStream(filepath);

		console.info(new Date(), `Upload of "${filename}" started`);

		// Pipe it trough
		file.pipe(fstream);

		// On finish of the upload
		fstream.on('close', () => {
			console.info(new Date(), `Upload of "${filename}" finished`);

			fileManager.getDuration(filepath, mimeType).then(
				length => {
					if (length !== null)
						length += '0';

					const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

					JSDOM.fromFile(mltPath, {contentType:'application/xml'}).then(
						dom => {
							const document = dom.window.document;

							const node = document.createElement('producer');
							node.id = 'producer' + fileID;
							node.innerHTML = `<property name="resource">${path.resolve(filepath)}</property>`;
							node.innerHTML += `<property name="musecut:mime_type">${mimeType}</property>`;
							node.innerHTML += `<property name="musecut:name">${filename}</property>`;
							if (timeManager.isValidDuration(length))
								node.innerHTML += `<property name="length">${length}</property>`;

							const root = document.getElementsByTagName('mlt').item(0);
							root.prepend(node);
							mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
								() => {
									res.json({
										msg: `Upload of "${filename}" OK`,
										resource_id: fileID,
										resource_mime: mimeType,
										length: length,
									});
								},
								err => next(err)
							);
						},
						err => fileErr(err, res)
					);
				}
			);
		});
	});

	req.pipe(req.busboy); // Pipe it trough busboy

};


exports.projectFileDELETE = (req, res, next) => {

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const entries = document.querySelectorAll(`mlt>playlist>entry[producer="producer${req.params.fileID}"]`);
			if (entries.length > 0) {
				res.status(403);
				res.json({
					err: 'Zdroj je používán.',
					msg: 'Zdroj je v projektu používán. Před smazáním z projektu jej odstraňte z časové osy.',
				});
				return;
			}

			const producer = document.querySelector(`mlt>producer[id="producer${req.params.fileID}"]`);
			if (producer === null) {
				res.status(404);
				res.json({
					err: 'Zdroj nenalezen.',
					msg: 'Zdroj se v projektu nenachází.'
				});
				return;
			}

			const properties = producer.getElementsByTagName('property');
			let filename;
			for (let property of properties) {
				if (property.getAttribute('name') === 'resource') filename = property.innerHTML;
			}

			if (filename === undefined)
				return next(`Project "${req.params.projectID}", producer${req.params.fileID} misses resource tag`);

			// Try to remove file, log failure
			fs.unlink(filename, (err) => {
				if (err) console.warn(new Date(), err);
			});

			producer.remove();

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({
						msg: 'Zdroj byl úspěšně odebrán',
					});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectFilePUT = (req, res, next) => {

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const producer = document.querySelector(`mlt>producer[id="producer${req.params.fileID}"]`);
			if (producer === null) {
				res.status(404);
				res.json({
					err: 'Zdroj nenalezen.',
					msg: 'Zdroj se v projektu nenachází.',
				});
				return;
			}

			const newEntry = document.createElement('entry');
			newEntry.setAttribute('producer', 'producer' + req.params.fileID);

			const properties = producer.getElementsByTagName('property');
			let producerMime;
			for (let property of properties) {
				if (property.getAttribute('name') === 'musecut:mime_type') producerMime = property.innerHTML;
			}

			if (producerMime === undefined) {
				return next(`Project "${req.params.projectID}", producer "${req.params.fileID}" missing mime_type tag`);
			}
			else if (new RegExp(/^image\//).test(producerMime)) {
				// Images needs duration parameter
				if (!timeManager.isValidDuration(req.body.duration)) {
					res.status(400);
					res.json({
						err: 'Chybí délka trvání.',
						msg: 'Pro vložení obrázku na časovou osu je nutné zadat trvání ve formátu 00:00:00,000.',
					});
					return;
				}

				newEntry.setAttribute('in', '00:00:00,000');
				newEntry.setAttribute('out', req.body.duration);
			}
			else if (new RegExp(/^video\//).test(producerMime) === false) {
				// Reject everything except images and videos
				res.status(403);
				res.json({
					err: 'Nepodporovaný typ souboru.',
					msg: 'Na časovou osu lze vložit pouze video nebo obrázek.',
				});
				return;
			}

			document.querySelector('mlt>playlist[id="videotrack0"]').appendChild(newEntry);

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({
						msg: 'Položka přidána na časovou osu',
						timeline: 'videotrack0',
					});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectFilterPOST = (req, res, next) => {

	// Required parameters: track, item, filter
	if (!isset(req.body.track, req.body.item, req.body.filter)) {
		res.status(400);
		res.json({
			err: 'Chybí parametry.',
			msg: 'Chybí povinné parametry: "track", "item", "filter".',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null) {
				res.status(404);
				res.json({
					err: 'Stopa nenalezena.',
					msg: `Zadaná stopa  "${req.body.track}" se v projektu nenachází.`,
				});
				return;
			}

			const item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null) {
				res.status(404);
				res.json({
					err: 'Položka nenalezena.',
					msg: `Položka "${req.body.item}" se na stopě "${req.body.track}" nenachází.`,
				});
				return;
			}

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
					if (filterName === req.body.filter && filter.getAttribute('track') === trackIndex.toString()) {
						res.status(403);
						res.json({
							err: 'Filtr je již aplikován.',
							msg: `Položka "${req.body.item}" na stopě "${req.body.track}" má již filtr "${req.body.filter}" aplikován.`,
						});
						return;
					}
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
					newPropery.innerHTML = req.body.params[param];
					newFilter.appendChild(newPropery);
				}
			}

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({msg: 'Filtr přidán'});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectFilterDELETE = (req, res, next) => {

	// Required parameters: track, item, filter
	if (!isset(req.body.track, req.body.item, req.body.filter)) {
		res.status(400);
		res.json({
			err: 'Chybí parametry.',
			msg: 'Chybí povinné parametry: "track", "item", "filter".',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null) {
				res.status(404);
				res.json({
					err: 'Stopa nenalezena.',
					msg: `Zadaná stopa  "${req.body.track}" se v projektu nenachází.`,
				});
				return;
			}

			const item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null) {
				res.status(404);
				res.json({
					err: 'Položka nenalezena.',
					msg: `Položka "${req.body.item}" se na stopě "${req.body.track}" nenachází.`,
				});
				return;
			}

			let filterName = req.body.filter;
			if (isset(config.mapFilterNames[req.body.filter])) {
				filterName = config.mapFilterNames[req.body.filter];
			}

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
					const properties = entry.getElementsByTagName('property');
					for (let property of properties) {
						if (property.getAttribute('name') === 'musecut:filter') {
							if (property.innerHTML === req.body.filter) filter = entry;
							break;
						}
					}
				}
			}

			// Check if filter exists
			if (mltxmlManager.isSimpleNode(item) || filter === undefined) {
				res.status(404);
				res.json({
					err: 'Filtr nenalezen.',
					msg: `Filtr "${req.body.filter}" se na ${req.body.item}. položce stopy "${req.body.track}" nenachází.`,
				});
				return;
			}

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

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({msg: 'Filtr odebrán'});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectTransitionPOST = (req, res, next) => {

	// Required parameters: track, itemA, itemB, transition, duration
	if (!isset(req.body.track, req.body.itemA, req.body.itemB, req.body.transition, req.body.duration)) {
		res.status(400);
		res.json({
			err: 'Chybí parametry.',
			msg: 'Chybí povinné parametry: track, itemA, itemB, transition, duration.',
		});
		return;
	}

	if (!isNaturalNumber(req.body.itemA, req.body.itemA) || !timeManager.isValidDuration(req.body.duration)) {
		res.status(400);
		res.json({
			err: 'Chybné parametry.',
			msg: 'Parametry itemA, itemB musí být celočíselné, nezáporné, duration musí být nenulové, ve formátu 00:00:00,000.',
		});
		return;
	}

	if ((req.body.itemB - req.body.itemA) !== 1) {
		res.status(400);
		res.json({
			err: 'Chybné parametry.',
			msg: 'itemA musí přímo následovat po itemB.',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null) {
				res.status(404);
				res.json({
					err: 'Stopa nenalezena.',
					msg: `Zadaná stopa  "${req.body.track}" se v projektu nenachází.`,
				});
				return;
			}

			const itemA = mltxmlManager.getItem(document, track, req.body.itemA);
			const itemB = mltxmlManager.getItem(document, track, req.body.itemB);

			if (itemA === null || itemB === null) {
				res.status(404);
				res.json({
					err: 'Polozka nenalezena.',
					msg: `Položka ${req.body.itemA} nebo ${req.body.itemA} se na stopě "${req.body.track}" nenachází.`,
				});
				return;
			}

			const durationA = mltxmlManager.getDuration(itemA, document);
			const durationB = mltxmlManager.getDuration(itemB, document);
			const waitBeforeTransition = timeManager.subDuration(durationA.out, req. body.duration);
			if (req.body.duration > durationA.time || req.body.duration > durationB.time) {
				res.status(400);
				res.json({
					err: 'Příliš dlouhá doba přechodu.',
					msg: 'Přechod je delší než jedna z položek přechodu.',
				});
				return;
			}

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
				if (multitrackA === multitrackB) {
					res.status(403);
					res.json({
						err: 'Přechod již aplikován.',
						msg: 'Zvolené prvky již mají vzájemný přechod.',
					});
					return;
				}

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

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({msg: 'Přechod aplikován'});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectPUT = (req, res, next) => {

	const projectPath = mltxmlManager.getWorkerDir(req.params.projectID);

	fs.open(path.join(projectPath, 'processing'), 'wx', (err, file) => {
		if (err) {
			switch (err.code) {
				case 'EEXIST':
					res.status(403);
					res.json({
						err: 'Zpracování probíhá.',
						msg: 'Projekt je již zpracováván, počkejte na dokončení.',
					});
					return;
				case 'ENOENT':
					fileErr(err, res);
					return;
				default:
					return next(err);
			}
		}
		fs.close(file, (err) => {
			if (err) console.error(err.stack);
		});

		exec(`cd ${projectPath} && melt project.mlt -consumer avformat:output.mp4 acodec=aac vcodec=libx264 > stdout.log 2> stderr.log`, (err) => {
			if (err) console.error(`exec error: ${err}`);

			fs.unlink(path.join(projectPath, 'processing'), (err) => {
				if (err) console.error(err.stack);
			});

			if (isset(req.body.email)) {
				emailManager.sendProjectFinished(req.body.email, req.params.projectID, !(err));
			}
		});
		res.json({
			msg: 'Zpracování zahájeno'
		});
	});

};


exports.projectItemDELETE = (req, res, next) => {

	// Required parameters: track, item
	if (!isset(req.body.track, req.body.item)) {
		res.status(400);
		res.json({
			err: 'Chybí parametry.',
			msg: 'Chybí povinné parametry: track, item.',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null) {
				res.status(404);
				res.json({
					err: 'Stopa nenalezena.',
					msg: `Zadaná stopa  "${req.body.track}" se v projektu nenachází.`,
				});
				return;
			}

			let item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null) {
				res.status(404);
				res.json({
					err: 'Položka nenalezena.',
					msg: `Položka ${req.body.item} se na stopě "${req.body.track}" nenachází.`,
				});
				return;
			}

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
					return;
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

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({msg: 'Položka rozdělena'});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectItemPUTmove = (req, res, next) => {

	// Required parameters: track, trackTarget, item, time
	if (!isset(req.body.track, req.body.trackTarget, req.body.item, req.body.time)) {
		res.status(400);
		res.json({
			err: 'Chybí parametry.',
			msg: 'Chybí povinné parametry: track, trackTarget, item, time.',
		});
		return;
	}

	if (!timeManager.isValidDuration(req.body.time)) {
		res.status(400);
		res.json({
			err: 'Chybný parametr.',
			msg: 'Parametr time musí být nenulový, ve formátu 00:00:00,000.',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			const trackTarget = document.getElementById(req.body.trackTarget);
			if (track === null || trackTarget === null) {
				res.status(404);
				res.json({
					err: 'Stopa nenalezena.',
					msg: `Zadaná stopa  "${req.body.track}" nebo "${trackTarget}" se v projektu nenachází.`,
				});
				return;
			}

			let item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null) {
				res.status(404);
				res.json({
					err: 'Položka nenalezena.',
					msg: `Položka ${req.body.item} se na stopě "${req.body.track}" nenachází.`,
				});
				return;
			}

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
			if (mltxmlManager.getItemInRange(trackTarget, req.body.time, timeManager.addDuration(req.body.time, itemDuration), document).length > 0) {
				res.status(403);
				res.json({
					err: 'Cíl již obsahuje položku.',
					msg: 'Zadané místo není volné, položku nelze přesunout.',
				});
				return;
			}

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

				trackTarget.insertBefore(beforeBlank, targetElement.entries[0]);
				trackTarget.insertBefore(item, targetElement.entries[0]);
				if (targetElement.entries[0].nextElementSibling !== null) trackTarget.insertBefore(afterBlank, targetElement.entries[0]);
				targetElement.entries[0].remove();
			}
			else { // Between two elements
				const blank =  (targetElement.entries[0].tagName === 'blank') ? targetElement.entries[0] : targetElement.entries[1];
				if (blank !== null) blank.setAttribute('length', timeManager.subDuration(blank.getAttribute('length'), itemDuration));
				trackTarget.insertBefore(item, targetElement.entries[1]);
			}

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({msg: 'Položka přesunuta'});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);

};


exports.projectItemPUTsplit = (req, res, next) => {
	// Required parameters: track, item, time
	if (!isset(req.body.track, req.body.item, req.body.time)) {
		res.status(400);
		res.json({
			err: 'Chybí parametry.',
			msg: 'Chybí povinné parametry: track, item, time.',
		});
		return;
	}

	if (!timeManager.isValidDuration(req.body.time)) {
		res.status(400);
		res.json({
			err: 'Chybný parametr.',
			msg: 'Parametr time musí být kladný, ve formátu 00:00:00,000.',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null) {
				res.status(404);
				res.json({
					err: 'Stopa nenalezena.',
					msg: `Zadaná stopa  "${req.body.track}" se v projektu nenachází.`,
				});
				return;
			}

			let item = mltxmlManager.getItem(document, track, req.body.item);
			if (item === null) {
				res.status(404);
				res.json({
					err: 'Položka nenalezena.',
					msg: `Položka ${req.body.item} se na stopě "${req.body.track}" nenachází.`,
				});
				return;
			}

			const time = mltxmlManager.getDuration(item, document);

			if (req.body.time >= time.time) {
				res.status(400);
				res.json({
					err: 'Parametr mimo rozsah hodnot.',
					msg: `Parametr time musí mít hodnotu mezi 00:00:00,000 a ${time.time}`,
				});
				return;
			}

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
					trackItemCopy.setAttribute('out', req.body.time);
					trackItem.setAttribute('in', req.body.time);

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
					return;
				}
			}

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({msg: 'Položka rozdělena'});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);
};


exports.projectTrackPOST = (req, res, next) => {
	// Required parameters: type
	if (!isset(req.body.type) || (req.body.type !== 'video' && req.body.type !== 'audio')) {
		res.status(400);
		res.json({
			err: 'Chybný parametr.',
			msg: 'Chybí parametr type, nebo má jinou hodnotu, než "video" nebo "audio".',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
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

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({
						msg: 'Stopa přidána',
						track: newTractor.id,
					});
				},
				err => next(err)
			);
		},
		err => fileErr(err, res)
	);
};


exports.projectTrackDELETE = (req, res, next) => {

	// Required parameters: track, item, time
	if (!isset(req.body.track)) {
		res.status(400);
		res.json({
			err: 'Chybí parametry.',
			msg: 'Chybí povinné parametry: track.',
		});
		return;
	}

	if (req.body.track === 'videotrack0' || req.body.track === 'audiotrack0') {
		res.status(403);
		res.json({
			err: 'Stopu nelze smazat.',
			msg: 'Výchozí stopy "videotrack0" a "audiotrack0" nelze smazat.',
		});
		return;
	}

	const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

	JSDOM.fromFile(mltPath, {contentType:'text/xml'}).then(
		dom => {
			const document = dom.window.document;
			const root = document.getElementsByTagName('mlt').item(0);

			const track = document.getElementById(req.body.track);
			if (track === null) {
				res.status(404);
				res.json({
					err: 'Stopa nenalezena.',
					msg: `Zadaná stopa  "${req.body.track}" se v projektu nenachází.`,
				});
				return;
			}

			const trackRef = document.querySelector(`mlt>tractor>multitrack>track[producer="${req.body.track}"]`);
			trackRef.remove();
			track.remove();

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({
						msg: 'Stopa smazána',
					});
				},
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
	if (err.code === 'ENOENT') {
		res.status(404).json({
			err: 'Projekt neexistuje',
			msg: 'Zadaný projekt neexistuje.',
		});
	}
	else {
		console.error(err.stack);
		res.status(500).json({
			err: 'Projekt nelze otevřít',
			msg: 'Během načítání projektu došlo k chybě.',
		});
	}
}


/**
 * Check if numbers are positive integers
 *
 * @param numbers
 * @return {boolean} Return TRUE only if all of the parameters fits
 */
function isNaturalNumber(...numbers) {
	for (let number of numbers) {
		if (typeof number !== 'number' || !Number.isInteger(number) || number < 0) return false;
	}
	return true;
}


/**
 * Determine if variables are declared
 *
 * @param variables Rest parameters
 * @return {boolean} Return TRUE only if all of the parameters are set
 */
function isset(...variables) {
	for (let variable of variables) {
		if (typeof variable === 'undefined') return false;
	}
	return true;
}
