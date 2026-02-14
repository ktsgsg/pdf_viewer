FROM node:20-alpine

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm install

# ソースコードのコピー
COPY . .

# ビルド
RUN npm run build

# サムネイルデータディレクトリ
RUN mkdir -p /thumbnail_data

EXPOSE 3002

CMD ["npm", "start"]
