"""
Flask API 服务器 - 不背单词数据接口
可以直接运行：python api_server.py
访问：http://localhost:5000/api/team-data
"""

from flask import Flask, jsonify
from flask_cors import CORS
from bubeidan_reader_simple import BuBeiDanReader
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置SID（建议使用环境变量）
SID = os.getenv('BUBEIDAN_SID', 
    "k0t5CNBsU5GDZc1N84CAyOgO7xgq03+uYbSc8xTOpCgPU5y/uRUw0Ui38ICaeC89p2Bo/LONDpihP6+v6X3T2KsbOTY5yrlfApuKYjiysYplM3a7mB4dhGL5q/wLptL7aMaH1gGZelkdNqYP/sdojTJL9qPtSfOSHQn/XH5ZDZedyP7CvUeuhzAlyPQPUEZ9ErSXmzaocEUsXa1zL9XvBXqhsJAIk20f358zKsMsmXR0wcx7H5kgagYj9ev2QAvkNGakVdVwOeB6ArKVo1WXW0h0fH3RTieWXxNAO4YRiCO6n1jD/fwujEMwrdFVDvQNrB2F8sjIQSEcy+7DTEC0Qg==")

# 简单的缓存
_cache = {'data': None, 'time': None}


@app.route('/')
def index():
    """API首页"""
    return jsonify({
        "name": "不背单词数据API",
        "version": "1.0.0",
        "endpoints": {
            "/api/team-data": "获取组队学习数据",
            "/api/health": "健康检查"
        }
    })


@app.route('/api/health')
def health():
    """健康检查"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/team-data')
def get_team_data():
    """
    获取组队学习数据
    
    响应格式:
    {
        "success": true,
        "data": {
            "members": [...],
            "timestamp": "2026-01-28T14:32:11"
        }
    }
    """
    try:
        # 检查缓存（5分钟有效）
        now = datetime.now()
        if _cache['data'] and _cache['time']:
            elapsed = (now - _cache['time']).total_seconds()
            if elapsed < 300:  # 5分钟缓存
                print(f"✅ 使用缓存数据 (缓存时间: {int(elapsed)}秒)")
                return jsonify({
                    "success": True,
                    "data": {
                        "members": _cache['data'],
                        "timestamp": _cache['time'].isoformat(),
                        "cached": True
                    }
                })
        
        # 获取新数据
        print("📡 获取最新数据...")
        reader = BuBeiDanReader(SID)
        members = reader.get_team_data()
        
        if members:
            # 更新缓存
            _cache['data'] = members
            _cache['time'] = now
            
            print(f"✅ 成功获取 {len(members)} 个成员的数据")
            return jsonify({
                "success": True,
                "data": {
                    "members": members,
                    "timestamp": now.isoformat(),
                    "cached": False
                }
            }), 200
        else:
            print("❌ 数据获取失败")
            return jsonify({
                "success": False,
                "error": "无法获取数据，SID可能已过期"
            }), 401
            
    except Exception as e:
        print(f"❌ 服务器错误: {str(e)}")
        return jsonify({
            "success": False,
            "error": "服务器内部错误"
        }), 500


@app.route('/api/team-data/summary')
def get_team_summary():
    """
    获取团队统计摘要
    """
    try:
        reader = BuBeiDanReader(SID)
        members = reader.get_team_data()
        
        if members:
            total_words = sum(m['背单词数量'] for m in members)
            total_time = sum(m['背单词时间(分钟)'] for m in members)
            
            return jsonify({
                "success": True,
                "data": {
                    "total_members": len(members),
                    "total_words": total_words,
                    "total_time": total_time,
                    "avg_words_per_member": total_words / len(members) if members else 0,
                    "timestamp": datetime.now().isoformat()
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": "无法获取数据"
            }), 401
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("="*60)
    print("🚀 不背单词数据API服务器启动中...")
    print("="*60)
    print("\n📡 可用端点:")
    print("  - http://localhost:5000/")
    print("  - http://localhost:5000/api/health")
    print("  - http://localhost:5000/api/team-data")
    print("  - http://localhost:5000/api/team-data/summary")
    print("\n💡 提示: 按 Ctrl+C 停止服务器")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
