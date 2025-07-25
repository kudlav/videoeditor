/**
 * @file Controller for REST API
 * @autho...

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

		// Validate that the filepath is within the intended directory
		const resolvedPath = path.resolve(filepath);
		if (!resolvedPath.startsWith(path.resolve(config.projectPath, req.params.projectID))) {
			return errorResponse(error.invalidPath403, res);
		}

		// Create a write stream of the new file
		const fstream = fs.createWriteStream(resolvedPath);

		log.info(`Upload of "${filename}" started`);

		// Pipe it trough
		file.pipe(fstream);

		// On finish of the upload
		fstream.on('finish', () => {
			log.info(`Upload of "${filename}" finished`);

			fileManager.getDuration(resolvedPath, mimeType).then(
				length => {
					projectManager.load(req.params.projectID, 'w').then(
						([document, , release]) => {
							const node = document.createElement('producer');
							node.id = 'producer' + fileID;
							node.innerHTML = `<property name="resource">${path.resolve(resolvedPath)}</property>`;
							node.innerHTML += `<property name="musecut:mime_type">${mimeType}</property>`;
							node.innerHTML += `<property name="musecut:name">${filename}</property>`;
							if (length !== null) {
								if (timeManager.isValidDuration(length))
									node.innerHTML += `<property name="length">${length}</property>`;
								else {
									length = null;
									log.fatal(`Unable to get duration of ${mimeType}: ${resolvedPath}`);
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

...
