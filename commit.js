#!/usr/bin/env node

const Fuse = require('fuse.js');
const { spawn, exec } = require('child_process');
const me = require('./me.json');
const colleagues = require('./colleagues.json');
const tmp = require('tmp-promise');
const fs = require('fs');
const { getTasks } = require('./api');

var inquirer = require('inquirer');
inquirer.registerPrompt(
	'autocomplete',
	require('inquirer-autocomplete-prompt')
);
inquirer.registerPrompt('search-checkbox', require('inquirer-search-checkbox'));

const options = {
	keys: ['idShort', 'name'],
};

const search = async (input = '', tasks) => {
	const fuse = new Fuse(tasks, options);
	const results = fuse.search(input).map((result) => {
		return result.item;
	});
	if (results.length === 0) {
		return tasks;
	}
	return results;
};

const nameChoices = colleagues.map((person) => {
	return {
		name: person.email,
		value: person,
	};
});

getTasks().then(async (tasks) => {
	const answers = await inquirer.prompt([
		{
			type: 'autocomplete',
			name: 'ticket',
			message: 'Select a ticket',
			source: async (answersSoFar, input) => {
				const results = await search(input, tasks);
				return results.map((ticket) => {
					return {
						name: `#${ticket.idShort} ${ticket.name}`,
						value: ticket,
					};
				});
			},
		},
		{
			type: 'search-checkbox',
			message: 'Co-authors?',
			name: 'coAuthors',
			choices: nameChoices,
		},
	]);

	const initials = [me, ...answers.coAuthors].map((author) => author.initial);
	const coAuthors = answers.coAuthors.map((author) => {
		return `Co-authored-by: ${author.name} <${author.email}>`;
	});

	const message = `[${initials.join('/')}] - ticket ${
		answers.ticket.idShort
	} - ${answers.ticket.name}\n\n${coAuthors.join('\n')}`;

	const { path } = await tmp.file();
	fs.writeFile(path, message, () => {
		let child = spawn('git', ['commit', '-t', path], {
			cwd: process.cwd(),
			stdio: 'inherit',
		});
	});
});
