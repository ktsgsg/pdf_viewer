# Basic認証 追加マニュアル（pdf_viewer）

## 1. 対象構成の確認
- Nginx設定: `nginx/nginx.conf`
- file_server定義: `compose.yml`

現状は以下の2つの HTTPS サーバーブロックがあります。
- API: `server_name api.tierin.f5.si;`
- Storage: `server_name storage.tierin.f5.si;`

## 2. 認証ユーザー作成（.htpasswd）
プロジェクトルートで実行します。

```bash
USER_NAME=viewer
USER_PASS='強いパスワードに変更'
HASH=$(openssl passwd -apr1 "$USER_PASS")
printf "%s:%s\n" "$USER_NAME" "$HASH" > nginx/.htpasswd
chmod 600 nginx/.htpasswd
```

確認:

```bash
cat nginx/.htpasswd
```

## 3. compose.yml に .htpasswd マウントを追加
`compose.yml` の `file_server` の `volumes` に1行追加します。

追加内容:

```yaml
- ./nginx/.htpasswd:/etc/nginx/.htpasswd:ro
```

例（`file_server` の `volumes`）:

```yaml
volumes:
  - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - ./nginx/origin.pem:/etc/nginx/certs/origin.pem:ro
  - ./nginx/origin-key.pem:/etc/nginx/certs/origin-key.pem:ro
  - ./nginx/.htpasswd:/etc/nginx/.htpasswd:ro
  - /mnt/sde1/storage:/data:ro
```

## 4. nginx.conf に Basic認証設定を追加
### 4-1. APIサーバーに認証を付ける
`server_name api.tierin.f5.si;` のサーバーブロックに以下を追加:

```nginx
auth_basic "Restricted";
auth_basic_user_file /etc/nginx/.htpasswd;
```

ヘルスチェックだけ認証除外する場合は `location /health` 内に追加:

```nginx
auth_basic off;
```

### 4-2. Storageサーバーに認証を付ける
`server_name storage.tierin.f5.si;` のサーバーブロックに以下を追加:

```nginx
auth_basic "Restricted";
auth_basic_user_file /etc/nginx/.htpasswd;
```

ヘルスチェック除外する場合は `location /health` 内に追加:

```nginx
auth_basic off;
```

## 5. 反映
設定反映のため再作成します。

```bash
docker compose up -d --build file_server
```

文法チェック:

```bash
docker compose exec file_server nginx -t
```

## 6. 動作確認
認証なし（401 になることを確認）:

```bash
curl -I https://api.tierin.f5.si/
curl -I https://storage.tierin.f5.si/
```

認証あり（200 になることを確認）:

```bash
curl -I -u viewer:'強いパスワードに変更' https://api.tierin.f5.si/
curl -I -u viewer:'強いパスワードに変更' https://storage.tierin.f5.si/
```

## 7. 運用メモ
- ユーザー追加は `nginx/.htpasswd` に行を追記します。
- パスワード更新時は `nginx/.htpasswd` を更新して `file_server` を再起動します。
- APIのみ保護したい場合は APIブロックだけ、Storageのみ保護したい場合は Storageブロックだけに `auth_basic` を入れてください。
