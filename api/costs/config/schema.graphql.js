module.exports = {
  definition: `
    type CostsSum {
      sum: Int
    }
  `,
  query: `
    listCostsSum(where: JSON, sort: String): CostsSum
    listCosts(where: JSON, sort: String): [Costs]
  `,
  resolver: {
    Query: {
      listCostsSum: {
        description: 'Get costs types sum',
        resolverOf: 'application::costs.costs.find',
        resolver: 'application::costs.costs.listCostsSum',
      },
      listCosts: {
        description: 'Get costs',
        resolverOf: 'application::costs.costs.find',
        resolver: 'application::costs.costs.listCosts',
      },
    },
  }
};
