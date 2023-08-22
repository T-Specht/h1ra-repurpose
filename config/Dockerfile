FROM alpine
RUN apk add --no-cache envsubst
COPY ./dashboard_config.yml /home/dashboard_config.yml
RUN mkdir /home/done/
CMD cat /home/dashboard_config.yml | envsubst > /home/done/dashboard_config_env.yml