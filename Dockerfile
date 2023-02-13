FROM node:18-alpine

WORKDIR /app

COPY . ./

RUN corepack enable

RUN corepack prepare pnpm@7.27.0 --activate

RUN pnpm i

CMD [ "pnpm", "start" ]
