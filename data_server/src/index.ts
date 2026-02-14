import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as fs from 'node:fs'
import * as path from 'node:path'

const app = new Hono()

// CORS設定
app.use('/*', cors())

// PDFファイルの保存ディレクトリ
const PDF_DIR = process.env.PDF_DIR || './pdf_data'

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'PDF Data Server' })
})

// PDFファイルを取得 (GET /:id)
app.get('/:id', async (c) => {
  const id = c.req.param('id')

  // IDのバリデーション（セキュリティ対策：パストラバーサル防止）
  if (!id || !/^[\w-]+$/.test(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  const pdfPath = path.join(PDF_DIR, `${id}.pdf`)

  try {
    // ファイルの存在確認
    if (!fs.existsSync(pdfPath)) {
      return c.json({ error: 'PDF not found' }, 404)
    }

    // PDFファイルを読み込み
    const pdfBuffer = fs.readFileSync(pdfPath)

    // レスポンスヘッダーを設定してPDFを返す
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error reading PDF:', error)
    return c.json({ error: 'Failed to read PDF' }, 500)
  }
})

const port = parseInt(process.env.PORT || '3001', 10)

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`PDF Data Server is running on http://localhost:${info.port}`)
})
