FROM node:20-alpine

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm install

# ソースコードのコピー
COPY . .

# ビルド
RUN npm run build

# PDFデータディレクトリ
RUN mkdir -p /pdf_data

EXPOSE 3001

CMD ["npm", "start"]
