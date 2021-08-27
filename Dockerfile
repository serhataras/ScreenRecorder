ARG REPO_IP=REPO_IP
FROM ${REPO_IP}/nginx:1.17.8-alpine
ARG SERVICE_VERSION
LABEL version="${SERVICE_VERSION}"
COPY ./discovery/discover.json /etc/nginx/discover.json
COPY ./nginx-test.conf /etc/nginx/nginx.conf
COPY ./dist/ /etc/nginx/html/
WORKDIR /etc/nginx
EXPOSE 80
EXPOSE 443
EXPOSE 9099
RUN nginx
