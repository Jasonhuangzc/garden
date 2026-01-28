import requests
import json
from typing import List, Dict, Optional


class BuBeiDanReader:
    """不背单词组队数据读取器"""
    
    def __init__(self, sid: str):
        """
        初始化读取器
        
        Args:
            sid: 用户的session ID
        """
        self.sid = sid
        self.base_url = "https://learnywhere.cn/api/bb/20/09/gstudy/inapp/index-data"
        
    def get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        return {
            'Host': 'learnywhere.cn',
            'Sec-Fetch-Site': 'same-origin',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cookie': '_bl_uid=72m2FiXnvhmepI0v4sgv0tmkvIRh',
            'Connection': 'keep-alive',
            'Sec-Fetch-Mode': 'cors',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'LangeasyLexis/5.9.17 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Sec-Fetch-Dest': 'empty',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9'
        }
    
    def fetch_data(self, season: int = 68, timezone: int = 480) -> Optional[Dict]:
        """
        获取组队数据
        
        Args:
            season: 赛季编号
            timezone: 时区偏移（分钟）
            
        Returns:
            API响应数据，失败返回None
        """
        params = {
            'sid': self.sid,
            'noti_auth': '1',
            'season': str(season),
            'timezone': str(timezone),
            'feat': 'float_group_day16',
            'refresh': '1'
        }
        
        try:
            print(f"🔗 请求URL: {self.base_url}")
            print(f"📋 参数: season={season}, timezone={timezone}")
            
            response = requests.get(
                self.base_url,
                params=params,
                headers=self.get_headers(),
                timeout=15,
                verify=True,  # SSL验证
                allow_redirects=True
            )
            
            print(f"📊 状态码: {response.status_code}")
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.SSLError as e:
            print(f"❌ SSL证书验证失败: {e}")
            print("💡 提示: 可能是网络环境问题，尝试关闭VPN或代理")
            return None
        except requests.exceptions.ConnectionError as e:
            print(f"❌ 连接失败: {e}")
            print("💡 提示: 请检查网络连接")
            return None
        except requests.exceptions.Timeout as e:
            print(f"❌ 请求超时: {e}")
            print("💡 提示: 网络响应慢，请稍后重试")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ 请求失败: {e}")
            print(f"💡 错误类型: {type(e).__name__}")
            return None
        except json.JSONDecodeError as e:
            print(f"❌ JSON解析失败: {e}")
            print(f"📄 响应内容预览: {response.text[:200]}...")
            return None
    
    def parse_member_data(self, data: Dict) -> List[Dict[str, any]]:
        """
        解析成员数据
        
        Args:
            data: API返回的完整数据
            
        Returns:
            成员信息列表，每个成员包含姓名、背单词数量、背单词时间
        """
        try:
            members_raw = data['data_body']['group']['members']
            members_info = []
            
            for member in members_raw:
                member_info = {
                    '姓名': member.get('nickname', '未知'),
                    '背单词数量': member.get('daka', {}).get('word', 0),
                    '背单词时间(分钟)': member.get('daka', {}).get('duration', 0),
                    '是否为本人': '是' if member.get('is_me', 0) == 1 else '否',
                    '打卡天数': member.get('day', 0)
                }
                members_info.append(member_info)
            
            return members_info
        except (KeyError, TypeError) as e:
            print(f"❌ 数据解析失败: {e}")
            return []
    
    def get_team_data(self) -> Optional[List[Dict[str, any]]]:
        """
        获取组队成员数据（主要接口）
        
        Returns:
            成员信息列表
        """
        print("📡 正在获取数据...")
        data = self.fetch_data()
        
        if not data:
            return None
        
        # 检查返回码
        if data.get('data_body', {}).get('code', -1) != 0:
            print(f"❌ API返回错误码: {data.get('data_body', {}).get('code')}")
            return None
        
        members = self.parse_member_data(data)
        return members
    
    def display_team_data(self):
        """显示组队数据（格式化输出）"""
        members = self.get_team_data()
        
        if not members:
            print("❌ 无法获取数据")
            return
        
        print("\n" + "="*60)
        print("📚 不背单词 - 组队学习数据")
        print("="*60)
        
        for i, member in enumerate(members, 1):
            print(f"\n👤 成员 {i}:")
            print(f"   姓名: {member['姓名']}")
            print(f"   背单词数量: {member['背单词数量']} 个")
            print(f"   背单词时间: {member['背单词时间(分钟)']} 分钟")
            print(f"   打卡天数: {member['打卡天数']} 天")
            print(f"   是否本人: {member['是否为本人']}")
        
        print("\n" + "="*60)


def main():
    """主函数 - 使用示例"""
    # 从抓包数据中提取的SID（需要URL解码后的完整sid）
    sid = "k0t5CNBsU5GDZc1N84CAyOgO7xgq03+uYbSc8xTOpCgPU5y/uRUw0Ui38ICaeC89p2Bo/LONDpihP6+v6X3T2KsbOTY5yrlfApuKYjiysYplM3a7mB4dhGL5q/wLptL7aMaH1gGZelkdNqYP/sdojTJL9qPtSfOSHQn/XH5ZDZedyP7CvUeuhzAlyPQPUEZ9ErSXmzaocEUsXa1zL9XvBXqhsJAIk20f358zKsMsmXR0wcx7H5kgagYj9ev2QAvkNGakVdVwOeB6ArKVo1WXW0h0fH3RTieWXxNAO4YRiCO6n1jD/fwujEMwrdFVDvQNrB2F8sjIQSEcy+7DTEC0Qg=="
    
    # 创建读取器实例
    reader = BuBeiDanReader(sid)
    
    # 显示组队数据
    reader.display_team_data()
    
    # 或者获取原始数据进行自定义处理
    # members = reader.get_team_data()
    # if members:
    #     print(json.dumps(members, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
