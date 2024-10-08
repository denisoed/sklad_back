module.exports = {
  query: `
    listHistories(where: JSON, sort: String, limit: Int, start: Int): [History]
  `,
  resolver: {
    Query: {
      listHistories: {
        description: 'Filtered history list',
        resolverOf: 'application::history.history.find',
        resolver: 'application::history.history.listHistories',
      },
    },
  }
};
