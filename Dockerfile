FROM python:3.10.12-slim

WORKDIR /app

COPY . .

RUN apt update
RUN apt install -y wget xz-utils

RUN wget https://nodejs.org/dist/v18.16.0/node-v18.16.0-linux-x64.tar.xz
RUN mkdir -p /usr/local/lib/nodejs && mv /app/node-v18.16.0-linux-x64.tar.xz /app/chat/
RUN tar -xf /app/chat/node-v18.16.0-linux-x64.tar.xz -C /usr/local/lib/nodejs

ENV NODEJS_HOME=/usr/local/lib/nodejs/node-v18.16.0-linux-x64
ENV PATH=$NODEJS_HOME/bin:$PATH

WORKDIR /app/chat

RUN npm install && npm run build

RUN mkdir /app/chat_ui && cp -r /app/chat/build/* /app/chat_ui

RUN rm -rf /app/chat && rm -rf /usr/local/lib/nodejs/node-v18.16.0-linux-x64 && rm -rf ~/.npm

RUN apt remove -y wget xz-utils
RUN apt clean
RUN apt autoclean
RUN apt autoremove -y

WORKDIR /app

RUN pip install --no-cache-dir --upgrade -r requirements.txt

RUN chmod +x main.sh
CMD ["/app/main.sh"]
