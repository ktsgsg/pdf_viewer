# Thumbnail Data Server

IDを指定してサムネイル画像（PNG）を取得するためのサーバーです。

## セットアップ

### ローカル開発

```bash
npm install
npm run dev
```

### Docker

```bash
docker compose up -d --build
```

## 環境変数

| 変数名          | 説明                       | デフォルト値       |
| --------------- | -------------------------- | ------------------ |
| `thumbnail_DIR` | サムネイルファイルの保存先 | `./thumbnail_data` |
| `PORT`          | サーバーのポート           | `3002`             |

## サムネイルファイルの配置

サムネイルファイルは`thumbnail_data`ディレクトリ（環境変数`thumbnail_DIR`で変更可能）に配置します。

ファイル名は`{id}.png`の形式にしてください。

```
thumbnail_data/
├── 3000000149.png
├── 3000000150.png
└── 3000032970.png
```

## エンドポイント

### ヘルスチェック

```
GET /
```

**レスポンス例:**
```json
{
  "status": "ok",
  "message": "Thumbnail Data Server"
}
```

---

### サムネイル取得

```
GET /:id
```

**パラメータ:**

| パラメータ | 説明                                                   |
| ---------- | ------------------------------------------------------ |
| `id`       | サムネイルのID（英数字、ハイフン、アンダースコアのみ） |

**リクエスト例:**
```bash
curl "http://localhost:3002/3000000149" --output thumbnail.png
```

**成功時:**
- `Content-Type: image/png`
- サムネイル画像のバイナリデータ

**エラー時:**

| ステータス | 説明                     |
| ---------- | ------------------------ |
| 400        | 不正なID形式             |
| 404        | サムネイルが見つからない |
| 500        | サーバーエラー           |

## 使用例（フロントエンド）

```javascript
// APIで検索してIDを取得
const searchResults = await fetch('http://localhost:3000/search?q=JavaScript').then(r => r.json());

// 取得したIDでサムネイルを表示
const docId = searchResults.hits[0].id;
const thumbnailUrl = `http://localhost:3002/${docId}`;

// 画像として表示
const img = document.createElement('img');
img.src = thumbnailUrl;
document.body.appendChild(img);
```
