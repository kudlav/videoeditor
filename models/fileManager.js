/**
 * @file Manager for work with media files
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

const { exec } = require('child_process');
import log from './logger';

export default {

	/**
	 * Get time duration of file. Return null when file is not video or audio.
	 *
	 * @param filepath
	 * @param mimeType
	 * @return {Promise<?string>}
	 */
	getDuration(filepath, mimeType) {
		return new Promise((resolve, reject) => {
			if (new RegExp(/^video\//).test(mimeType) || new RegExp(/^audio\//).test(mimeType)) {
				exec(`ffmpeg -i ${filepath} 2>&1 | grep Duration | cut -d ' ' -f 4 | sed s/,// | sed s/\\\\./,/`, (err, stdout) => {
					if (err) {
						log.error(err);
						resolve(null);
					}
					else {
						let duration = stdout.trim();
						if (duration !== '') duration += '0';
						resolve(duration);
					}
				});
			}
			else {
				resolve(null);
			}
		});
	}

};
