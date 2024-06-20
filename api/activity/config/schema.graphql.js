module.exports = {
  query: `
    listActivities(where: JSON, sort: String): [Activity]
  `,
  resolver: {
    Query: {
      listActivities: {
        description: 'Filtered activity list',
        resolverOf: 'application::activity.activity.find',
        resolver: 'application::activity.activity.listActivities',
      },
    },
  }
};
