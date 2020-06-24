#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const colleagues = require('./colleagues.json');

inquirer
	.prompt([
		{
			type: 'input',
			name: 'name',
			message: 'Full name?',
		},
		{
			type: 'input',
			name: 'email',
			message: 'Email?',
		},
		{
			type: 'input',
			name: 'initial',
			message: 'Initial?',
		},
	])
	.then((answers) => {
		colleagues.push({
			name: answers.name,
			email: answers.email,
			initial: answers.initial,
		});
		fs.writeFile(
			path.resolve(__dirname, './colleagues.json'),
			JSON.stringify(colleagues),
			() => {}
		);
	});
