const fs = require('fs');
const path = require('path');

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
				<playlist id="videotrack1">
					<entry />
					<blank duration="99" />
					<entry />
				</playlist>
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

exports.projectUploadFilePOST = (req, res, next) => {

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

			const jsdom = require("jsdom");
			const { JSDOM } = jsdom;
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
		},
		err => {
			return next(err);
		}
	);
};
