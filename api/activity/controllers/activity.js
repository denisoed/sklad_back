'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const ACTIVITIES = 'activity'

module.exports = {
  async listActivities(ctx) {
    const userID = ctx?.state?.user?.id
    if (!userID) throw new Error('User id is missing!');

    const queries = ctx.request.query;
    const user = await strapi.query('user', 'users-permissions').findOne({ id: userID });
    if (!user) return [];

    const skladsId = user.sklads.map(s => s.id);

    const filteredQueries = { ...queries };
    delete filteredQueries['dates'];
    delete filteredQueries['_limit'];

    const activities = await strapi.query(ACTIVITIES).find({ _limit: -1, sklad: skladsId, ...filteredQueries });
    if (!queries?.dates?.length) return activities;
    const filteredActivities = activities.filter(p => queries.dates.some(d => JSON.stringify(p.created_at).includes(d)));
    return filteredActivities;
  },
  async statisticActivities(ctx) {
    const userID = ctx?.state?.user?.id
    if (!userID) throw new Error('User id is missing!');

    const user = await strapi.query('user', 'users-permissions').findOne({ id: userID });
    if (!user) return [];

    const activities = await strapi.query(ACTIVITIES).find({ _limit: -1, sklad: user.sklads.map(s => s.id) });

    const origPriceUsed = await activities.reduce((total, activity) => {
      const countUnits = activity.countSizes || activity.size?.split(', ')?.length || 1;
      const sum = total + (activity.origPrice * countUnits)
      return sum
    }, 0);

    const newPriceUsed = await activities.reduce((total, activity) => {
      const discount = activity.percentageDiscount ? ((activity.newPrice / 100) * activity.discount) : activity.discount
      const countUnits = activity.countSizes || activity.size?.split(', ')?.length || 1
      const sum = (total + (activity.newPrice * countUnits)) - discount
      return sum
    }, 0);

    const totalRevenue = newPriceUsed - origPriceUsed;

    return {
      origPriceUsed,
      newPriceUsed,
      totalRevenue
    };
  }
};
