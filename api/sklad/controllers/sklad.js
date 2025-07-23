'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const Fuse = require('fuse.js');
const { transliterate } = require('transliteration');
const { newStemmer } = require('snowball-stemmers');

const CATEGORY = 'categories'
const COSTS = 'costs'
const SALE_PRODUCT = 'sale-product'
const HISTORIES = 'history'
const ACTIVITY = 'activity'
const PRODUCT = 'product'
const SKLAD = 'sklad'

const SEARCH_FIELDS = ['name', 'colorName'];

const stemmer = newStemmer('russian');

async function removeCollectionsBySkladId(collection, skladId) {
  const collections = await strapi.query(collection).find({ _limit: -1, sklad: skladId });
  if (collections?.length) {
    for (const c of collections) {
      strapi.query(collection).delete({ id: c?.id })
    }
  }
}

function normalizeAndStem(str) {
  const ascii = transliterate(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove accents
    .replace(/ё/g, 'е')
    .replace(/[ьъ]/g, '')
    .replace(/[^a-z0-9а-я]/g, '');    // keep only letters and numbers

  // stemming: "джинсы","джинсовая"→"джинс"
  return stemmer.stem(ascii);
}

function smartSearch(products, query) {
  const queryTerms = query
    .trim()
    .split(/\s+/)
    .map(t => normalizeAndStem(t.toLowerCase()));

  const fuse = new Fuse(products, {
    keys: SEARCH_FIELDS,
    threshold: 0.3,
    ignoreLocation: true,
    getFn: (obj, path) => {
      const val = obj[path];
      return typeof val === 'string'
        ? normalizeAndStem(val)
        : '';
    }
  });
  // Search for matches for each term
  let fused = [];
  for (const term of queryTerms) {
    const termResults = fuse.search(term).map(r => r.item);
    // Combine results - product must contain at least one term
    fused = [...fused, ...termResults];
  }
  // Remove duplicates by id
  fused = fused.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  );
  return fused;
}

module.exports = {
  async removeSklad(ctx) {
    try {
      const { skladId } = ctx.request.body;
      if (!skladId) return false;
      Promise.all([
        removeCollectionsBySkladId(CATEGORY, skladId),
        removeCollectionsBySkladId(COSTS, skladId),
        removeCollectionsBySkladId(SALE_PRODUCT, skladId),
        removeCollectionsBySkladId(HISTORIES, skladId),
        removeCollectionsBySkladId(ACTIVITY, skladId),
      ])
      const products = await strapi.query(PRODUCT).find({ _limit: -1, sklad: skladId });
      if (products?.length) {
        for (const p of products) {
          Promise.all([
            strapi.query('file', 'upload').delete({ id: p?.image?.id }),
            strapi.query(PRODUCT).delete({ id: p?.id })
          ])
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
        sumAvailableProductsWholesalePrice = await products.reduce((prev, next) => {
          const sizesLength = next.sizes.length
          const sum = prev + (next.origPrice * sizesLength)
          return sum
        }, 0);
        incomeFromAvailableProducts = await products.reduce((prev, next) => {
          const sizesLength = next.sizes.length
          const sum = prev + (next.newPrice * sizesLength)
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
  async search(ctx) {
    const { _q } = ctx.query;

    try {
      const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
      if (!user) return [];

      const result = [];
      for (const sklad of user.sklads) {
        const products = await strapi.query(PRODUCT).find({
          sklad: sklad.id,
          _limit: -1
        });
        let list = [];

        if (_q && typeof _q === 'string') {
          list = smartSearch(products, _q);
        } else {
          list = products;
        }

        
        if (list.length > 0) {
          result.push({
            ...sklad,
            categories: [...new Set(list.map(p => p.category))].filter(Boolean),
            products: list
          });
        }
      }
      return result;
    } catch (err) {
      console.error(err);
      return [];
    }
  }
};
