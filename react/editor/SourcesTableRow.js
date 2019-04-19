import React, { Component } from 'react';

export default class SourcesTableRow extends Component {
	constructor(props) {
		super(props);
		this.item = this.props.value.item;
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
					<button><i className="material-icons" aria-hidden="true">control_point</i></button>
					<button onClick={() => this.props.value.onRemove(this.item.id)}><i className="material-icons" aria-hidden="true">delete</i></button>
				</td>
			</tr>
		)
	}
}
