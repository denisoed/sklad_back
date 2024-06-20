module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        timezone: 'utc',
        client: env('DATABASE_CLIENT', 'postgres'),
        host: env('DATABASE_HOST', 'postgresdb'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'postgres'),
        username: env('DATABASE_USERNAME', 'postgres'),
        password: env('DATABASE_PASSWORD', 'password'),
        schema: 'public',
        ssl: env.bool('DATABASE_SSL', false),
      },
      options: {},
    },
  },
});
