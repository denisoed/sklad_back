'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const SALE_PRODUCT_FIELD = 'sale-product'

module.exports = {
  async addProductSizesToSale(ctx) {
    const { input } = ctx.request.body;
    const created = await strapi.services[SALE_PRODUCT_FIELD].create({
      sklad: input.skladId,
      product: input.productId,
      discount: input.discount,
      percentageDiscount: input.percentageDiscount,
      sizes: input.sizes,
      countSizes: input.countSizes,
      payCard: input.payCard,
      payCash: input.payCash,
      cashSum: input.cashSum,
      cardSum: input.cardSum,
      comment: input.comment,
    })
    return created
  },
};
