module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: 'https://api.sklad.cfd',
  admin: {
    url: 'https://dashboard.sklad.cfd/dashboard',
    auth: {
      secret: env('ADMIN_JWT_SECRET', '12e2ee7cb8c2fcdc713e466fda819b2b'),
    },
  },
});
