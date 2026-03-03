#!/usr/bin/env python3
"""Chrome Native Messaging host: 接收扩展发来的 path + content，写入指定文件。"""
import sys
import json
import struct
import os

def debug_log(msg):
    log_path = os.environ.get("NATIVE_HOST_DEBUG_LOG")
    if log_path:
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(msg + "\n")
        except Exception:
            pass

def read_message():
    raw_len = sys.stdin.buffer.read(4)
    if len(raw_len) == 0:
        return None
    msg_len = struct.unpack("<I", raw_len)[0]
    return sys.stdin.buffer.read(msg_len).decode("utf-8")

def send_message(obj):
    msg = json.dumps(obj).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(msg)))
    sys.stdout.buffer.write(msg)
    sys.stdout.buffer.flush()

def main():
    debug_log("python main() started")
    try:
        data = read_message()
        debug_log("read_message done, len=%s" % (len(data) if data else 0))
        if not data:
            send_message({"success": False, "error": "no input"})
            return
        msg = json.loads(data)
        path = msg.get("path")
        if not path:
            send_message({"success": False, "error": "missing path"})
            return
        merge = msg.get("merge")
        content = msg.get("content")
        if merge is not None:
            data = {}
            if os.path.isfile(path):
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            if not isinstance(data, dict):
                data = {}
            data.update(merge)
            dirpath = os.path.dirname(path)
            if dirpath and not os.path.isdir(dirpath):
                os.makedirs(dirpath, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        elif content is not None:
            dirpath = os.path.dirname(path)
            if dirpath and not os.path.isdir(dirpath):
                os.makedirs(dirpath, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
        else:
            send_message({"success": False, "error": "need merge or content"})
            return
        send_message({"success": True})
    except Exception as e:
        import traceback
        debug_log("exception: " + traceback.format_exc())
        send_message({"success": False, "error": str(e)})

if __name__ == "__main__":
    main()
    debug_log("python main() exited")
