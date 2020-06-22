#!/usr/bin/env node

const config = require("./config");
const fetch = require("node-fetch");
const Fuse = require("fuse.js");
const { spawn, exec } = require("child_process");
const persons = require("./.persons.json");
const tmp = require("tmp-promise");
const fs = require("fs");

const nameChoices = persons.colleagues.map((person) => {
  return {
    name: person.email,
    value: person,
  };
});

const authParam = new URLSearchParams({
  token: config.token,
  key: config.key,
});

const getBoards = async () => {
  const url = new URL(`https://api.trello.com/1/members/me/boards`);
  url.search = authParam;
  const text = await fetch(url).then((response) => response.text());

  return JSON.parse(text);
};

const getLists = async (boardId = config.basket.boardId) => {
  const url = new URL(`https://api.trello.com/1/boards/${boardId}/lists`);
  url.search = authParam;
  const text = await fetch(url).then((response) => response.text());

  return JSON.parse(text);
};

const getCards = async (listId) => {
  const url = new URL(`https://api.trello.com/1/lists/${listId}/cards`);
  url.search = authParam;
  const text = await fetch(url).then((response) => response.text());
  return JSON.parse(text);
};

const getShortCards = async (listId) => {
  return (await getCards(listId)).map((card) => {
    return {
      id: card.id,
      idShort: card.idShort,
      name: card.name,
      url: card.url,
    };
  });
};

const getTasks = async () => {
  let tasks = [];
  for (let listId of config.basket.taskListIds) {
    const cards = await getShortCards(listId);
    tasks = tasks.concat(cards);
  }

  return tasks;
};

const getReleaseCandidates = async () => {
  let candidates = [];
  const lists = [
    ...config.basket.releaseListIds,
    ...config.checkout.releaseListIds,
  ];
  for (let id of lists) {
    const cards = await getShortCards(id);
    candidates = candidates.concat(cards);
  }

  return candidates;
};

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

getTasks().then(async (tasks) => {
  const answers = await inquirer.prompt([
    {
      type: "autocomplete",
      name: "ticket",
      message: "Select a ticket",
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
      type: "search-checkbox",
      message: "Co-authors?",
      name: "coAuthors",
      choices: nameChoices,
    },
  ]);

  const initials = [persons.me, ...answers.coAuthors].map(
    (author) => author.initial
  );
  const coAuthors = answers.coAuthors.map((author) => {
    return `Co-authored-by: ${author.name} <${author.email}>`;
  });

  const message = `[${initials.join("/")}] - ticket ${
    answers.ticket.idShort
  } - ${answers.ticket.name}\n\n${coAuthors.join("\n")}`;

  const { path } = await tmp.file();
  await fs.writeFile(path, message, () => {
    let child = spawn("git", ["commit", "-t", path], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
  });
});
