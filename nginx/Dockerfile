FROM nginx:1.15

# removing default nginx config file
RUN rm /etc/nginx/conf.d/default.conf

# copying our nginx config
COPY --from=build-stage /client/addition_container_server.conf /etc/nginx/conf.d/

# copying production build from last stage to serve through nginx
COPY --from=build-stage /client/build/ /usr/share/nginx/html

# exposing port 8080 on container
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
