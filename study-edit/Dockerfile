FROM node:alpine
#ENV NODE_ENV production
ENV SKIP_ENV_VALIDATION 1

# RUN apk add tzdata
# ENV TZ="Europe/Berlin"

WORKDIR /usr/src/app


COPY package*.json .
COPY yarn.lock .
COPY prisma/ ./prisma

RUN yarn install

COPY . ./

# RUN yarn prisma migrate dev -n docker
# # building the app
# RUN yarn run build