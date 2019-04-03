import config from '../config';
import mltxmlManager from '../models/mltxmlManager';
import fileManager from '../models/fileManager';

const fs = require('fs');
const path = require('path');
const nanoid = require('nanoid');
const jsdom = require("jsdom");

const { JSDOM } = jsdom;

exports.default = (req, res) => {

	res.json({
			msg: 'For API documentation see https://github.com/kudlav/videoeditor',
	});

};


exports.projectPOST = (req, res, next) => {

	const data = `<mlt>
  <playlist id="videotrack0"/>
    <tractor id="main">
      <multitrack>
        <track producer="videotrack0" />
      </multitrack>
  </tractor>
</mlt>`;

	const projectID = '1234';

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
					length += '0';

					const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

					JSDOM.fromFile(mltPath, {contentType:'application/xml'}).then(
						dom => {
							const document = dom.window.document;

							const node = document.createElement('producer');
							node.id = 'producer' + fileID;
							node.innerHTML = `<property name="resource">${path.resolve(filepath)}</property>`;
							node.innerHTML += `<property name="musecut:mime_type">${mimeType}</property>`;
							if (isValidDuration(length))
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
						err => next(err)
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
						msg: 'Zdroj byl úspěšně odebrána',
					});
				},
				err => next(err)
			);
		},
		err => next(err)
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
				if (!isValidDuration(req.body.duration)) {
					res.status(400);
					res.json({
						err: 'Chybí délka trvání.',
						msg: 'Pro vložení obrázku na časovou osu je nutné zadat trvání ve formátu 00:00:00,000.',
					});
					return;
				}

				newEntry.setAttribute('in', '0');
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
		err => next(err)
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
			if (mltxmlManager.isSimleNode(item)) {
				// Create playlist after last producer
				const playlists = document.querySelectorAll('mlt>playlist[id^="playlist"]');
				const producers = document.getElementsByTagName('producer');
				const lastProducer = producers.item(producers.length - 1);
				const newPlaylist = document.createElement('playlist');
				newPlaylist.id = 'playlist' + playlists.length;
				newPlaylist.innerHTML = item.outerHTML;
				root.insertBefore(newPlaylist, lastProducer.nextSibling);

				// Create tractor before videotrack0
				const tractors = document.querySelectorAll('mlt>tractor[id^="tractor"]');
				const videotrack0 = document.getElementById('videotrack0');
				const newTractor = document.createElement('tractor');
				newTractor.id = 'tractor' + tractors.length;
				newTractor.innerHTML = `<multitrack><track producer="${newPlaylist.id}"/></multitrack><filter mlt_service="${req.body.filter}" track="0"/>`;
				root.insertBefore(newTractor, videotrack0);

				// Update track playlist
				item.removeAttribute('in');
				item.removeAttribute('out');
				item.setAttribute('producer', newTractor.id);
			}
			else {
				const trackIndex = mltxmlManager.getTrackIndex(item);

				// Check if filter is already applied
				const filters = item.parentElement.parentElement.getElementsByTagName('filter');
				for (let filter of filters) {
					if (filter.getAttribute('mlt_service') === req.body.filter && filter.getAttribute('track') === trackIndex.toString()) {
						res.status(403);
						res.json({
							err: 'Filtr je již aplikován.',
							msg: `Položka "${req.body.item}" na stopě "${req.body.track}" má již filtr "${req.body.filter} aplikován".`,
						});
						return;
					}
				}

				// Add new filter
				const newFilter = document.createElement('filter');
				newFilter.setAttribute('mlt_service', req.body.filter);
				newFilter.setAttribute('track', trackIndex.toString());
				item.parentElement.parentElement.appendChild(newFilter);
			}

			mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
				() => {
					res.json({msg: 'Filtr přidán'});
				},
				err => next(err)
			);
		},
		err => next(err)
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

			const tractor = item.parentElement.parentElement;
			const trackIndex = mltxmlManager.getTrackIndex(item);
			const filters = tractor.getElementsByTagName('filter');
			let filter;
			for (let entry of filters) {
				if (entry.getAttribute('mlt_service') === req.body.filter && entry.getAttribute('track') === trackIndex.toString()) {
					filter = entry;
					break;
				}
			}

			// Check if filter exists
			if (mltxmlManager.isSimleNode(item) || filter === undefined) {
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
		err => next(err)
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

	if (!isNaturalNumber(req.body.itemA, req.body.itemA) || !isValidDuration(req.body.duration)) {
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
			const waitBeforeTransition = mltxmlManager.subDuration(durationA.out, req. body.duration);
			if (req.body.duration > durationA.time || req.body.duration > durationB.time) {
				res.status(400);
				res.json({
					err: 'Příliš dlouhá doba přechodu.',
					msg: 'Přechod je delší než jedna z položek přechodu.',
				});
				return;
			}

			if (mltxmlManager.isSimleNode(itemA) && mltxmlManager.isSimleNode(itemB)) {
				// Create playlist after last producer
				const producers = document.getElementsByTagName('producer');
				const lastProducer = producers.item(producers.length - 1);
				const playlists = document.querySelectorAll('mlt>playlist[id^="playlist"]');
				const newPlaylistA = document.createElement('playlist');
				newPlaylistA.id = 'playlist' + playlists.length;
				newPlaylistA.innerHTML = itemA.outerHTML;
				root.insertBefore(newPlaylistA, lastProducer.nextSibling);
				const newPlaylistB = document.createElement('playlist');
				newPlaylistB.id = 'playlist' + (playlists.length + 1);
				newPlaylistB.innerHTML = `<blank length="${waitBeforeTransition}"/>` + itemB.outerHTML;
				root.insertBefore(newPlaylistB, lastProducer.nextSibling);

				// Create tractor before videotrack0
				const tractors = document.querySelectorAll('mlt>tractor[id^="tractor"]');
				const videotrack0 = document.getElementById('videotrack0');
				const newTractor = document.createElement('tractor');
				newTractor.id = 'tractor' + tractors.length;
				newTractor.innerHTML = `<multitrack><track producer="${newPlaylistA.id}"/><track producer="${newPlaylistB.id}"/></multitrack>`;
				newTractor.innerHTML += `<transition mlt_service="${req.body.transition}" in="${waitBeforeTransition}" out="${durationA.out}" a_track="0" b_track="1"/>`;
				root.insertBefore(newTractor, videotrack0);

				// Update track
				itemA.removeAttribute('in');
				itemA.removeAttribute('out');
				itemA.setAttribute('producer', newTractor.id);
				itemB.remove();

				mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
					() => {
						res.json({msg: 'Přechod aplikován'});
					},
					err => next(err)
				);
			}
		},
		err => next(err)
	);

};


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
 * Check if the string is valid duration with non-zero value.
 *
 * @param {string} text In format 00:00:00,000
 * @return {boolean}
 */
function isValidDuration(text) {
	const regexpFormat = new RegExp(/^\d{2,}:\d{2}:\d{2},\d{3}$/);
	const regexpZero = new RegExp(/^0{2,}:00:00,000$/);
	return (regexpFormat.test(text) && !regexpZero.test(text));
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
