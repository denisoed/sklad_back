const _ = require("lodash");

/**
 * Throws an ApolloError if context body contains a bad request
 * @param contextBody - body of the context object given to the resolver
 * @throws ApolloError if the body is a bad request
 */
function checkBadRequest(contextBody) {
  if (_.get(contextBody, "statusCode", 200) !== 200) {
    const message = _.get(contextBody, "error", "Bad Request");
    const exception = new Error(message);
    exception.code = _.get(contextBody, "statusCode", 400);
    exception.data = contextBody;
    throw exception;
  }
}

module.exports = {
  definition: /* GraphQL */ `
    type UsersPermissionsAuthPayload {
      jwt: String!
      refresh: String!
    }
    type UsersPermissionsRefreshTokenPayload {
      jwt: String!
      refresh: String
    }
    type UsersPermissionsRevokeTokenPayload {
      confirmed: Boolean
    }
    extend type UsersPermissionsMe {
      permissions: [ComponentComponentsPermission]
    }
  `,
  mutation: `
    auth(identifier: String!, password: String!): UsersPermissionsAuthPayload!
    refreshToken(token: String!, renew: Boolean): UsersPermissionsRefreshTokenPayload!
    revokeToken(token: String!): UsersPermissionsRevokeTokenPayload!
    telegramAuth(initData: String!, mode: String!): UsersPermissionsAuthPayload!
  `,
  resolver: {
    Mutation: {
      auth: {
        description: "Auth user to system",
        resolverOf: "plugins::users-permissions.auth.auth",
        resolver: async (obj, options, { context }) => {
          context.query = _.toPlainObject(options);

          await strapi.plugins[
            "users-permissions"
          ].controllers.auth.auth(context);
          let output = context.body.toJSON
            ? context.body.toJSON()
            : context.body;

          checkBadRequest(output);

          return output;
        },
      },
      refreshToken: {
        description: "Refresh JWT Token",
        resolverOf: "plugins::users-permissions.auth.refreshToken",
        resolver: async (obj, options, { context }) => {
          context.query = _.toPlainObject(options);

          await strapi.plugins[
            "users-permissions"
          ].controllers.auth.refreshToken(context);
          let output = context.body.toJSON
            ? context.body.toJSON()
            : context.body;

          checkBadRequest(output);

          return output;
        },
      },
      revokeToken: {
        description: "Revoke Refresh Token",
        resolverOf: "plugins::users-permissions.auth.revoke",
        resolver: async (obj, options, { context }) => {
          context.query = _.toPlainObject(options);

          await strapi.plugins["users-permissions"].controllers.auth.revoke(
            context
          );
          let output = context.body.toJSON
            ? context.body.toJSON()
            : context.body;

          checkBadRequest(output);

          return output;
        },
      },
      telegramAuth: {
        description: "Telegram Auth",
        resolverOf: "plugins::users-permissions.auth.telegramAuth",
        resolver: async (obj, options, { context }) => {
          context.query = _.toPlainObject(options);

          await strapi.plugins[
            "users-permissions"
          ].controllers.auth.telegramAuth(context);
          let output = context.body.toJSON
            ? context.body.toJSON()
            : context.body;

          checkBadRequest(output);

          return output;
        },
      },
    },
  },
};
