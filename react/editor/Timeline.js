import React, { Component } from 'react';
import vis from 'vis';

export default class Timeline extends Component {
	constructor(props) {
		super(props);

		this.updateGraph = this.updateGraph.bind(this);
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
					hour:       '',
					weekday:    '',
					day:        '',
					week:       '',
					month:      '',
					year:       ''
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
		this.timeline = new vis.Timeline(container, null, null, options);
		this.updateGraph();
	}

	componentDidUpdate() {
		this.updateGraph();
	}

	updateGraph() {
		const items = new vis.DataSet([{
			id: 1,
			content: 'First event',
			start: new Date(1970, 0, 1, 0, 1, 0, 0),
			end: new Date(1970, 0, 1, 0, 10, 0, 300),
			group: 'videotrack0',
			className: 'video',
		}/*, {
			id: 2,
			content: 'Pi and Mash',
			start: 20,
			group: 'videotrack0',
		}, {
			id: 3,
			content: 'Wikimania',
			start: '2014-08-08',
			end: 55,
			group: 'videotrack0',
		}, {
			id: 4,
			content: 'Something else',
			start: 83,
			group: 'videotrack0',
		}, {
			id: 5,
			content: 'Summer bank holiday',
			start: 84,
			group: 'videotrack0',
		}*/]);

		const groups = [{
			id: 'videotrack0',
			content: '',
		}];

		this.timeline.setData({
			items: items,
			groups: groups,
		});
	}

	render() {
		return (<div id="vis-timeline"> </div>);
	}
}