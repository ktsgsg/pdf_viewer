import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as fs from 'node:fs'
import * as path from 'node:path'

const app = new Hono()

// CORS設定
app.use('/*', cors())

// thumbnailファイルの保存ディレクトリ
const thumbnail_DIR = process.env.thumbnail_DIR || './thumbnail_data'

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Thumbnail Data Server' })
})

// thumbnailファイルを取得 (GET /:id)
app.get('/:id', async (c) => {
  const id = c.req.param('id')

  // IDのバリデーション（セキュリティ対策：パストラバーサル防止）
  if (!id || !/^[\w-]+$/.test(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  const thumbnailPath = path.join(thumbnail_DIR, `${id}.png`)

  try {
    // ファイルの存在確認
    if (!fs.existsSync(thumbnailPath)) {
      return c.json({ error: 'thumbnail not found' }, 404)
    }

    // thumbnailファイルを読み込み
    const thumbnailBuffer = fs.readFileSync(thumbnailPath)

    // レスポンスヘッダーを設定してthumbnailを返す
    return new Response(thumbnailBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${id}.png"`,
        'Content-Length': thumbnailBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error reading thumbnail:', error)
    return c.json({ error: 'Failed to read thumbnail' }, 500)
  }
})

const port = parseInt(process.env.PORT || '3002', 10)

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`thumbnail Data Server is running on http://localhost:${info.port}`)
})
