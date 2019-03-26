import config from '../config';
import mltxmlManager from '../models/mltxmlManager';

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

	//todo !!! Pokud není s požadavkem nahrávaný soubor, server spadne!!!

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

			const mltPath = mltxmlManager.getMLTpath(req.params.projectID);

			JSDOM.fromFile(mltPath, {contentType:'application/xml'}).then(
				dom => {
					const document = dom.window.document;

					const node = document.createElement('producer');
					node.id = 'producer' + fileID;
					node.innerHTML = `<property name="resource">${path.resolve(filepath)}</property>`;
					node.innerHTML += `<property name="musecut:mime_type">${mimeType}</property>`;

					const root = document.getElementsByTagName('mlt').item(0);
					root.prepend(node);
					mltxmlManager.saveMLT(req.params.projectID, root.outerHTML).then(
						() => {
							res.json({
								msg: `Upload of "${filename}" OK`,
								resource_id: fileID,
								resource_mime: mimeType,
							});
						},
						err => next(err)
					);
				},
				err => next(err)
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
				if (!isNaturalNumber(req.body.duration)) {
					res.status(403);
					res.json({
						err: 'Chybí délka trvání.',
						msg: 'Pro vložení obrázku na časovou osu je nutné zadat celočíselnou délku trvání > 0.',
					});
					return;
				}

				newEntry.setAttribute('in', '0');
				newEntry.setAttribute('out', (req.body.duration - 1).toString());
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
	if (typeof req.body.track === 'undefined' || typeof req.body.item === 'undefined' || typeof req.body.filter === 'undefined') {
		res.status(403);
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
				const tractors = document.querySelectorAll('mlt>playlist[id^="tractor"]');
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
				// Get track index for
				let trackIndex = 0;
				let node = item;
				while (node = node.previousElementSibling) {
					trackIndex++;
				}

				// Check if filter is already applied
				const tractorID = item.parentElement.parentElement.id;
				if (document.querySelector(`mlt>tractor[id="${tractorID}"]>filter[mlt_service="${req.body.filter}"][track="${trackIndex}"]`) !== null) {
					res.status(403);
					res.json({
						err: 'Filtr je již aplikován.',
						msg: `Položka "${req.body.item}" na stopě "${req.body.track}" má již filtr "${req.body.filter} aplikován".`,
					});
					return;
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


/**
 * Check if number is integer greater then zero
 *
 * @param {Number} number
 * @return {boolean}
 */
function isNaturalNumber(number) {
	return (typeof number === 'number' && Number.isInteger(number) && number > 0);
}
