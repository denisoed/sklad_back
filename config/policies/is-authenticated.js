'use strict';

/**
 * `is-authenticated` policy.
 */
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = async (ctx, next) => {
  const today = new Date();
  const exp = ctx?.state?.user?.expiredAt
  if (exp && new Date(exp) <= new Date(today)) {
    return ctx.badRequest(
      null,
      formatError({
        id: "Auth.form.error.blocked",
        message: "Your account is blocked",
      })
    );
  }

  await next();
};
