#!/bin/bash
# 第一件事：写日志（不依赖 exec），确认 Chrome 是否真的执行到此脚本
echo "run.sh invoked $(date '+%Y-%m-%d %H:%M:%S')" >> /tmp/native_host_debug.log 2>/dev/null
# Chrome 调用的入口，用 python3 执行 write_auth.py
# 必须写死 Python 绝对路径：Chrome 启动时 PATH 为空，用 python3 会找不到而直接退出
DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="/tmp/native_host_debug.log"
exec 2>> "$LOG"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) run.sh started DIR=$DIR" >&2
export NATIVE_HOST_DEBUG_LOG="$LOG"
# 优先用系统 Python；若没有则用 PATH 里的 python3（Chrome 环境下 PATH 可能为空）
if [ -x /usr/bin/python3 ]; then
  exec /usr/bin/python3 "$DIR/write_auth.py"
elif [ -x /opt/homebrew/bin/python3 ]; then
  exec /opt/homebrew/bin/python3 "$DIR/write_auth.py"
else
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) no python3 found" >&2
  exit 1
fi
