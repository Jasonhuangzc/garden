"""
集成示例 - 如何在你的项目中使用不背单词数据读取器
"""

from bubeidan_reader import BuBeiDanReader
import json


# ========== 示例1: 快速获取数据 ==========
def example_quick_use():
    """最简单的使用方式"""
    print("示例1: 快速使用")
    print("-" * 60)
    
    # 替换成你的SID
    sid = "你的SID字符串"
    reader = BuBeiDanReader(sid)
    
    # 直接显示格式化数据
    reader.display_team_data()


# ========== 示例2: 获取原始数据进行自定义处理 ==========
def example_custom_process():
    """获取原始数据并自定义处理"""
    print("\n示例2: 自定义处理")
    print("-" * 60)
    
    sid = "你的SID字符串"
    reader = BuBeiDanReader(sid)
    
    # 获取数据列表
    members = reader.get_team_data()
    
    if members:
        for member in members:
            if member['是否为本人'] == '是':
                print(f"✅ 我今天背了 {member['背单词数量']} 个单词，用时 {member['背单词时间(分钟)']} 分钟")
            else:
                print(f"👥 队友 {member['姓名']} 背了 {member['背单词数量']} 个单词")


# ========== 示例3: 数据持久化保存 ==========
def example_save_to_file():
    """将数据保存到文件"""
    print("\n示例3: 保存到文件")
    print("-" * 60)
    
    sid = "你的SID字符串"
    reader = BuBeiDanReader(sid)
    members = reader.get_team_data()
    
    if members:
        # 保存为JSON
        with open('team_data.json', 'w', encoding='utf-8') as f:
            json.dump(members, f, ensure_ascii=False, indent=2)
        print("✅ 数据已保存到 team_data.json")
        
        # 保存为CSV格式的文本
        with open('team_data.csv', 'w', encoding='utf-8') as f:
            f.write("姓名,背单词数量,背单词时间(分钟),打卡天数,是否本人\n")
            for m in members:
                f.write(f"{m['姓名']},{m['背单词数量']},{m['背单词时间(分钟)']},{m['打卡天数']},{m['是否为本人']}\n")
        print("✅ 数据已保存到 team_data.csv")


# ========== 示例4: 定时监控 ==========
def example_monitoring():
    """每小时检查一次数据"""
    import time
    from datetime import datetime
    
    print("\n示例4: 定时监控（演示）")
    print("-" * 60)
    
    sid = "你的SID字符串"
    reader = BuBeiDanReader(sid)
    
    # 模拟监控（实际使用时可以放在循环中）
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 开始监控...")
    members = reader.get_team_data()
    
    if members:
        total_words = sum(m['背单词数量'] for m in members)
        total_time = sum(m['背单词时间(分钟)'] for m in members)
        print(f"📊 团队统计: 共背了 {total_words} 个单词，总用时 {total_time} 分钟")
        
        # 检查是否有人偷懒
        for member in members:
            if member['背单词数量'] == 0:
                print(f"⚠️  {member['姓名']} 今天还没有开始学习！")


# ========== 示例5: 作为Web API的数据源 ==========
def example_as_api():
    """作为API返回数据"""
    print("\n示例5: 作为API数据源")
    print("-" * 60)
    
    sid = "你的SID字符串"
    reader = BuBeiDanReader(sid)
    members = reader.get_team_data()
    
    if members:
        # 构造API响应格式
        api_response = {
            "success": True,
            "data": {
                "team_name": "真诚的壹个辣椒",
                "members": members,
                "summary": {
                    "total_members": len(members),
                    "total_words": sum(m['背单词数量'] for m in members),
                    "total_time": sum(m['背单词时间(分钟)'] for m in members),
                }
            },
            "timestamp": "2026-01-28T14:05:33+08:00"
        }
        
        print("API响应格式:")
        print(json.dumps(api_response, ensure_ascii=False, indent=2))


# ========== 示例6: 数据分析 ==========
def example_analysis():
    """简单的数据分析"""
    print("\n示例6: 数据分析")
    print("-" * 60)
    
    sid = "你的SID字符串"
    reader = BuBeiDanReader(sid)
    members = reader.get_team_data()
    
    if members and len(members) >= 2:
        # 计算效率（单词/分钟）
        for member in members:
            time = member['背单词时间(分钟)']
            words = member['背单词数量']
            efficiency = words / time if time > 0 else 0
            print(f"{member['姓名']}:")
            print(f"  - 背单词效率: {efficiency:.2f} 个/分钟")
            print(f"  - 学习状态: {'非常努力' if words > 60 else '继续加油'}")
        
        # 团队总结
        avg_words = sum(m['背单词数量'] for m in members) / len(members)
        print(f"\n📊 团队平均: {avg_words:.1f} 个单词/人")


# ========== 主程序 ==========
if __name__ == "__main__":
    print("="*60)
    print("🎓 不背单词数据读取器 - 使用示例集合")
    print("="*60)
    
    print("\n⚠️  提示: 这些示例需要替换真实的SID才能运行")
    print("可以修改函数中的 sid 变量，然后调用相应的示例函数")
    
    # 取消注释下面的行来运行特定示例：
    # example_quick_use()
    # example_custom_process()
    # example_save_to_file()
    # example_monitoring()
    # example_as_api()
    # example_analysis()
    
    print("\n" + "="*60)
    print("💡 提示:")
    print("1. 将你的SID替换到示例代码中")
    print("2. 取消注释想要运行的示例函数")
    print("3. 运行 python integration_examples.py")
    print("="*60)
