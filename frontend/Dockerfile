FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=8080
ENV API_URL=http://api:3000

EXPOSE 8080

CMD ["npm", "run", "dev"]
