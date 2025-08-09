'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const CATEGORY = 'categories'
const COSTS = 'costs'
const SALE_PRODUCT = 'sale-product'
const HISTORIES = 'history'
const ACTIVITY = 'activity'
const PRODUCT = 'product'
const SKLAD = 'sklad'

async function removeCollectionsBySkladId(collection, skladId, filterField = 'sklad') {
  const collections = await strapi.query(collection).find({ _limit: -1, [filterField]: skladId });
  if (collections?.length) {
    for (const c of collections) {
      await strapi.query(collection).delete({ id: c?.id })
    }
  }
}

module.exports = {
  async removeSklad(ctx) {
    try {
      const { skladId } = ctx.request.body;
      if (!skladId) return false;
      await Promise.all([
        removeCollectionsBySkladId(CATEGORY, skladId),
        removeCollectionsBySkladId(COSTS, skladId),
        removeCollectionsBySkladId(SALE_PRODUCT, skladId),
        removeCollectionsBySkladId(HISTORIES, skladId, 'skladId'),
        removeCollectionsBySkladId(ACTIVITY, skladId),
      ])
      const products = await strapi.query(PRODUCT).find({ _limit: -1, sklad: skladId });
      if (products?.length) {
        for (const p of products) {
          const deletions = []
          if (p?.image?.id) {
            deletions.push(strapi.query('file', 'upload').delete({ id: p.image.id }))
          }
          deletions.push(strapi.query(PRODUCT).delete({ id: p?.id }))
          await Promise.all(deletions)
        }
      }
      const sklad = await strapi.query(SKLAD).findOne({ _limit: -1, id: skladId });
      const users = sklad.users;
      for (const u of users) {
        const newPermissions = u.permissions.filter(p => +p?.sklad?.id !== +skladId);
        await strapi.query('user', 'users-permissions').update(
          { id: u.id },
          {
            permissions: newPermissions
          }
        );
      }
      await strapi.query(SKLAD).delete({ id: skladId });
      return true
    } catch (error) {
      return false
    }
  },
  async bulkUpdateSklads(ctx) {
    try {
      const { sklads } = ctx.request.body;
      if (!sklads?.length) return false;
      for (const s of sklads) {
        await strapi.query(SKLAD).update(
          { id: s.id },
          {
            order: s.order
          }
        );
      }
      return true
    } catch (error) {
      return false
    }
  },
  async statisticFinance(ctx) {
    const queries = ctx?.query
    let sumAvailableProductsWholesalePrice = 0
    let incomeFromAvailableProducts = 0

    const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
    if (!user) return [];

    const skladsId = user.sklads.map(s => s.id);

    const filteredQueries = { ...queries };
    delete filteredQueries['_limit'];

    try {
      const products = await strapi.query(PRODUCT).find({ _limit: -1, sklad: skladsId, ...filteredQueries });
      if (products?.length) {
        sumAvailableProductsWholesalePrice = await products.reduce((total, product) => {
          const sizesLength = product.sizes.length || product.countSizes || 1
          const sum = total + (product.origPrice * sizesLength)
          return sum
        }, 0);
        incomeFromAvailableProducts = await products.reduce((total, product) => {
          const sizesLength = product.sizes.length || product.countSizes || 1
          const sum = total + (product.newPrice * sizesLength)
          return sum
        }, 0);
      }
    } finally {
      return {
        sumAvailableProductsWholesalePrice,
        incomeFromAvailableProducts: incomeFromAvailableProducts - sumAvailableProductsWholesalePrice
      };
    }
  },
};
