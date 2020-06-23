const config = require('./config');
const fetch = require('node-fetch');

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

module.exports = {
	getTasks,
	getReleaseCandidates,
	getBoards,
	getLists,
};
