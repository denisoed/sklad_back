'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const PRODUCTS = 'product'

module.exports = {
  async productsWithMinSizes(ctx) {
    const queries = ctx.request.query;
    const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
    if (!user) return [];
    if (!queries?.skladId) return products;
    const sklad = user.sklads.find(s => +s.id === +queries?.skladId);
    if (sklad.minSizes < 0) return [];
    const products = await strapi.query(PRODUCTS).find({ _limit: -1, sklad: queries.skladId });
    const filteredProducts = products.filter(p => {
      if (p.useNumberOfSizes) {
        return p.countSizes <= sklad.minSizes
      } else {
        return p.sizes.length <= sklad.minSizes
      }
    });
    return filteredProducts;
  },
};
