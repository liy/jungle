// Load env variables from .env file
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const me = require("./me.json");
const config = require("./config");
const fetch = require("node-fetch");

const defaultBoardId = config[me.team].boardId;

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

const getLists = async (boardId = defaultBoardId) => {
  const url = new URL(`https://api.trello.com/1/boards/${boardId}/lists`);
  url.search = authParam;
  const text = await fetch(url).then((response) => response.text());

  return JSON.parse(text);
};

const getCards = async (listId) => {
  const url = new URL(`https://api.trello.com/1/lists/${listId}/cards`);
  url.search = authParam;
  const text = await fetch(url).then(async (response) => {
    const t = await response.text();
    return t;
  });
  return JSON.parse(text);
};

const getCard = async (cardId) => {
  const url = new URL(`https://api.trello.com/1/cards/${cardId}`);
  url.search = authParam;
  const text = await fetch(url).then(async (response) => response.text());
  return JSON.parse(text);
};

const getShortCards = async (listId) => {
  return (await getCards(listId)).map((card) => {
    return {
      id: card.id,
      idShort: card.idShort,
      name: card.name,
      url: card.url,
      idBoard: card.idBoard,
    };
  });
};

const getAllCards = async (boardId = defaultBoardId) => {
  const url = new URL(`https://api.trello.com/1/boards/${boardId}/cards`);
  url.search = authParam;
  const text = await fetch(url).then((response) => response.text());
  return JSON.parse(text);
};

const findReleaseCandidateLists = async (boardId) => {
  const lists = await getLists(boardId);
  const regex = new RegExp("release ?candidates?", "gim");
  const rcLists = lists.filter((list) => {
    return regex.test(list.name);
  });
  return rcLists;
};

const getReleaseCandidateLists = async () => {
  return (
    await Promise.all([
      findReleaseCandidateLists(config.basket.boardId),
      findReleaseCandidateLists(config.checkout.boardId),
      findReleaseCandidateLists(config.platform.boardId),
    ])
  ).flat();
};

const getReleaseCandidates = async () => {
  let candidates = [];
  const lists = await getReleaseCandidateLists();
  for (let list of lists) {
    const cards = await getShortCards(list.id);
    candidates = candidates.concat(cards);
  }

  return candidates;
};

module.exports = {
  getAllCards,
  getReleaseCandidates,
  getBoards,
  getLists,
  getCards,
  getReleaseCandidateLists,
};
