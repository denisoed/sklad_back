module.exports = {
  definition: `
    type ProductSizeInput {
      id: String
      size: String
    }
    
    type ProductCategoryInput {
      id: String
      name: String
    }
    
    type ProductSkladInput {
      id: String
      name: String
    }
    
    type PreparedProductData {
      name: String
      quantity: Int
      sizes: [ProductSizeInput]
      color: String
      wholesalePrice: Float
      retailPrice: Float
      sklad: ProductSkladInput
      category: ProductCategoryInput
    }
  `,
  query: `
    prepareNewProduct(q: String!): PreparedProductData
    productsWithMinSizes(where: JSON, sort: String): [Product]
    search(q: String, where: JSON, sizes: [String], _limit: Int, _sort: String): [Product]
  `,
  resolver: {
    Query: {
      prepareNewProduct: {
        description: 'Search product',
        resolverOf: 'application::product.product.find',
        resolver: 'application::product.product.prepareNewProduct',
      },
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
