const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");

const { JSDOM } = jsdom;

const PROJECT_PATHS = 'WORKER';

exports.default = (req, res) => {

	res.json(
		{
			msg: 'For API documentation see https://github.com/kudlav/videoeditor',
		}
	);

};

exports.projectPOST = (req, res, next) => {

	const data = `<?xml version="1.0"?>
		<mlt>
		  <multitrack>
		    <playlist id="videotrack1"></playlist>
		  </multitrack>
		</mlt>
	`;

	const projectID = '1234';

	fs.mkdir(path.join(PROJECT_PATHS, projectID), { recursive: true }, (err) => {
		if (err) return next(err);
	});

	fs.writeFile(path.join(PROJECT_PATHS, projectID, 'project.mlt'), data, (err) => {
		if (err) return next(err);

		console.log(`File ${path.join(PROJECT_PATHS, projectID, 'project.mlt')} has been saved.`);

		res.json(
			{
				projectID: projectID,
			}
		);
	});
};

exports.projectFilePOST = (req, res, next) => {

	//todo !!! Pokud není s požadavkem nahrávaný soubor, server spadne!!!

	req.busboy.on('file', (fieldname, file, filename, transferEncoding, mimeType) => {

		const fileID = Date.now();
		const extension = path.extname(filename);
		let filepath = path.join(PROJECT_PATHS, req.params.projectID, fileID.toString());
		if (extension.length > 1) filepath += extension;

		// Create a write stream of the new file
		const fstream = fs.createWriteStream(filepath);

		console.log(`Upload of '${filename}' started`);

		// Pipe it trough
		file.pipe(fstream);

		// On finish of the upload
		fstream.on('close', () => {
			console.log(`Upload of '${filename}' finished`);

			const mltPath = path.join(PROJECT_PATHS, req.params.projectID, 'project.mlt');

			JSDOM.fromFile(mltPath).then(
				dom => {
					const document = dom.window.document;

					const node = document.createElement("producer");
					node.id = fileID.toString();
					node.innerHTML = `<property name="resource">${path.resolve(filepath)}</property>`;

					const root = document.querySelector('mlt');
					root.appendChild(node);

					fs.writeFile(mltPath, root.outerHTML, (err) => {
						if (err) return next(err);

						console.log(`File ${mltPath} updated.`);
						res.json({
							msg: `Upload of '${filename}' OK`,
							resource_id: fileID.toString(),
						});
					});
				},
				err => {
					return next(err);
				}
			);
		});
	});

	req.pipe(req.busboy); // Pipe it trough busboy
};

exports.projectFileDELETE = (req, res, next) => {
	const mltPath = path.join(PROJECT_PATHS, req.params.projectID, 'project.mlt');

	JSDOM.fromFile(mltPath).then(
		dom => {
			const document = dom.window.document;
			const root = document.querySelector('mlt');

			const entries = document.querySelectorAll(`mlt>multitrack>playlist entry[producer="${req.params.fileID}"]`);
			if (entries.length > 0) {
				res.status(403);
				res.json({
					err: 'Položka je používána.',
					msg: 'Položka je v projektu používána. Před smazáním z projektu ji odstraňte z časové osy.',
				});
				return;
			}

			const producer = document.querySelector(`mlt>producer[id="${req.params.fileID}"]`);
			if (producer === null) {
				res.status(404);
				res.json({
					err: 'Položka nenalezena.',
					msg: 'Položka se v projektu již nenachází.'
				});
				return;
			}

			const properties = producer.getElementsByTagName('property');
			let filename;
			for (let property of properties) {
				if (property.getAttribute('name') === 'resource') filename = property.innerHTML;
			}

			if (filename === undefined)
				return next(`Project "${req.params.projectID}", file "${req.params.fileID}" property missing resource tag.`);

			// Try to remove file, log failure
			fs.unlink(filename, (err) => {
				if (err) console.log(err);
			});

			producer.remove();

			fs.writeFile(mltPath, root.outerHTML, (err) => {
				if (err) return next(err);

				console.log(`File ${mltPath} updated.`);
				res.json({
					msg: 'Položka byla úspěšně odebrána',
				});
			});
		},
		err => {
			return next(err);
		}
	);
};
