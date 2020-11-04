#!/usr/bin/env node
const { program } = require("commander");
const { spawn, exec } = require("child_process");
const { getReleaseCandidates } = require("./api");
const { rejects } = require("assert");

program
  .option(
    "-b, --begin <begin>",
    "The node where the match process begins, e.g., origin/stable, 023dce(a hash)",
    "origin/stable"
  )
  .option(
    "-e, --end <end>",
    "The node where the match process ends, e.g., 023dce(a hash), a tag"
  );
program.parse(process.argv);

function getLastReleaseTag() {
  return new Promise((resolve) => {
    exec(`git tag`, (error, stdout, stderr) => {
      if (error) {
        rejects(stderr);
      } else {
        // resolve(stdout);
        const tags = stdout.split("\n");
        resolve(tags[tags.length - 2]);
      }
    });
  });
}

(async () => {
  const tag = await getLastReleaseTag();
  return tag;
})();

function isMergeCommit(message) {
  return /^merge/gi.test(message);
}

function isRevertCommit(message) {
  return /^revert/gi.test(message);
}

getReleaseCandidates().then(async (candidates) => {
  const tickets = new Map();
  for (const candidate of candidates) {
    tickets.set(candidate.idShort, candidate);
  }

  if (!program.end) {
    program.end = await getLastReleaseTag();
  }

  const log = await new Promise((resolve) => {
    exec(
      `git log --no-merges --cherry-pick --pretty="format:%s hash:%h" ${program.begin}...${program.end}`,
      (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        resolve(stdout ? stdout : stderr);
      }
    );
  });

  const messages = log.split("\n");

  let orphans = [];
  let danglings = [];
  let merges = [];
  let reverts = [];
  for (const message of messages) {
    const initialResult = /\[(.*?)\]/.exec(message);
    const ticketNumberResult = /(ticket|basket|platform|checkout) (\d*)/gi.exec(
      message
    );

    const hash = /hash:(.*)/g.exec(message)[1];
    const initials = initialResult ? initialResult[1].split("/") : [];
    const ticketNumber = Number(
      ticketNumberResult ? ticketNumberResult[2] : null
    );
    const commitMessage = message.substring(0, message.length - 15);

    if (ticketNumber === 0) {
      if (isMergeCommit(commitMessage)) {
        merges.push({
          hash,
          initials,
          commitMessage,
        });
      } else if (isRevertCommit(commitMessage)) {
        reverts.push({
          hash,
          initials,
          commitMessage,
        });
      } else {
        orphans.push({
          hash,
          initials,
          commitMessage,
          ticketNumber,
        });
      }
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

  console.log("Dangling commits");
  console.log("=================");
  for (const entry of danglings) {
    console.log(`${entry.hash} ${entry.ticketNumber} ${entry.commitMessage}`);
  }
  console.log("");
  console.log("Orphans commits");
  console.log("=================");
  for (const entry of orphans) {
    console.log(`${entry.hash} ${entry.commitMessage}`);
  }
  console.log("");
  console.log("Merge commits");
  console.log("=================");
  for (const entry of merges) {
    console.log(`${entry.hash} ${entry.commitMessage}`);
  }
  console.log("");
  console.log("Reverts commits");
  console.log("=================");
  for (const entry of reverts) {
    console.log(`${entry.hash} ${entry.commitMessage}`);
  }
});
