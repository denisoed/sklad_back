module.exports = {
  query: `
    productsWithMinSizes(where: JSON, sort: String): [Product]
    search(q: String, where: JSON, sizes: [String], _limit: Int, _sort: String): [Product]
  `,
  resolver: {
    Query: {
      productsWithMinSizes: {
        description: 'Get products with min sizes',
        resolverOf: 'application::product.product.find',
        resolver: 'application::product.product.productsWithMinSizes',
      },
      products: {
        description: 'Return a list of products',
        policies: [
          'global::is-authenticated'
        ],
      },
      search: {
        description: 'Search sklad products',
        resolverOf: 'application::product.product.find',
        resolver: 'application::product.product.search',
      },
    },
  },
};
