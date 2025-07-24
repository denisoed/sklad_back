module.exports = {
  definition: `
    type StatisticFinance {
      sumAvailableProductsWholesalePrice: Int
      incomeFromAvailableProducts: Int
    }
    input inputBulkSklad {
      id: ID!
      order: Int
    }
  `,
  query: `
    statisticFinance(where: JSON!): StatisticFinance
  `,
  mutation: `
    removeSklad(skladId: ID!): Boolean
    bulkUpdateSklads(sklads: [inputBulkSklad!]): Boolean
  `,
  resolver: {
    Query: {
      statisticFinance: {
        description: 'Get statistic finance',
        resolverOf: 'application::sklad.sklad.find',
        resolver: 'application::sklad.sklad.statisticFinance',
      },
    },
    Mutation: {
      removeSklad: {
        description: 'Remove sklad',
        resolverOf: 'application::sklad.sklad.delete',
        resolver: 'application::sklad.sklad.removeSklad'
      },
      bulkUpdateSklads: {
        description: 'Bulk update sklads',
        resolverOf: 'application::sklad.sklad.update',
        resolver: 'application::sklad.sklad.bulkUpdateSklads'
      }
    }
  }
};
