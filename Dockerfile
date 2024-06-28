FROM node:14.17.3

ENV APP_ROOT /src
ENV NODE_ENV production

WORKDIR ${APP_ROOT}

COPY ./package.json ${APP_ROOT}
COPY ./package-lock.json ${APP_ROOT}

RUN npm i

COPY . ${APP_ROOT}

ARG aws_access_key_id
ARG aws_access_secret
ARG aws_bucket
ARG telegram_bot_key

ENV AWS_ACCESS_KEY_ID=${aws_access_key_id}
ENV AWS_ACCESS_SECRET=${aws_access_secret}
ENV AWS_BUCKET=${aws_bucket}
ENV TELEGRAM_BOT_KEY=${telegram_bot_key}

RUN npm run build:production

CMD ["npm", "run", "start"]
