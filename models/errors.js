/**
 * @file Error messages cs-CZ
 * @author Vladan Kudlac <vladankudlac@gmail.com>
 */

const errors = {
	get uploadMissingFile400() { return {
		code: 400,
		err: 'Chybí soubor.',
		msg: 'Tělo požadavku musí obsahovat soubor k nahrání.',
	};},
	get parameterTrackMissing400() { return {
		code: 400,
		err: 'Chybí parametry.',
		msg: 'Chybí povinný parametr "track"',
	};},
	get parameterTrackTypeMissing400() { return {
		code: 400,
		err: 'Chybný parametr.',
		msg: 'Chybí parametr type, nebo má jinou hodnotu, než "video" nebo "audio".',
	};},
	get parameterItemMissing400() { return {
		code: 400,
		err: 'Chybí parametry',
		msg: 'Parametr track nebo item chybí.',
	};},
	get parameterDurationMissing400() { return {
		code: 400,
		err: 'Chybí délka trvání.',
		msg: 'Pro vložení obrázku na časovou osu je nutné zadat trvání ve formátu 00:00:00,000.',
	};},
	get parameterSplitMissing400() { return {
		code: 400,
		err: 'Chybí parametry.',
		msg: 'Chybí povinné parametry: track, item, time.',
	};},
	get parameterFilterMissing400() { return {
		code: 400,
		err: 'Chybí parametry.',
		msg: 'Chybí povinné parametry: "track", "item", "filter".',
	};},
	get parameterMoveMissing400() { return {
		code: 400,
		err: 'Chybí parametry.',
		msg: 'Chybí povinné parametry: track, trackTarget, item, time.',
	};},
	parameterTimeRange400: (time) => { return {
		code: 400,
		err: 'Parametr mimo rozsah hodnot.',
		msg: `Parametr time musí mít hodnotu mezi 00:00:00,000 a ${time}`,
	};},
	get parameterTimeWrong400() { return {
		code: 400,
		err: 'Chybný parametr.',
		msg: 'Parametr time musí být kladný, ve formátu 00:00:00,000.',
	};},
	get parameterTransitionMissing400() { return {
		code: 400,
		err: 'Chybí parametry.',
		msg: 'Chybí povinné parametry: track, itemA, itemB, transition, duration.',
	};},
	get parameterTransitionWrong400() { return {
		code: 400,
		err: 'Chybné parametry.',
		msg: 'Parametry itemA, itemB musí být celočíselné, nezáporné, duration musí být nenulové, ve formátu 00:00:00,000.',
	};},
	get parameterTransitionOrder400() { return {
		code: 400,
		err: 'Chybné parametry.',
		msg: 'itemA musí přímo následovat po itemB.',
	};},
	get transitionTooLong400() { return {
		code: 400,
		err: 'Příliš dlouhá doba přechodu.',
		msg: 'Přechod je delší než jedna z položek přechodu.',
	};},
	get imgWrongTrack400() { return {
		code: 400,
		err: 'Nepodporovaný typ souboru.',
		msg: 'Obrázky lze vložit pouze na video stopu.',
	};},
	get videoWrongTrack400() { return {
		code: 400,
		err: 'Nepodporovaný typ souboru.',
		msg: 'Video lze vložit pouze na video stopu.',
	};},
	get audioWrongTrack400() { return {
		code: 400,
		err: 'Nepodporovaný typ souboru.',
		msg: 'Audio lze vložit pouze na audio stopu.',
	};},
	get videoDurationMissing400() { return {
		code: 400,
		err: 'Chybí délka souboru.',
		msg: 'Video nemá zjištěnou délku. Opakujte akci, nebo soubor nahrajte znovu.',
	};},
	get audioDurationMissing400() { return {
		code: 400,
		err: 'Chybí délka souboru.',
		msg: 'Audio nemá zjištěnou délku. Opakujte akci, nebo soubor nahrajte znovu.',
	};},
	get tracksIncompatible400() { return {
		code: 400,
		err: 'Nekompatibilní stopy.',
		msg: 'Položky nelze přesouvat mezi video a audio stopami.',
	};},
	get trackDefaultDel403() { return {
		code: 403,
		err: 'Stopu nelze smazat.',
		msg: 'Výchozí stopy "videotrack0" a "audiotrack0" nelze smazat.',
	};},
	get fileWrongTrack403() { return {
		code: 403,
		err: 'Nepodporovaný typ souboru.',
		msg: 'Na časovou osu lze vložit pouze video, obrázek nebo audio.',
	};},
	get sourceInUse403() { return {
		code: 403,
		err: 'Zdroj je používán.',
		msg: 'Zdroj je v projektu používán. Před smazáním z projektu jej odstraňte z časové osy.',
	};},
	get transitionExists403() { return {
		code: 403,
		err: 'Přechod již aplikován.',
		msg: 'Zvolené prvky již mají vzájemný přechod.',
	};},
	filterExists403: (item, track, filter) => { return {
		code: 403,
		err: 'Filtr je již aplikován.',
		msg: `Položka "${item}" na stopě "${track}" má již filtr "${filter}" aplikován.`,
	};},
	get projectStillRendering403() { return {
		code: 403,
		err: 'Zpracování probíhá.',
		msg: 'Projekt je již zpracováván, počkejte na dokončení.',
	};},
	get moveNoSpace403() { return {
		code: 403,
		err: 'Cíl již obsahuje položku.',
		msg: 'Zadané místo není volné, položku nelze přesunout.',
	};},
	get projectNotFound404() { return {
		code: 404,
		err: 'Projekt neexistuje',
		msg: 'Zadaný projekt neexistuje.',
	};},
	get sourceNotFound404() { return {
		code: 404,
		err: 'Zdroj nenalezen.',
		msg: 'Zdroj se v projektu nenachází.'
	};},
	trackNotFound404: (track) => { return {
		code: 404,
		err: 'Stopa nenalezena.',
		msg: `Zadaná stopa  "${track}" se v projektu nenachází.`,
	};},
	itemNotFound404: (item, track) => { return {
		code: 404,
		err: 'Položka nenalezena.',
		msg: `Položka "${item}" se na stopě "${track}" nenachází.`,
	};},
	filterNotFound404: (item, track, filter) => { return {
		code: 404,
		err: 'Filtr nenalezen.',
		msg: `Filtr "${filter}" se na ${item}. položce stopy "${track}" nenachází.`,
	};},
	get projectFailedOpen500() { return {
		err: 'Projekt nelze otevřít',
		msg: 'Během načítání projektu došlo k chybě.',
	};}
};

module.exports = errors;
