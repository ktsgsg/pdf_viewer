import json
import os
import re
import meilisearch
import time

# --- 設定項目 ---
# Dockerで設定したホストとマスターキーを入力してください
client = meilisearch.Client('http://localhost:7700', 'D4ZGfhyGuUFmw9im/ZQerUE327x/hhbEwFZiqWtT4glo0i7')
INDEX_NAME = 'ebooks'
DATA_DIR = './res'  # JSONファイルが格納されているディレクトリ

def get_safe_id(book_data, filename):
    """
    Meilisearchの制約に適合するIDを取得・生成する関数
    """
    # 1. content_idがあれば優先的に使用
    if 'content_id' in book_data:
        return str(book_data['content_id'])
    
    # 2. なければファイル名から英数字以外を除去して生成
    base_name = os.path.splitext(filename)[0]
    return re.sub(r'[^a-zA-Z0-9-_]', '_', base_name)

def setup_meilisearch():
    """
    検索精度を高めるためのインデックス設定
    """
    index = client.index(INDEX_NAME)
    
    # 検索対象とするフィールドの優先順位
    index.update_searchable_attributes([
        'title',
        'authors',
        'subject',
        'description',
        'table_of_contents.chapter'  # ネストされた目次も検索対象にする
    ])
    
    # 絞り込み（フィルタ）に使用するフィールド
    index.update_filterable_attributes([
        'genre',
        'publisher',
        'publication_date',
        'language'
    ])
    print("インデックスの設定を更新しました。")

BATCH_SIZE = 100  # 1回あたりの登録件数

def import_books():
    documents = []
    
    # ディレクトリ内のファイルを走査
    if not os.path.exists(DATA_DIR):
        print(f"エラー: ディレクトリ {DATA_DIR} が見つかりません。")
        return []

    # JSONファイル一覧を取得してソート（順序を一定にするため）
    json_files = sorted([f for f in os.listdir(DATA_DIR) if f.endswith('.json')])
    print(f"総ファイル数: {len(json_files)} 件")

    for filename in json_files:
        file_path = os.path.join(DATA_DIR, filename)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                book_data = json.load(f)
                
                # 重要：Meilisearch用のIDをセット
                book_data['id'] = get_safe_id(book_data, filename)
                print(f"{file_path}を読み込みました")
                documents.append(book_data)
            except Exception as e:
                print(f"スキップ ({filename}): {e}")

    if not documents:
        print("登録対象のデータが見つかりませんでした。")
        return []

    # 1. 念のため一度削除してクリーンな状態にする（エラー回避のため）
    try:
        print("既存インデックスを削除中...")
        client.index(INDEX_NAME).delete()
        time.sleep(1)
    except:
        pass

    # 2. インデックスを取得
    index = client.index(INDEX_NAME)
    
    # 3. バッチ処理で100件ずつ登録
    task_uids = []
    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(documents) + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"\nバッチ {batch_num}/{total_batches}: {len(batch)} 件を送信中...")
        
        # 登録時に primary_key='id' を明示！
        task = index.add_documents(batch, primary_key='id')
        task_uids.append(task.task_uid)
        
        print(f"  → タスクUID: {task.task_uid}")
        
        # バッチ間に少し待機（サーバー負荷軽減）
        if i + BATCH_SIZE < len(documents):
            time.sleep(0.5)
    
    print(f"\n送信完了: {len(documents)} 件のデータを {len(task_uids)} バッチで送信しました。")
    
    # 設定の反映
    setup_meilisearch()
    return task_uids
        
def check_task_status(task_uids):
    """
    指定されたタスクIDの状態を監視し、エラーがあれば詳細を表示する
    """
    if not task_uids:
        return
    
    if isinstance(task_uids, int):
        task_uids = [task_uids]
    
    print(f"\n{len(task_uids)} 件のタスクを確認中...")
    
    pending_tasks = set(task_uids)
    succeeded = 0
    failed = 0
    
    while pending_tasks:
        completed = []
        
        for task_uid in list(pending_tasks):
            task = client.get_task(task_uid)
            status = task.status
            
            if status == 'succeeded':
                completed.append(task_uid)
                succeeded += 1
            elif status == 'failed':
                completed.append(task_uid)
                failed += 1
                print(f"❌ タスク {task_uid} 失敗:")
                print(f"   エラーコード: {task.error['code']}")
                print(f"   エラー内容: {task.error['message']}")
        
        for uid in completed:
            pending_tasks.discard(uid)
        
        if pending_tasks:
            print(f"進行中: {len(pending_tasks)} 件残り... 3秒後に再確認します。")
            time.sleep(3)
    
    print(f"\n✅ 完了: 成功 {succeeded} 件, 失敗 {failed} 件")

if __name__ == "__main__":
    task_uids = import_books()
    check_task_status(task_uids)