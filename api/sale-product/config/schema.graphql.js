module.exports = {
  definition: `
    input AddProductSizesToSaleInput {
      skladId: String!
      productId: String!
      discount: Int
      percentageDiscount: Boolean
      sizes: [ComponentComponentsSizeInput]
      countSizes: Int
      payCard: Boolean
      payCash: Boolean
      cashSum: Int
      cardSum: Int
      comment: String
    }
  `,
  mutation: `
    addProductSizesToSale(input: AddProductSizesToSaleInput!): SaleProduct!
  `,
  resolver: {
    Mutation: {
      addProductSizesToSale: {
        description: 'Add sizes to sale sizes list',
        resolverOf: 'application::sale-product.sale-product.create',
        resolver: 'application::sale-product.sale-product.addProductSizesToSale',
      },
    },
  }
};
