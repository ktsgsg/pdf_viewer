# PDF Search API

Meilisearchの検索機能をフロントエンドに提供する読み取り専用のAPIサーバーです。

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

| 変数名             | 説明                      | デフォルト値              |
| ------------------ | ------------------------- | ------------------------- |
| `MEILISEARCH_HOST` | MeilisearchのホストURL    | `http://meilisearch:7700` |
| `MEILISEARCH_PSW`  | Meilisearchのマスターキー | (空)                      |
| `PORT`             | APIサーバーのポート       | `3000`                    |

## エンドポイント

### ヘルスチェック

```
GET /
```

**レスポンス例:**
```json
{
  "status": "ok",
  "message": "PDF Search API"
}
```

---

### 検索（GET）

シンプルな検索クエリ用。

```
GET /search?q=検索語&index=インデックス名&limit=20&offset=0
```

**パラメータ:**

| パラメータ | 必須   | 説明           | デフォルト |
| ---------- | ------ | -------------- | ---------- |
| `q`        | いいえ | 検索クエリ     | (空文字)   |
| `index`    | いいえ | インデックス名 | `ebooks`   |
| `limit`    | いいえ | 取得件数       | `20`       |
| `offset`   | いいえ | オフセット     | `0`        |

**リクエスト例:**
```bash
curl "http://localhost:3000/search?q=JavaScript&index=ebooks&limit=10"
```

**レスポンス例:**
```json
{
  "hits": [
    {
      "id": "1",
      "title": "JavaScript入門",
      "content": "..."
    }
  ],
  "query": "JavaScript",
  "processingTimeMs": 2,
  "limit": 10,
  "offset": 0,
  "estimatedTotalHits": 42
}
```

---

### 検索（POST）

詳細な検索オプションを指定する場合に使用。

```
POST /search
Content-Type: application/json
```

**リクエストボディ:**

| フィールド              | 必須   | 説明               | デフォルト |
| ----------------------- | ------ | ------------------ | ---------- |
| `query`                 | いいえ | 検索クエリ         | (空文字)   |
| `index`                 | いいえ | インデックス名     | `ebooks`   |
| `limit`                 | いいえ | 取得件数           | `20`       |
| `offset`                | いいえ | オフセット         | `0`        |
| `filter`                | いいえ | フィルター条件     | -          |
| `sort`                  | いいえ | ソート条件         | -          |
| `attributesToRetrieve`  | いいえ | 取得する属性       | -          |
| `attributesToHighlight` | いいえ | ハイライトする属性 | -          |

**リクエスト例:**
```bash
curl -X POST "http://localhost:3000/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "JavaScript",
    "index": "ebooks",
    "limit": 10,
    "filter": "category = \"programming\"",
    "attributesToHighlight": ["title", "content"]
  }'
```

---

### インデックス一覧

利用可能なインデックスの一覧を取得します。

```
GET /indexes
```

**レスポンス例:**
```json
{
  "indexes": [
    {
      "uid": "ebooks",
      "primaryKey": "id"
    }
  ]
}
```

## エラーレスポンス

エラー発生時は以下の形式で返却されます。

```json
{
  "error": "Search failed"
}
```

## セキュリティ

このAPIは**読み取り専用**です。以下の操作はサポートしていません：

- ドキュメントの追加・更新・削除
- インデックスの作成・削除
- 設定の変更

これにより、フロントエンドからMeilisearchのマスターキーを公開することなく、安全に検索機能を提供できます。
