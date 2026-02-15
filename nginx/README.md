# File Server (nginx)

PDF・サムネイルファイルを配信するnginxベースのファイルサーバーです。

## エンドポイント

| パス                  | 説明                         |
| --------------------- | ---------------------------- |
| `/pdf/{id}.pdf`       | PDFファイル取得              |
| `/thumbnail/{id}.png` | サムネイル画像取得           |
| `/pdf/`               | PDFファイル一覧（autoindex） |
| `/thumbnail/`         | サムネイル一覧（autoindex）  |
| `/files/`             | 全ファイル一覧（統合ビュー） |
| `/health`             | ヘルスチェック               |

## 使用例

```bash
# PDFを取得
curl "http://localhost:8080/pdf/3000000149.pdf" --output document.pdf

# サムネイルを取得
curl "http://localhost:8080/thumbnail/3000000149.png" --output thumb.png

# ファイル一覧を確認
curl "http://localhost:8080/pdf/"
curl "http://localhost:8080/files/"  # 統合ビュー
```

## ファイル配置

PDFとサムネイルは `file_data/` フォルダで一元管理されています。

```
file_data/
├── pdf/
│   ├── 3000000149.pdf
│   └── 3000000150.pdf
└── thumbnail/
    ├── 3000000149.png
    └── 3000000150.png
```

## フロントエンドからの使用例

```javascript
const pdfUrl = `http://localhost:8080/pdf/${id}.pdf`;
const thumbnailUrl = `http://localhost:8080/thumbnail/${id}.png`;
```
