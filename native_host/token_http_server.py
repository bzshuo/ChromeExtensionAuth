#!/usr/bin/env python3
"""
本地 HTTP 服务：从 api_tokens.json 中按环境返回 Authorization token。

用途：
- Chrome 扩展 + native_host 负责自动更新 api_tokens.json
- Apifox 在请求前通过 pm.sendRequest 调用本服务，按 env(dev/test/prod) 获取最新 token

默认监听：127.0.0.1:5678
"""
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs


DEFAULT_HOST = os.environ.get("TOKEN_SERVER_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.environ.get("TOKEN_SERVER_PORT", "5678"))

# 与扩展 write_auth.py / background.js 中保持一致
API_TOKENS_PATH = os.environ.get(
    "API_TOKENS_PATH",
    "/Users/bzshuo/Documents/JiangTai/Script/api_tokens.json",
)


def load_tokens():
    """从本地 JSON 文件读取所有环境的 token。"""
    if not os.path.isfile(API_TOKENS_PATH):
        return {}
    try:
        with open(API_TOKENS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
        return {}
    except Exception:
        return {}


class TokenRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # 关闭默认日志，避免终端刷屏
        return

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/token":
            self._send_json(404, {"error": "not_found"})
            return

        qs = parse_qs(parsed.query or "")
        env = (qs.get("env") or [""])[0] or "dev"

        tokens = load_tokens()
        token = tokens.get(env)
        if not token:
            self._send_json(404, {"error": "token_not_found", "env": env})
            return

        self._send_json(200, {"env": env, "token": token})


def run_server():
    server_address = (DEFAULT_HOST, DEFAULT_PORT)
    httpd = HTTPServer(server_address, TokenRequestHandler)
    print(
        f"Token HTTP server listening on http://{DEFAULT_HOST}:{DEFAULT_PORT}, "
        f"tokens file: {API_TOKENS_PATH}"
    )
    httpd.serve_forever()


if __name__ == "__main__":
    run_server()

