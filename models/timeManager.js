/**
 * @file Manager for work duration format
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

export default {
	/**
	 * Compute (durationA - durationB)
	 *
	 * @param {String} durationA
	 * @param {String} durationB
	 * @return {String}
	 */
	subDuration(durationA, durationB) {
		let durA = durationA.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
		let durB = durationB.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
		let time = [];
		let formattedTime;

		for (let i = 1; i <= 4; i++) {
			durA[i] = Number(durA[i]);
			durB[i] = Number(durB[i]);
		}

		// milliseconds
		if (durA[4] < durB[4]) {
			durA[4] += 1000;
			durB[3]++;
		}
		time[4] = durA[4] - durB[4];

		// seconds
		if (durA[3] < durB[3]) {
			durA[3] += 60;
			durB[2]++;
		}
		time[3] = durA[3] - durB[3];

		// minutes
		if (durA[2] < durB[2]) {
			durA[2] += 60;
			durB[1]++;
		}
		time[2] = durA[2] - durB[2];

		// hours
		time[1] = durA[1] - durB[1];

		// string format
		formattedTime = `${time[1]}:`;
		if (formattedTime.length < 3) formattedTime = '0' + formattedTime;

		formattedTime += `00${time[2]}:`.slice(-3);
		formattedTime += `00${time[3]},`.slice(-3);

		time[4] = time[4].toString().slice(0,3);
		while (time[4].length < 3) time[4] = '0' + time[4];
		formattedTime += time[4];

		return formattedTime;
	},


	/**
	 * Compute (durationA + durationB)
	 *
	 * @param {String} durationA
	 * @param {String} durationB
	 * @return {string}
	 */
	addDuration(durationA, durationB) {
		let durA = durationA.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
		let durB = durationB.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
		let time = [];
		let formattedTime;

		// milliseconds
		durA[4] = durA[4].replace(/^0+/, '');
		durB[4] = durB[4].replace(/^0+/, '');
		time[4] = Number(durA[4]) + Number(durB[4]);
		if (time[4] >= 1000) {
			time[4] -= 1000;
			durB[3]++;
		}

		// seconds
		time[3] = Number(durA[3]) + Number(durB[3]);
		if (time[3] >= 60) {
			time[3] -= 60;
			durB[2]++;
		}

		// minutes
		time[2] = Number(durA[2]) + Number(durB[2]);
		if (time[2] >= 60) {
			time[2] -= 60;
			durB[1]++;
		}

		// hours
		time[1] = Number(durA[1]) + Number(durB[1]);

		// string format
		formattedTime = `${time[1]}:`;
		if (formattedTime.length < 3) formattedTime = '0' + formattedTime;

		formattedTime += `00${time[2]}:`.slice(-3);
		formattedTime += `00${time[3]},`.slice(-3);

		time[4] = time[4].toString().slice(0,3);
		while (time[4].length < 3) time[4] = '0' + time[4];
		formattedTime += time[4];

		return formattedTime;
	},


	/**
	 * Check if the string is valid duration with non-zero value.
	 *
	 * @param {string} text In format 00:00:00,000
	 * @return {boolean}
	 */
	isValidDuration(text) {
		const regexpFormat = new RegExp(/^\d{2,}:\d{2}:\d{2},\d{3}$/);
		const regexpZero = new RegExp(/^0{2,}:00:00,000$/);
		return (regexpFormat.test(text) && !regexpZero.test(text));
	},


	/**
	 * Get middle of duration interval
	 *
	 * @param {string} start Start time of interval
	 * @param {string} end End time of interval
	 * @return {string}
	 */
	middleOfDuration(start, end) {
		const duration = this.subDuration(end, start);
		const parsedDuration = duration.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
		let hour = Number(parsedDuration[1]);
		let minute = Number(parsedDuration[2]);
		let second = Number(parsedDuration[3]);
		let millisecond = Number(parsedDuration[4]);

		if ((hour % 2) === 0) {
			hour /= 2;
		}
		else {
			hour = (hour - 1) / 2;
			minute += 30;
		}

		if ((minute % 2) === 0) {
			minute /= 2;
		}
		else {
			minute = (minute - 1) / 2;
			second += 30;
		}

		if ((second % 2) === 0) {
			second /= 2;
		}
		else {
			second = (second - 1) / 2;
			millisecond += 500;
		}

		if ((millisecond % 2) === 0) {
			millisecond /= 2;
		}
		else {
			millisecond = (millisecond - 1) / 2;
		}

		let midDuration = `${hour}:`;
		if (midDuration.length < 3) midDuration = '0' + midDuration;

		midDuration += `00${minute}:`.slice(-3);
		midDuration += `00${second},`.slice(-3);

		millisecond = millisecond.toString().slice(0,3);
		while (millisecond.length < 3) millisecond = '0' + millisecond;
		midDuration += millisecond;

		return this.addDuration(start, midDuration);
	}
};
