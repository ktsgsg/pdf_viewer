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

def import_books():
    documents = []
    
    # ディレクトリ内のファイルを走査
    if not os.path.exists(DATA_DIR):
        print(f"エラー: ディレクトリ {DATA_DIR} が見つかりません。")
        return

    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
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

    if documents:
        # 1. 念のため一度削除してクリーンな状態にする（エラー回避のため）
        try:
            client.index(INDEX_NAME).delete()
        except:
            pass

        # 2. インデックスを取得
        index = client.index(INDEX_NAME)
        
        # 3. 登録時に primary_key='id' を明示！
        task = index.add_documents(documents, primary_key='id')
        
        print(f"送信完了: {len(documents)} 件のデータを送信しました。")
        print(f"タスクUID: {task.task_uid}")
        
        # 設定の反映
        setup_meilisearch()
        return task.task_uid
    else:
        print("登録対象のデータが見つかりませんでした。")
        
def check_task_status(task_uid):
    """
    指定されたタスクIDの状態を監視し、エラーがあれば詳細を表示する
    """
    print(f"タスク {task_uid} の状態を確認中...")
    
    while True:
        # タスク情報の取得
        task = client.get_task(task_uid)
        status = task.status  # 'enqueued', 'processing', 'succeeded', 'failed'
        
        if status == 'succeeded':
            print("✅ 成功: データは正常にインデックスされました！")
            break
        elif status == 'failed':
            print("❌ 失敗: エラーが発生しました。")
            print(f"エラーコード: {task.error['code']}")
            print(f"エラー内容: {task.error['message']}")
            print(f"エラー詳細リンク: {task.error['link']}")
            break
        else:
            print(f"現在のステータス: {status}... 3秒後に再確認します。")
            time.sleep(3)

if __name__ == "__main__":
    uid = import_books()
    check_task_status(uid)