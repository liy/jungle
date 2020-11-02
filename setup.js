#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');

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
    {
      type: 'input',
      name: 'key',
      message: 'Trello key? Get it here: https://trello.com/app-key',
    },
    {
      type: 'input',
      name: 'token',
      message: 'Trello token? Get it here: https://trello.com/app-key',
    },
  ])
  .then((answers) => {
    fs.writeFile(
      path.resolve(__dirname, './me.json'),
      JSON.stringify({
        name: answers.name,
        email: answers.email,
        initial: answers.initial,
      }),
      () => {}
    );

    fs.writeFile(
      path.resolve(__dirname, './.env'),
      `TRELLO_KEY=${answers.key}\nTRELLO_TOKEN=${answers.token}`,
      () => {}
    );

    fs.writeFile(path.resolve(__dirname, './colleagues.json'), `[]`, () => {});
  });
