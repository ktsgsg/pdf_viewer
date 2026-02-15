# Frontend

Honoを使用したPDF検索UI

## 環境変数

| 変数名    | 説明                 | デフォルト              |
| --------- | -------------------- | ----------------------- |
| `PORT`    | サーバーのポート番号 | `8080`                  |
| `API_URL` | APIサーバーのURL     | `http://localhost:3000` |

## 起動方法

```bash
npm install
npm run dev
```

環境変数を指定して起動:
```bash
API_URL=http://localhost:3000 PORT=8080 npm run dev
```

## アクセス

```
open http://localhost:8080
```

