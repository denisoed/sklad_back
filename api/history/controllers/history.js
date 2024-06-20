'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const HISTORY = 'history'

module.exports = {
  async listHistories(ctx) {
    // ctx.state.user.id
    const queries = ctx.request.query;
    const user = await strapi.query('user', 'users-permissions').findOne({ id: ctx.state.user.id });
    if (!user) return [];

    const skladsId = user.sklads.map(s => s.id);

    const filteredQueries = { ...queries };
    delete filteredQueries['dates'];
    delete filteredQueries['_limit'];

    const histories = await strapi.query(HISTORY).find({ _limit: -1, sklad: skladsId, ...filteredQueries });
    if (!queries?.dates?.length) return histories;
    const filteredHistories = histories.filter(p => queries.dates.some(d => JSON.stringify(p.created_at).includes(d)));
    return filteredHistories;
  },
};
