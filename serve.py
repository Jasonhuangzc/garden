import http.server
import socketserver
import os
import sys
import time
import threading
import subprocess

from daily_reset import check_and_reset_daily

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# 定时任务线程
class DataSyncScheduler(threading.Thread):
    def __init__(self, interval=60):
        super().__init__()
        self.interval = interval
        self.daemon = True # 设置为守护线程，主程序退出时自动结束
        self.stop_event = threading.Event()

    def run(self):
        print(f"⏰ [Scheduler] 自动同步任务已启动 (每{self.interval}秒)")
        while not self.stop_event.is_set():
            self.fetch_data()
            self.reset_daily()
            time.sleep(self.interval)

    def fetch_data(self):
        try:
            print(f"🔄 [Scheduler] 正在抓取最新数据 ({time.strftime('%H:%M:%S')})...")
            script_path = os.path.join(DIRECTORY, "fetch_current_data.py")
            json_path = os.path.join(DIRECTORY, "current_team_data.json")
            
            # 记录文件的旧修改时间
            old_mtime = os.path.getmtime(json_path) if os.path.exists(json_path) else 0
            
            # 使用 DEVNULL 丢弃输出，避免所有编码问题
            result = subprocess.run(
                [sys.executable, script_path],
                cwd=DIRECTORY,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=30
            )
            
            # 通过检查文件是否更新来判断成功
            new_mtime = os.path.getmtime(json_path) if os.path.exists(json_path) else 0
            
            if new_mtime > old_mtime:
                print(f"✅ [Scheduler] 数据更新成功")
            elif result.returncode == 0:
                print(f"✅ [Scheduler] 脚本执行成功（数据无变化）")
            else:
                print(f"⚠️ [Scheduler] 脚本返回非0 (退出码: {result.returncode})")
        except subprocess.TimeoutExpired:
            print(f"⚠️ [Scheduler] 抓取超时 (>30秒)")
        except Exception as e:
            print(f"⚠️ [Scheduler] 调度器错误: {type(e).__name__}: {e}")

    def reset_daily(self):
        try:
            result = check_and_reset_daily()
            if result.get("success") and not result.get("skipped"):
                print(f"✅ [Scheduler] 已执行每日重置 ({result.get('resetTime')})")
        except Exception as e:
            print(f"⚠️ [Scheduler] 重置任务错误: {type(e).__name__}: {e}")

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # 添加CORS头，允许跨域
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    # 1. 启动定时同步线程
    scheduler = DataSyncScheduler(interval=60) # 60秒一次
    scheduler.start()
    
    # 2. 立即执行一次抓取，确保启动时有数据
    scheduler.fetch_data()

    # 3. 启动HTTP服务器
    # 允许地址重用，防止重启时端口被占用
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print("="*60)
        print(f"🌐 Garden项目本地服务器已启动")
        print("="*60)
        print(f"\n📡 服务器地址: http://localhost:{PORT}")
        print(f"⚡ 后台任务: 每60秒自动同步不背单词数据")
        print("\n💡 按 Ctrl+C 停止服务器")
        print("="*60 + "\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 服务器已停止")
