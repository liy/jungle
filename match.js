#!/usr/bin/env node
const { program } = require('commander');
const { spawn, exec } = require('child_process');
const { getReleaseCandidates } = require('./api');

program
  .option(
    '-b, --begin <begin>',
    'The node where the match process begins, e.g., origin/stable, 023dce(a hash)',
    'origin/stable'
  )
  .requiredOption(
    '-e, --end <end>',
    'The node where the match process ends, e.g., 023dce(a hash), a tag'
  );
program.parse(process.argv);

getReleaseCandidates().then(async (candidates) => {
  const tickets = new Map();
  for (const candidate of candidates) {
    tickets.set(candidate.idShort, candidate);
  }

  const args = [
    'log',
    '--pretty=format:%s hash:%h',
    `${program.begin}...${program.end}`,
  ];

  const child = spawn('git', args, {
    cwd: process.cwd(),
  });

  const data = await new Promise((resolve) => {
    exec(
      `git log --pretty="format:%s hash:%h" ${program.begin}...${program.end}`,
      (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        resolve(stdout ? stdout : stderr);
      }
    );
  });

  const messages = data.split('\n');

  let orphans = [];
  let danglings = [];
  for (const message of messages) {
    const initialResult = /\[(.*?)\]/.exec(message);
    const ticketNumberResult = /ticket (\d*)/g.exec(message);

    const hash = /hash:(.*)/g.exec(message)[1];
    const initials = initialResult ? initialResult[1].split('/') : [];
    const ticketNumber = Number(
      ticketNumberResult ? ticketNumberResult[1] : null
    );
    const commitMessage = message.substring(0, message.length - 15);

    if (ticketNumber === 0) {
      orphans.push({
        hash,
        initials,
        commitMessage,
        ticketNumber,
      });
    } else {
      if (!tickets.has(ticketNumber)) {
        danglings.push({
          hash,
          initials,
          commitMessage,
          ticketNumber,
        });
      }
    }
  }

  danglings = danglings.sort((a, b) => {
    if (Number(a.ticketNumber) < Number(b.ticketNumber)) {
      return -1;
    } else {
      return 1;
    }
  });

  console.log('Dangling commits');
  console.log('=================');
  for (const entry of danglings) {
    console.log(`${entry.hash} ${entry.ticketNumber} ${entry.commitMessage}`);
  }
  console.log('');
  console.log('Orphans commits');
  console.log('=================');
  for (const entry of orphans) {
    console.log(`${entry.hash} ${entry.commitMessage}`);
  }
});
