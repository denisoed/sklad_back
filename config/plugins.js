module.exports = ({ env }) => ({
  email: {
    provider: 'nodemailer',
    providerOptions: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'sklad.cfd@gmail.com',
        pass: 'hlbl andf ehww fuwv',
      }
    },
    settings: {
      defaultFrom: 'sklad.cfd@gmail.com',
      defaultReplyTo: 'sklad.cfd@gmail.com',
    },
  },
  upload: {
    provider: 'aws-s3',
    providerOptions: {
      accessKeyId: env('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env('AWS_ACCESS_SECRET'),
      params: {
        Bucket: env('AWS_BUCKET')
      }
    }
  },
});