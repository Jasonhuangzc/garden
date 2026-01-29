"""
获取当前数据并写入 Firestore 数据库
安全版本：数据直接写入数据库，前端无法篡改
"""
import firebase_admin
from firebase_admin import credentials, firestore
from bubeidan_reader_simple import BuBeiDanReader
import json
from datetime import datetime
import os

# 初始化 Firebase Admin SDK
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_PATH = os.path.join(SCRIPT_DIR, "garden-c4155-firebase-adminsdk-fbsvc-29a614c5b3.json")

# 确保只初始化一次
if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()


def update_user_in_firestore(user_id: str, words_count: int, study_time: int, check_in_days: int):
    """
    更新用户的单词数据到 Firestore
    这是唯一的数据入口，前端无法伪造
    """
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        print(f"[WARN] User {user_id} not found in Firestore, skipping...")
        return False
    
    current_data = user_doc.to_dict()
    old_words = current_data.get('lastSyncedWords', 0)
    new_words = words_count - old_words
    
    # 计算新增积分（每10个单词=10积分）
    # 注意：这里只更新原始数据，积分计算逻辑保持在前端收取时
    current_points = current_data.get('currentPoints', 0)
    
    # 如果有新增单词，计算新增积分
    points_to_add = 0
    if new_words > 0:
        points_to_add = (new_words // 10) * 10
    
    update_data = {
        'totalWordsToday': words_count,
        'studyTimeToday': study_time,
        'checkInDays': check_in_days,
        'currentPoints': current_points + points_to_add,
        'lastUpdated': datetime.now().isoformat(),
        'lastSyncSource': 'backend_api'  # 标记数据来源
    }
    
    user_ref.update(update_data)
    
    if points_to_add > 0:
        print(f"[OK] {user_id}: {words_count} words (+{new_words}), +{points_to_add} points")
    else:
        print(f"[OK] {user_id}: {words_count} words (no change)")
    
    return True


def fetch_and_sync():
    sid = os.getenv(
        "BUBEIDAN_SID",
        "k0t5CNBsU5GDZc1N84CAyOgO7xgq03+uYbSc8xTOpCgPU5y/uRUw0Ui38ICaeC89p2Bo/LONDpihP6+v6X3T2KsbOTY5yrlfApuKYjiysYplM3a7mB4dhGL5q/wLptL7aMaH1gGZelkdNqYP/sdojTJL9qPtSfOSHQn/XH5ZDZedyP7CvUeuhzAlyPQPUEZ9ErSXmzaocEUsXa1zL9XvBXqhsJAIk20f358zKsMsmXR0wcx7H5kgagYj9ev2QAvkNGakVdVwOeB6ArKVo1WXW0h0fH3RTieWXxNAO4YRiCO6n1jD/fwujEMwrdFVDvQNrB2F8sjIQSEcy+7DTEC0Qg=="
    )
    cookie = os.getenv("BUBEIDAN_COOKIE")

    reader = BuBeiDanReader(sid, cookie=cookie)

    print("[API] Fetching word data...")
    members = reader.get_team_data()

    if not members:
        print("[ERR] Failed to fetch data")
        return False

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[Time] {timestamp}")

    for member in members:
        user_id = member.get('user_id', 'unknown')
        words_count = member.get('背单词数量', 0)
        study_time = member.get('背单词时间(分钟)', 0)
        check_in_days = member.get('打卡天数', 0)

        update_user_in_firestore(user_id, words_count, study_time, check_in_days)

    output_data = {
        "timestamp": timestamp,
        "members": members,
        "source": "backend_api"
    }

    with open(os.path.join(SCRIPT_DIR, 'current_team_data.json'), 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print("[OK] Data synced to Firestore successfully!")
    print("="*50)
    return True


def main():
    fetch_and_sync()


if __name__ == "__main__":
    main()
