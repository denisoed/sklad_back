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
    search(q: String, _limit: Int, _sort: String): [Sklad]
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
      search: {
        description: 'Search sklad products',
        resolverOf: 'application::sklad.sklad.find',
        resolver: 'application::sklad.sklad.search',
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
    },
    Sklad: {
      categories: (obj, options) => {
        if (obj.categories && Array.isArray(obj.categories)) {
          return obj.categories;
        }
        return strapi.query('category').find({ sklad: obj.id, ...options });
      },
      products: (obj, options) => {
        if (obj.products && Array.isArray(obj.products)) {
          return obj.products;
        }
        return strapi.query('product').find({ sklad: obj.id, ...options });
      }
    }
  }
};
