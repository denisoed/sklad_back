module.exports = {
  definition: `
    type StatisticActivities {
      origPriceUsed: Int
      newPriceUsed: Int
      totalRevenue: Int
    }
  `,
  query: `
    listActivities(where: JSON, sort: String): [Activity]
    statisticActivities(where: JSON!): StatisticActivities
  `,
  resolver: {
    Query: {
      listActivities: {
        description: 'Filtered activity list',
        resolverOf: 'application::activity.activity.find',
        resolver: 'application::activity.activity.listActivities',
      },
      statisticActivities: {
        description: 'Get statistic activities',
        resolverOf: 'application::activity.activity.find',
        resolver: 'application::activity.activity.statisticActivities',
      },
    },
  }
};
