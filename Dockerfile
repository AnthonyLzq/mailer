FROM node:18-alpine

WORKDIR /app

COPY . ./

RUN corepack enable

RUN corepack prepare pnpm --activate

RUN pnpm i

CMD [ "pnpm", "start" ]
