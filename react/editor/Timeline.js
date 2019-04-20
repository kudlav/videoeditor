import React, { Component } from 'react';
import vis from 'vis';
import timeManager from '../../models/timeManager';

export default class Timeline extends Component {
	constructor(props) {
		super(props);

		this.timeline = null;
	}

	componentDidMount() {
		const container = document.getElementById('vis-timeline');
		const options = {
			height: 200,
			orientation: 'top',
			min: new Date(1970, 0, 1),
			max: new Date(1970, 0, 1, 23, 59, 59, 999),
			showCurrentTime: false,
			multiselect: true,
			multiselectPerGroup: true,
			stack: false,
			zoomMin: 100,
			zoomMax: 21600000,
			format: {
				minorLabels: {
					millisecond:'SSS [ms]',
					second:     's [s]',
					minute:     'HH:mm:ss',
					hour:       'HH:mm:ss',
					weekday:    'HH:mm:ss',
					day:        'HH:mm:ss',
					week:       'HH:mm:ss',
					month:      'HH:mm:ss',
					year:       'HH:mm:ss'
				},
				majorLabels: {
					millisecond:'HH:mm:ss',
					second:     'HH:mm:ss',
					minute:     '',
					hour:       '',
					weekday:    '',
					day:        '',
					week:       '',
					month:      '',
					year:       ''
				}
			}
		};
		this.timeline = new vis.Timeline(container, [], [], options);
	}

	componentDidUpdate() {

		const groups = [];
		const items = [];

		for (let track of this.props.items.video) {
			groups.push({
				id: track.id,
				content: '',
			});

			let actualTime = '00:00:00,000';
			let index = 0;

			for (let item of track.items) {
				if (item.resource === 'blank') {
					actualTime = timeManager.addDuration(item.length, actualTime);
				}
				else {
					const timeIn = actualTime.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					actualTime = timeManager.addDuration(actualTime, item.out);
					actualTime = timeManager.subDuration(actualTime, item.in);
					const timeOut = actualTime.match(/^(\d{2,}):(\d{2}):(\d{2}),(\d{3})$/);
					let content = this.props.resources[item.resource].name;
					if (item.filters.length > 0) content = '<div class="filter"></div><i class="filter material-icons">photo_filter</i>' + content;
					// todo Subtract transition duration
					items.push({
						id: index++,
						content: content,
						start: new Date(1970, 0, 1, Number(timeIn[1]), Number(timeIn[2]), Number(timeIn[3]), Number(timeIn[4])),
						end: new Date(1970, 0, 1, Number(timeOut[1]), Number(timeOut[2]), Number(timeOut[3]), Number(timeOut[4])),
						group: track.id,
						className: 'video',
					});
				}
			}
		}

		this.timeline.setData({
			items: items,
			groups: groups,
		});

		this.timeline.fit();
	}

	render() {
		return (<div id="vis-timeline"> </div>);
	}
}