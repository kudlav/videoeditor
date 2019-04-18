import React, { Component } from 'react';
import LoadingDialog from "./LoadingDialog";
import Sources from "./Sources";

export default class App extends Component {

	constructor(props) {
		super(props);

		this.state = {
			project: window.location.href.match(/project\/([^\/]*)/)[1],
			loading: true,
		};

		this.loadFinished = this.loadFinished.bind(this);
	}

	render() {
		return (
			<>
			<header>
				<LoadingDialog show={this.state.loading}/>
				<button className="error"><i className="material-icons" aria-hidden="true">arrow_back</i>Zrušit úpravy
				</button>
				<div className="divider"/>
				<button><i className="material-icons" aria-hidden="true">language</i>Jazyk</button>
				<button><i className="material-icons" aria-hidden="true">save_alt</i>Exportovat</button>
				<button className="success" style={{float: 'right'}}><i className="material-icons" aria-hidden="true">done_outline</i>Dokončit</button>
			</header>
			<main>
				<div>
					<Sources project={this.state.project} onLoadFinished={this.loadFinished}/>
					<div id='preview'>
						<h3><i className="material-icons" aria-hidden={true}> movie </i>Náhled</h3>
						<video><source type="video/mp4" src="https://www.w3schools.com/html/mov_bbb.mp4"/></video>
						<br/>
						<div className="prev-toolbar">
							<button className="no-border" title="Zastavit přehrávání"><i className="material-icons" aria-hidden="true">stop</i></button>
							<button title="Pokračovat v přehrávání"><i className="material-icons" aria-hidden="true">play_arrow</i></button>
							<button title="Pozastavit přehrávání"><i className="material-icons" aria-hidden="true">pause</i></button>
							<button title="Předchozí událost"><i className="material-icons" aria-hidden="true">skip_previous</i></button>
							<button title="Následující událost"><i className="material-icons" aria-hidden="true">skip_next</i></button>
						</div>
					</div>
				</div>
			</main>
			<footer>
				<button><i className="material-icons" aria-hidden="true">flare</i>Přidat filtr</button>
				<button><i className="material-icons" aria-hidden="true">photo_filter</i>Přidat přechod</button>
				<button><i className="material-icons" aria-hidden="true">flip</i>Rozdělit v bodě</button>
				<button><i className="material-icons" aria-hidden="true">menu</i>Vlastnosti</button>
				<button><i className="material-icons" aria-hidden="true">remove</i>Odebrat</button>
				<div id="time">00:00:00 / 00:00:00</div>
				<img src="timeline.jpg"/>
			</footer>
			</>
		);
	}

	loadFinished() {
		this.setState({loading: false});
	}
}
