#!/usr/bin/env node

const { getReleaseCandidates } = require('./api');
const clipboardy = require('clipboardy');

getReleaseCandidates().then((tickets) => {
	const titles = tickets.map((ticket) => {
		return ticket.name;
	});

	const releaseNotes = titles.join('\n');
	clipboardy.writeSync(releaseNotes);
	console.log('Release note is successfully copied to clipboard:');
	console.log('');
	console.log(releaseNotes);
});
