#!/bin/bash
# 安装 Native Messaging 主机，使扩展可写入你指定的路径。
# 用法: ./install_mac.sh <你的扩展ID>
# 扩展ID 在 chrome://extensions 页面，勾选「开发者模式」后可见。
#
# 会将 run.sh / write_auth.py 复制到纯英文路径下，避免项目路径含中文时 Chrome 无法启动主机。

set -e
EXT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOSTS_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
# 使用纯 ASCII 子目录，避免 Chrome 在 macOS 下对含中文路径启动失败
INSTALL_DIR="$HOSTS_DIR/jiangtai_auth_host"
RUN_SH="$INSTALL_DIR/run.sh"
MANIFEST="$HOSTS_DIR/com.jiangtai.auth_capture.json"

if [ -z "$EXT_ID" ]; then
  echo "用法: $0 <扩展ID>"
  echo "扩展ID 在 chrome://extensions 页面复制（如 abcdefghijklmnopqrstuvwxyz12）。"
  exit 1
fi

chmod +x "$SCRIPT_DIR/run.sh"
chmod +x "$SCRIPT_DIR/write_auth.py"
mkdir -p "$HOSTS_DIR"
mkdir -p "$INSTALL_DIR"
cp "$SCRIPT_DIR/run.sh" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/write_auth.py" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/run.sh"
chmod +x "$INSTALL_DIR/write_auth.py"

echo "{
  \"name\": \"com.jiangtai.auth_capture\",
  \"description\": \"Authorization 写入指定文件\",
  \"path\": \"$RUN_SH\",
  \"type\": \"stdio\",
  \"allowed_origins\": [\"chrome-extension://$EXT_ID/\"]
}" > "$MANIFEST"

echo "已安装到: $MANIFEST"
echo "主机脚本已复制到纯英文路径: $INSTALL_DIR"
echo "在扩展弹窗中设置「自动保存路径」为完整路径（如 $HOME/Desktop/xxx.txt）即可自动写入该文件。"
