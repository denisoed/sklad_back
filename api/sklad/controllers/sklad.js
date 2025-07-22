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
  // транслитерация и очистка
  const ascii = transliterate(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // убираем акценты
    .replace(/ё/g, 'е')
    .replace(/[ьъ]/g, '')
    .replace(/[^a-z0-9а-я]/g, '');    // оставляем буквы и цифры

  // стемминг: "джинсы","джинсовая"→"джинс"
  return stemmer.stem(ascii);
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
  async skladsProducts(ctx) {
    const { _q } = ctx.query;
    if (!_q || typeof _q !== 'string') {
      return [];
    }

    try {
      const sklads = await strapi.query('sklad').find({
        _limit: ctx.query._limit || -1,
        _sort: ctx.query._sort || 'name:ASC'
      });
      const result = [];
      for (const sklad of sklads) {
        const products = await strapi.query('product').find({
          sklad: sklad.id,
          _limit: -1
        });

        // Разбиваем запрос на термины и нормализуем каждый
        const queryTerms = _q
          .trim()
          .split(/\s+/)
          .map(t => normalizeAndStem(t.toLowerCase()));

        const fuse = new Fuse(products, {
          keys: ['name', 'color'],
          threshold: 0.4,
          ignoreLocation: true,
          getFn: (obj, path) => {
            const val = obj[path];
            return typeof val === 'string'
              ? normalizeAndStem(val)
              : '';
          }
        });

        // Ищем совпадения для каждого термина
        let fused = [];
        for (const term of queryTerms) {
          const termResults = fuse.search(term).map(r => r.item);
          // Объединяем результаты - продукт должен содержать хотя бы один термин
          fused = [...fused, ...termResults];
        }
        // Убираем дубликаты по id
        fused = fused.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        if (fused.length > 0) {
          result.push({
            ...sklad,
            products: fused
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
