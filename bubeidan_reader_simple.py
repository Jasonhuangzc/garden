import requests
import json
import os
from typing import List, Dict, Optional


class BuBeiDanReader:
    """不背单词组队数据读取器 - 简化版（禁用代理）"""
    
    # 用户映射配置
    USER_MAPPING = {
        "ida#": {
            "user_id": "user1",
            "gender": "female",
            "avatar": "image/avatar_ida.jpg"
        },
        "背够2w个": {
            "user_id": "user2",
            "gender": "male",
            "avatar": "image/avatar_beigou2w.jpg"
        }
    }
    
    def __init__(self, sid: str):
        self.sid = sid
        self.base_url = "https://learnywhere.cn/api/bb/20/09/gstudy/inapp/index-data"
        
    def get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            'Host': 'learnywhere.cn',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'LangeasyLexis/5.9.17 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9'
        }
    
    def fetch_data(self, season: int = 68, timezone: int = 480) -> Optional[Dict]:
        """获取组队数据"""
        params = {
            'sid': self.sid,
            'noti_auth': '1',
            'season': str(season),
            'timezone': str(timezone),
            'feat': 'float_group_day16',
            'refresh': '1'
        }
        
        # 显式禁用代理
        session = requests.Session()
        session.trust_env = False  # 忽略系统代理设置
        
        try:
            print(f"[Connect] 正在连接API...")
            
            response = session.get(
                self.base_url,
                params=params,
                headers=self.get_headers(),
                timeout=15,
                proxies={'http': None, 'https': None},  # 显式禁用代理
                verify=True
            )
            
            print(f"[OK] 连接成功! 状态码: {response.status_code}")
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            print(f"[ERR] 请求失败: {type(e).__name__}")
            print(f"   详细信息: {str(e)[:100]}")
            return None
        finally:
            session.close()
    
    def parse_member_data(self, data: Dict) -> List[Dict[str, any]]:
        """解析成员数据"""
        try:
            members_raw = data['data_body']['group']['members']
            members_info = []
            
            for member in members_raw:
                nickname = member.get('nickname', '未知')
                
                # 获取用户映射信息
                user_info = self.USER_MAPPING.get(nickname, {
                    "user_id": "unknown",
                    "gender": "unknown",
                    "avatar": "image/default_avatar.jpg"
                })
                
                member_info = {
                    'user_id': user_info['user_id'],
                    '姓名': nickname,
                    'avatar': user_info['avatar'],
                    'gender': user_info['gender'],
                    '背单词数量': member.get('daka', {}).get('word', 0),
                    '背单词时间(分钟)': member.get('daka', {}).get('duration', 0),
                    '是否为本人': '是' if member.get('is_me', 0) == 1 else '否',
                    '打卡天数': member.get('day', 0)
                }
                members_info.append(member_info)
            
            return members_info
        except Exception as e:
            print(f"[ERR] 数据解析失败: {e}")
            return []
    
    def get_team_data(self) -> Optional[List[Dict[str, any]]]:
        """获取组队成员数据"""
        print("[API] 正在获取数据...")
        data = self.fetch_data()
        
        if not data:
            return None
        
        if data.get('data_body', {}).get('code', -1) != 0:
            print(f"[ERR] API返回错误码: {data.get('data_body', {}).get('code')}")
            return None
        
        members = self.parse_member_data(data)
        return members
    
    def display_team_data(self):
        """显示组队数据"""
        members = self.get_team_data()
        
        if not members:
            print("\n[ERR] 无法获取数据")
            print("[Tip] 可能的原因:")
            print("   1. SID已过期，需要重新抓取")
            print("   2. 网络连接问题")
            print("   3. API地址变更")
            return
        
        print("\n" + "="*60)
        print("[Data] 不背单词 - 组队学习数据")
        print("="*60)
        
        for i, member in enumerate(members, 1):
            print(f"\n[User] 成员 {i}:")
            print(f"   姓名: {member['姓名']}")
            print(f"   背单词数量: {member['背单词数量']} 个")
            print(f"   背单词时间: {member['背单词时间(分钟)']} 分钟")
            print(f"   打卡天数: {member['打卡天数']} 天")
            print(f"   是否本人: {member['是否为本人']}")
        
        print("\n" + "="*60)


def main():
    """主函数"""
    # 从抓包数据中提取的SID
    sid = "k0t5CNBsU5GDZc1N84CAyOgO7xgq03+uYbSc8xTOpCgPU5y/uRUw0Ui38ICaeC89p2Bo/LONDpihP6+v6X3T2KsbOTY5yrlfApuKYjiysYplM3a7mB4dhGL5q/wLptL7aMaH1gGZelkdNqYP/sdojTJL9qPtSfOSHQn/XH5ZDZedyP7CvUeuhzAlyPQPUEZ9ErSXmzaocEUsXa1zL9XvBXqhsJAIk20f358zKsMsmXR0wcx7H5kgagYj9ev2QAvkNGakVdVwOeB6ArKVo1WXW0h0fH3RTieWXxNAO4YRiCO6n1jD/fwujEMwrdFVDvQNrB2F8sjIQSEcy+7DTEC0Qg=="
    
    reader = BuBeiDanReader(sid)
    reader.display_team_data()


if __name__ == "__main__":
    main()
