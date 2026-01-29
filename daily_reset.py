"""
每日重置脚本
北京时间 4:30 自动清空当日数据
"""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo
import os

import firebase_admin
from firebase_admin import credentials, firestore


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ACCOUNT_PATH = os.path.join(
    SCRIPT_DIR,
    "garden-c4155-firebase-adminsdk-fbsvc-29a614c5b3.json",
)

RESET_TIMEZONE = ZoneInfo("Asia/Shanghai")
RESET_HOUR = 4
RESET_MINUTE = 30


def _init_firestore():
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()


def _get_today_date_string(now: datetime) -> str:
    return now.strftime("%Y-%m-%d")


def _in_reset_window(now: datetime) -> bool:
    return now.hour == RESET_HOUR and RESET_MINUTE <= now.minute < 60


def check_and_reset_daily() -> dict:
    db = _init_firestore()
    now = datetime.now(RESET_TIMEZONE)
    today_date = _get_today_date_string(now)

    reset_ref = db.collection("system").document("reset")
    reset_doc = reset_ref.get()
    last_reset_date = reset_doc.to_dict().get("lastResetDate") if reset_doc.exists else None

    if last_reset_date == today_date:
        return {"success": True, "skipped": True, "reason": "already_reset"}

    if not _in_reset_window(now):
        return {"success": True, "skipped": True, "reason": "out_of_window"}

    users = ["user1", "user2"]
    for user_id in users:
        user_ref = db.collection("users").document(user_id)
        user_ref.update(
            {
                "currentPoints": 0,
                "lastSyncedWords": 0,
                "totalWordsToday": 0,
                "studyTimeToday": 0,
                "lastUpdated": now.isoformat(),
            }
        )

    coins_ref = db.collection("sharedAccount").document("coins")
    coins_ref.update(
        {
            "totalCoins": 0,
            "lastUpdated": now.isoformat(),
            "history": [
                {
                    "type": "reset",
                    "timestamp": now.isoformat(),
                    "description": "每日重置",
                }
            ],
        }
    )

    garden_ref = db.collection("garden").document("plots")
    garden_doc = garden_ref.get()
    max_plots = 54
    if garden_doc.exists:
        garden_data = garden_doc.to_dict()
        if isinstance(garden_data.get("grid"), list):
            max_plots = len(garden_data["grid"])

    empty_grid = [
        {
            "id": index,
            "flower": None,
            "flowerName": None,
            "plantedAt": None,
            "plantedBy": None,
        }
        for index in range(max_plots)
    ]

    garden_ref.update(
        {
            "occupiedPlots": 0,
            "grid": empty_grid,
            "lastUpdated": now.isoformat(),
        }
    )

    reset_ref.set(
        {
            "lastResetDate": today_date,
            "lastResetTime": now.isoformat(),
            "timezone": "Asia/Shanghai",
        }
    )

    return {"success": True, "resetTime": now.isoformat()}


if __name__ == "__main__":
    result = check_and_reset_daily()
    print(result)
