"""
不背单词数据读取器 - 测试示例
使用提供的抓包响应数据进行本地测试
"""

import json
from bubeidan_reader import BuBeiDanReader


# 模拟API响应数据（从你提供的抓包数据中提取）
MOCK_RESPONSE = {
    "data_body": {
        "code": 0,
        "common": {
            "nickname": "背够2w个",
            "avatar": "/AvatarImage/iscool/15218548_434.png",
            "step": "check"
        },
        "in_group": 1,
        "group": {
            "no": "2ced4f9405b94c0b84232e8ea6552deb",
            "name": "真诚的壹个辣椒",
            "member_need": 2,
            "member_now": 2,
            "check_today_no": 16,
            "members": [
                {
                    "is_me": 0,
                    "timezone": 480,
                    "day": 16,
                    "mbid": 141743,
                    "role": 1,
                    "nickname": "ida#",
                    "avatar": "/AvatarImage/iscool/74636984_290.png",
                    "bb_age": 2127,
                    "kaopu": 0,
                    "bbvip": 0,
                    "daka": {
                        "word": 44,
                        "duration": 15,
                        "qttask": 0,
                        "reminded": 1
                    },
                    "calendar": "111111111111111100000"
                },
                {
                    "is_me": 1,
                    "timezone": 480,
                    "day": 16,
                    "mbid": 142809,
                    "role": 0,
                    "nickname": "背够2w个",
                    "avatar": "/AvatarImage/iscool/15218548_434.png",
                    "bb_age": 1213,
                    "kaopu": 0,
                    "bbvip": 0,
                    "daka": {
                        "coin": 40,
                        "reminder": "21:00",
                        "word": 80,
                        "duration": 17,
                        "qttask": 0,
                        "reminded": 1
                    },
                    "calendar": "111111111111111100000"
                }
            ]
        }
    },
    "result_code": 200,
    "data_kind": "dv",
    "data_version": "dk"
}


def test_parse_local_data():
    """使用本地数据测试解析功能"""
    reader = BuBeiDanReader(sid="test")
    
    # 直接解析Mock数据
    members = reader.parse_member_data(MOCK_RESPONSE)
    
    print("\n" + "="*60)
    print("🧪 本地测试 - 不背单词数据解析")
    print("="*60)
    
    if members:
        for i, member in enumerate(members, 1):
            print(f"\n👤 成员 {i}:")
            print(f"   姓名: {member['姓名']}")
            print(f"   背单词数量: {member['背单词数量']} 个")
            print(f"   背单词时间: {member['背单词时间(分钟)']} 分钟")
            print(f"   打卡天数: {member['打卡天数']} 天")
            print(f"   是否本人: {member['是否为本人']}")
        
        print("\n" + "="*60)
        print("✅ 测试成功！数据解析正常")
        print("="*60)
        
        # 输出JSON格式
        print("\n📋 JSON格式输出:")
        print(json.dumps(members, ensure_ascii=False, indent=2))
    else:
        print("❌ 测试失败：无法解析数据")


def test_data_structure():
    """测试返回的数据结构"""
    reader = BuBeiDanReader(sid="test")
    members = reader.parse_member_data(MOCK_RESPONSE)
    
    print("\n" + "="*60)
    print("🔍 数据结构验证")
    print("="*60)
    
    required_fields = ['姓名', '背单词数量', '背单词时间(分钟)', '是否为本人', '打卡天数']
    
    for member in members:
        print(f"\n检查成员: {member['姓名']}")
        for field in required_fields:
            if field in member:
                print(f"  ✅ {field}: {member[field]}")
            else:
                print(f"  ❌ 缺少字段: {field}")
    
    print("\n" + "="*60)


def test_comparison():
    """对比两位成员的数据"""
    reader = BuBeiDanReader(sid="test")
    members = reader.parse_member_data(MOCK_RESPONSE)
    
    if len(members) >= 2:
        print("\n" + "="*60)
        print("📊 成员数据对比")
        print("="*60)
        
        member1, member2 = members[0], members[1]
        
        print(f"\n{'项目':<20} {'成员1':^15} {'成员2':^15}")
        print("-" * 60)
        print(f"{'姓名':<20} {member1['姓名']:^15} {member2['姓名']:^15}")
        print(f"{'背单词数量':<20} {member1['背单词数量']:^15} {member2['背单词数量']:^15}")
        print(f"{'背单词时间(分钟)':<20} {member1['背单词时间(分钟)']:^15} {member2['背单词时间(分钟)']:^15}")
        print(f"{'打卡天数':<20} {member1['打卡天数']:^15} {member2['打卡天数']:^15}")
        
        # 计算谁更努力
        total1 = member1['背单词数量'] + member1['背单词时间(分钟)']
        total2 = member2['背单词数量'] + member2['背单词时间(分钟)']
        
        print("\n" + "="*60)
        print("🏆 今日冠军:")
        if total1 > total2:
            print(f"   {member1['姓名']} 领先！(总分: {total1})")
        elif total2 > total1:
            print(f"   {member2['姓名']} 领先！(总分: {total2})")
        else:
            print(f"   平局！两位都很努力！")
        print("="*60)


if __name__ == "__main__":
    print("🚀 开始测试不背单词数据读取器...\n")
    
    # 运行所有测试
    test_parse_local_data()
    test_data_structure()
    test_comparison()
    
    print("\n✨ 所有测试完成！")
