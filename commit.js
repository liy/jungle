#!/usr/bin/env node

const Fuse = require("fuse.js");
const { spawn, exec } = require("child_process");
const me = require("./me.json");
const colleagues = require("./colleagues.json");
const tmp = require("tmp-promise");
const fs = require("fs");
const { getAllCards } = require("./api");

var inquirer = require("inquirer");
inquirer.registerPrompt(
  "autocomplete",
  require("inquirer-autocomplete-prompt")
);
inquirer.registerPrompt("search-checkbox", require("inquirer-search-checkbox"));

const options = {
  keys: ["idShort", "name"],
};

const search = async (input = "", tasks) => {
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

const getCurrentBranch = async () => {
  return new Promise((resolve, reject) => {
    exec("git branch --show-current", (err, stdout, stderr) => {
      resolve(stdout);
    });
  });
};

const getDefaultTicketNumberFromBranch = async () => {
  const numberPattern = /\d+/g;
  const branch = await getCurrentBranch();
  const matches = branch.match(numberPattern);
  if (matches) {
    return matches[0];
  }

  return undefined;
};

const getTasks = async () => {
  const cards = await getAllCards();
  return cards.map((card) => {
    return {
      id: card.id,
      idShort: card.idShort,
      name: card.name,
      url: card.url,
      idBoard: card.idBoard,
    };
  });
};

getTasks().then(async (tasks) => {
  const answers = await inquirer.prompt([
    {
      type: "autocomplete",
      name: "ticket",
      message: "Select a ticket",
      source: async (answersSoFar, input) => {
        if (!input) {
          input = await getDefaultTicketNumberFromBranch();
        }

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
      type: "search-checkbox",
      message: "Co-authors?",
      name: "coAuthors",
      choices: nameChoices,
    },
  ]);

  const initials = [me, ...answers.coAuthors].map((author) => author.initial);
  const coAuthors = answers.coAuthors.map((author) => {
    return `Co-authored-by: ${author.name} <${author.email}>`;
  });

  const message = `[${initials.join("/")}] - ${me.team} ${
    answers.ticket.idShort
  } - ${answers.ticket.name}\n\n${coAuthors.join("\n")}`;

  const { path } = await tmp.file();
  fs.writeFile(path, message, () => {
    let child = spawn("git", ["commit", "-t", path], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  });
});
