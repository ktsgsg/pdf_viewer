import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { MeiliSearch } from 'meilisearch'

const app = new Hono()

// CORS設定（フロントエンドからのアクセスを許可）
app.use('/*', cors())

// Meilisearchクライアントの初期化
const meiliClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://meilisearch:7700',
  apiKey: process.env.MEILISEARCH_PSW || '',
})

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'PDF Search API' })
})

// 検索エンドポイント（検索のみ許可）
app.get('/search', async (c) => {
  const query = c.req.query('q') || ''
  const indexName = c.req.query('index') || 'ebooks'
  const limit = parseInt(c.req.query('limit') || '20', 10)
  const offset = parseInt(c.req.query('offset') || '0', 10)

  try {
    const index = meiliClient.index(indexName)
    const results = await index.search(query, {
      limit,
      offset,
    })
    return c.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ error: 'Search failed' }, 500)
  }
})

// POST版の検索エンドポイント（より詳細な検索オプション用）
app.post('/search', async (c) => {
  try {
    const body = await c.req.json()
    const { query = '', index: indexName = 'ebooks', limit = 20, offset = 0, filter, sort, attributesToRetrieve, attributesToHighlight } = body

    const index = meiliClient.index(indexName)
    const results = await index.search(query, {
      limit,
      offset,
      filter,
      sort,
      attributesToRetrieve,
      attributesToHighlight,
    })
    return c.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return c.json({ error: 'Search failed' }, 500)
  }
})

// 利用可能なインデックス一覧を取得（読み取り専用）
app.get('/indexes', async (c) => {
  try {
    const indexes = await meiliClient.getIndexes()
    // インデックス名と基本情報のみ返す（セキュリティのため）
    const safeIndexes = indexes.results.map((idx) => ({
      uid: idx.uid,
      primaryKey: idx.primaryKey,
    }))
    return c.json({ indexes: safeIndexes })
  } catch (error) {
    console.error('Get indexes error:', error)
    return c.json({ error: 'Failed to get indexes' }, 500)
  }
})

const port = parseInt(process.env.PORT || '3000', 10)

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
