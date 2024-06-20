'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const COSTS_FIELD = 'costs'

module.exports = {
  async listCostsSum(ctx) {
    const queries = ctx.request.query;
    const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
    if (!user) return [];

    const skladsId = user.sklads.map(s => s.id);

    const filteredQueries = { ...queries };
    delete filteredQueries['dates'];
    delete filteredQueries['_limit'];

    const costs = await strapi.query(COSTS_FIELD).find({ _limit: -1, sklad: skladsId, ...filteredQueries });
    if (!queries?.dates?.length) return costs;
    const filteredCosts = costs.filter(p => queries.dates.some(d => JSON.stringify(p.created_at).includes(d)));
    const sum = await filteredCosts.reduce((prev, next) => prev + next.sum, 0);
    return {
      sum,
    };
  },
  async listCosts(ctx) {
    const queries = ctx.request.query;
    const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
    if (!user) return [];

    const skladsId = user.sklads.map(s => s.id);

    const filteredQueries = { ...queries };
    delete filteredQueries['dates'];
    delete filteredQueries['_limit'];

    const costs = await strapi.query(COSTS_FIELD).find({ _limit: -1, sklad: skladsId, ...filteredQueries });
    if (!queries?.dates?.length) return costs;
    const filteredCosts = costs.filter(p => queries.dates.some(d => JSON.stringify(p.created_at).includes(d)));
    return filteredCosts;
  },
};
