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

		// milliseconds
		durA[4] = durA[4].replace(/^0+/, '');
		durB[4] = durB[4].replace(/^0+/, '');
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
		formattedTime += `${time[4]}000`.slice(0,3);

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
		formattedTime += `${time[4]}000`.slice(0,3);

		return formattedTime;
	},
}
