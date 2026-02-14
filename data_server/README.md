# PDF Data Server

IDを指定してPDFファイルを取得するためのサーバーです。

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

| 変数名    | 説明                | デフォルト値 |
| --------- | ------------------- | ------------ |
| `PDF_DIR` | PDFファイルの保存先 | `./pdf_data` |
| `PORT`    | サーバーのポート    | `3001`       |

## PDFファイルの配置

PDFファイルは`pdf_data`ディレクトリ（環境変数`PDF_DIR`で変更可能）に配置します。

ファイル名は`{id}.pdf`の形式にしてください。

```
pdf_data/
├── 3000000149.pdf
├── 3000000150.pdf
└── 3000032970.pdf
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
  "message": "PDF Data Server"
}
```

---

### PDF取得

```
GET /:id
```

**パラメータ:**

| パラメータ | 説明                                            |
| ---------- | ----------------------------------------------- |
| `id`       | PDFのID（英数字、ハイフン、アンダースコアのみ） |

**リクエスト例:**
```bash
curl "http://localhost:3001/3000000149" --output document.pdf
```

**成功時:**
- `Content-Type: application/pdf`
- PDFファイルのバイナリデータ

**エラー時:**

| ステータス | 説明              |
| ---------- | ----------------- |
| 400        | 不正なID形式      |
| 404        | PDFが見つからない |
| 500        | サーバーエラー    |

## 使用例（フロントエンド）

```javascript
// APIで検索してIDを取得
const searchResults = await fetch('http://localhost:3000/search?q=JavaScript').then(r => r.json());

// 取得したIDでPDFを表示
const pdfId = searchResults.hits[0].id;
const pdfUrl = `http://localhost:3001/${pdfId}`;

// PDF.jsなどで表示
window.open(pdfUrl);
```
