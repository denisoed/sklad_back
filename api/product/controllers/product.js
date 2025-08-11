'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const Fuse = require('fuse.js');
const { transliterate } = require('transliteration');
const { newStemmer } = require('snowball-stemmers');
const { generateResponse } = require('../../../services/openAI');

const PRODUCTS = 'product'
const SEARCH_FIELDS = ['meta'];

const stemmer = newStemmer('russian');

const createProductPrompt = (q, userSklads = [], userCategories = [], userSizes = []) => `You are a JSON parser. 
Your ONLY output must be valid JSON between <JSON> and </JSON> tags.
Never add comments, explanations, or text outside JSON.

Schema:
{
  "name": string | null,
  "quantity": number | null,
  "sizes": { id: string, size: string }[],
  "color": string | null,
  "wholesalePrice": number | null,
  "retailPrice": number | null,
  "sklad": { id: string, name: string } | null,
  "category": { id: string, name: string } | null
}

Available user data for matching:
Warehouses: ${JSON.stringify(userSklads)}
Categories: ${JSON.stringify(userCategories)}
Sizes: ${JSON.stringify(userSizes)}

When parsing:
- Match warehouse names to the available warehouses list above
- Match category names to the available categories list above  
- Match size values to the available sizes list above
- Use the exact id and name from the lists when found
- If no match found in lists, use null

Example:
Input: джинсовая куртка размер xl xxl черная 3 штуки оптовая цена 1000 розничная 1200 склад Куртки категория джинсы
Output:
<JSON>
{
  "name": "джинсовая куртка",
  "quantity": 3,
  "sizes": [{ id: "1", size: "XL" }, { id: "2", size: "XXL" }],
  "color": "черная",
  "wholesalePrice": 1000,
  "retailPrice": 1200,
  "sklad": { id: "1", name: "Куртки" },
  "category": { id: "1", name: "джинсы" }
}
</JSON>

Now parse this text:
${q}`;

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
  async prepareNewProduct(ctx) {
    const { _q } = ctx.query;
    try {
      const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
      const userSklads = user.sklads.map(s => ({ id: s.id, name: s.name }));
      const userCategories = await strapi.query('categories').find({ _limit: -1, sklad: userSklads.map(s => s.id) });
      const userCategoriesMap = userCategories.map(c => ({ id: c.id, name: c.name }));
      const userSizes = user.sizes.map(s => ({ id: s.id, size: s.size, list: s.list }));
      const response = await generateResponse(createProductPrompt(_q, userSklads, userCategoriesMap, userSizes));
      const jsonMatch = response.match(/<JSON>([\s\S]*?)<\/JSON>/);
      const json = jsonMatch ? jsonMatch[1].trim() : response;
      const parsedResult = JSON.parse(json);
      return parsedResult;
    } catch (err) {
      console.error(err);
      return { error: err.message };
    }
  },
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
  async search(ctx) {
    const { _q, _sizes } = ctx.query;
    const queries = ctx.request.query;

    try {
      const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
      if (!user || !user.sklads?.length) return [];

      const filteredQueries = { ...queries };
      delete filteredQueries['_q'];
      delete filteredQueries['_sizes'];

      const products = await strapi.query(PRODUCTS).find({
        sklad: user.sklads.map(s => s.id),
        _limit: -1,
        ...filteredQueries
      });
      
      let list = [];

      if (_q && typeof _q === 'string') {
        list = smartSearch(products, _q);
      } else {
        list = products;
      }

      if (_sizes?.length) {
        list = list.filter(p => _sizes.some(_s => p.sizes.some(s => s.size === _s)));
      }

      return list;
    } catch (err) {
      console.error(err);
      return [];
    }
  }
};
