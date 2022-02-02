FROM nginx:1.15

# removing default nginx config file
RUN rm /etc/nginx/conf.d/default.conf

# copying our nginx config
COPY --from=build-stage /nginx/nginx.conf /etc/nginx/conf.d/

# copying production build from last stage to serve through nginx
COPY --from=build-stage /client/build/ /usr/share/nginx/html

# exposing port 8080 on container
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
