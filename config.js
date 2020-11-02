module.exports = {
  token: process.env.TRELLO_TOKEN,
  key: process.env.TRELLO_KEY,

  basket: {
    boardId: '5e7ce175abdd1a6c15dd42bb',
    taskListIds: [
      '5e7ce18555eb7148d6efa4fb',
      '5e7ce1889c49920359cb3572',
      '5ea8139a7df17236d04d07ae',
      '5e7ce18aac59946aa14a9a11',
    ],
    // Checkout release candidate column
    releaseListIds: ['5ec794eda8a37a3fd861b705'],
  },
  checkout: {
    boardId: '59a6815b1ac3f97ab1a1116b',
    taskListIds: [
      '5e7c7e679492de0cbc8a5aad',
      '5d7a5d38759ee23f4b86db98',
      '5c8a6e13c7d4c817f9445d38',
      '59a6815b1ac3f97ab1a1116f',
      '5e8c98f51bacf1415e28a9ad',
    ],
    // Basket release candidate column
    releaseListIds: ['5ec7f49036724d7e66d77060'],
  },
};
