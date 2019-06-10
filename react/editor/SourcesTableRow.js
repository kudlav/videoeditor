/**
 * @file SourcesTableRow.js
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class SourcesTableRow extends Component {
	constructor(props) {
		super(props);
		this.item = this.props.item;
	}

	render() {
		return (
			<tr>
				<td>
					<div><i className="material-icons resource-preview" aria-hidden="true">panorama</i></div>
				</td>
				<td>
					{this.item.name}<br/>
					{this.item.duration !== null && <small>Délka: {this.item.duration}</small>}
				</td>
				<td className="column-right">
					<button onClick={() => this.props.onInsert(this.item.id)}><i className="material-icons" aria-hidden="true">control_point</i></button>
					<button onClick={() => this.props.onRemove(this.item.id)}><i className="material-icons" aria-hidden="true">delete</i></button>
				</td>
			</tr>
		);
	}
}

SourcesTableRow.propTypes = {
	item: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		duration: PropTypes.string,
	}).isRequired,
	onRemove: PropTypes.func.isRequired,
	onInsert: PropTypes.func.isRequired,
};
