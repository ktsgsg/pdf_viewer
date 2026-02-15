import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

// 環境変数からAPI URLを取得
const API_URL = process.env.API_URL || 'http://localhost:3000'

// 検索ページ
app.get('/', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PDF検索</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
        }
        .search-box {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        #search-input {
          flex: 1;
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s;
        }
        #search-input:focus {
          border-color: #007bff;
        }
        #search-btn {
          padding: 12px 24px;
          font-size: 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        #search-btn:hover {
          background: #0056b3;
        }
        #search-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .stats {
          color: #666;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .results {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .result-item {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s;
        }
        .result-item:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .result-title {
          font-size: 18px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 8px;
        }
        .result-title a {
          color: inherit;
          text-decoration: none;
        }
        .result-title a:hover {
          text-decoration: underline;
        }
        .result-meta {
          font-size: 13px;
          color: #666;
          margin-bottom: 10px;
        }
        .result-meta span {
          margin-right: 15px;
        }
        .result-description {
          color: #444;
          line-height: 1.6;
          font-size: 14px;
        }
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        .error {
          background: #fee;
          color: #c00;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .no-results {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        .pagination {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
        .pagination button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }
        .pagination button:hover:not(:disabled) {
          background: #f0f0f0;
        }
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .thumbnail {
          width: 80px;
          height: 100px;
          object-fit: cover;
          border-radius: 4px;
          margin-right: 15px;
          float: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📚 PDF検索</h1>
        
        <div class="search-box">
          <input 
            type="text" 
            id="search-input" 
            placeholder="キーワードを入力..." 
            autocomplete="off"
          >
          <button id="search-btn">検索</button>
        </div>
        
        <div id="stats" class="stats"></div>
        <div id="results" class="results"></div>
        <div id="pagination" class="pagination"></div>
      </div>

      <script>
        const LIMIT = 20;
        let currentOffset = 0;
        let currentQuery = '';
        let totalHits = 0;

        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const resultsDiv = document.getElementById('results');
        const statsDiv = document.getElementById('stats');
        const paginationDiv = document.getElementById('pagination');

        // 検索実行
        async function search(query, offset = 0) {
          if (!query.trim()) {
            resultsDiv.innerHTML = '';
            statsDiv.innerHTML = '';
            paginationDiv.innerHTML = '';
            return;
          }

          currentQuery = query;
          currentOffset = offset;
          
          searchBtn.disabled = true;
          resultsDiv.innerHTML = '<div class="loading">検索中...</div>';
          statsDiv.innerHTML = '';
          paginationDiv.innerHTML = '';

          try {
            const params = new URLSearchParams({
              q: query,
              limit: LIMIT.toString(),
              offset: offset.toString()
            });
            
            const response = await fetch('/api/search?' + params);
            
            if (!response.ok) {
              throw new Error('検索に失敗しました');
            }
            
            const data = await response.json();
            totalHits = data.estimatedTotalHits || data.hits.length;
            
            displayResults(data);
            displayStats(data, offset);
            displayPagination(offset, totalHits);
          } catch (error) {
            resultsDiv.innerHTML = '<div class="error">' + error.message + '</div>';
          } finally {
            searchBtn.disabled = false;
          }
        }

        // 結果表示
        function displayResults(data) {
          if (!data.hits || data.hits.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">検索結果がありません</div>';
            return;
          }

          resultsDiv.innerHTML = data.hits.map(hit => {
            const title = hit.title || 'タイトルなし';
            const authors = hit.authors ? (Array.isArray(hit.authors) ? hit.authors.join(', ') : hit.authors) : '';
            const publisher = hit.publisher || '';
            const description = hit.description || hit.subject || '';
            const contentId = hit.content_id || hit.id;
            const thumbnailUrl = hit.thumbnail_url || '';
            
            let meta = '';
            if (authors) meta += '<span>👤 ' + escapeHtml(authors) + '</span>';
            if (publisher) meta += '<span>📖 ' + escapeHtml(publisher) + '</span>';
            
            let thumbnail = '';
            if (thumbnailUrl) {
              thumbnail = '<img src="' + escapeHtml(thumbnailUrl) + '" alt="" class="thumbnail" onerror="this.style.display=\\'none\\'">';
            }
            
            return '<div class="result-item">' +
              thumbnail +
              '<div class="result-title">' + escapeHtml(title) + '</div>' +
              (meta ? '<div class="result-meta">' + meta + '</div>' : '') +
              (description ? '<div class="result-description">' + escapeHtml(description.substring(0, 300)) + (description.length > 300 ? '...' : '') + '</div>' : '') +
              '<div style="clear:both"></div>' +
            '</div>';
          }).join('');
        }

        // 統計表示
        function displayStats(data, offset) {
          const total = data.estimatedTotalHits || data.hits.length;
          const time = data.processingTimeMs || 0;
          const start = offset + 1;
          const end = Math.min(offset + data.hits.length, total);
          
          statsDiv.innerHTML = total + '件中 ' + start + '〜' + end + '件を表示 (' + time + 'ms)';
        }

        // ページネーション
        function displayPagination(offset, total) {
          if (total <= LIMIT) {
            paginationDiv.innerHTML = '';
            return;
          }

          const prevDisabled = offset === 0;
          const nextDisabled = offset + LIMIT >= total;
          
          paginationDiv.innerHTML = 
            '<button ' + (prevDisabled ? 'disabled' : '') + ' onclick="search(currentQuery, ' + Math.max(0, offset - LIMIT) + ')">← 前へ</button>' +
            '<button ' + (nextDisabled ? 'disabled' : '') + ' onclick="search(currentQuery, ' + (offset + LIMIT) + ')">次へ →</button>';
        }

        // HTMLエスケープ
        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }

        // イベントリスナー
        searchBtn.addEventListener('click', () => search(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') search(searchInput.value);
        });

        // フォーカス
        searchInput.focus();
      </script>
    </body>
    </html>
  `)
})

// APIプロキシ（CORSを回避する場合用）
app.get('/api/search', async (c) => {
  const query = c.req.query('q') || ''
  const limit = c.req.query('limit') || '20'
  const offset = c.req.query('offset') || '0'

  try {
    const params = new URLSearchParams({ q: query, limit, offset })
    const response = await fetch(`${API_URL}/search?${params}`)
    const data = await response.json()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Search failed' }, 500)
  }
})

const port = parseInt(process.env.PORT || '8080', 10)

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Frontend server is running on http://localhost:${info.port}`)
  console.log(`API URL: ${API_URL}`)
})
