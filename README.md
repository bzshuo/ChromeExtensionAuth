## Token 捕获扩展（多环境 + Apifox）

监听指定域名下的请求，自动解析并写入 **Authorization** 到本地 JSON 文件，**全自动，无需手动复制粘贴**。Apifox 通过前置脚本 + 本地 HTTP 服务按环境拉取该文件中的 token 并设置为 `Authorization`。

### 监听环境

当前扩展会监听并写入以下环境的请求：

| 标识       | 说明           | 域名                                  |
| ---------- | -------------- |-------------------------------------|
| `med_dev`  | 医疗 dev 环境  | https://med-pc-staff-dev.xxxx.com/  |
| `med_test` | 医疗 test 环境 | https://med-pc-staff-test.xxxx.com/ |
| `med_prod` | 医疗 prod 环境 | https://admin.xxxx.com/             |
| `edu_test` | 教培 test 环境 | https://edu-man-web-test.xxxx.com/  |

- **写入文件路径**：`/Users/xxx/Documents/path.../api_tokens.json`
- **写入格式**（示例）：

  ```json
  {
    "med_dev": "Bearer xxx",
    "med_test": "Bearer yyy",
    "med_prod": "Bearer zzz",
    "edu_test": "Bearer aaa"
  }
  ```

只要在对应环境登录并触发一次带 Authorization 的接口请求，扩展会自动更新该文件中对应 key 的值；如果 Native 主机不可用，则会退化为自动下载 `api_tokens.json` 到浏览器默认下载目录。

---

## 安装与配置（Chrome 扩展）

1. 在 Chrome 中打开 `chrome://extensions/`，开启「开发者模式」，点击「加载已解压的扩展程序」，选择本仓库目录。
2. 确认扩展 `manifest.json` 中权限与域名配置符合预期（默认已包含上表中的 4 个域名）。
3. 打开扩展弹窗，确认能够看到最近的请求记录；此时仅依赖浏览器本地存储，不会写入文件。

---

## 安装 Native Messaging 主机（macOS）

要让扩展真正写入 `/Users/xxx/Documents/path.../api_tokens.json`，需要在本机安装 Native Messaging 主机，使 Chrome 可以调用本地脚本：

1. 打开 `chrome://extensions/`，勾选「开发者模式」，复制本扩展的 **扩展 ID**（形如 `abcdefghijklmnopqrstuvwxyz12`）。
2. 在终端执行（路径按你本机仓库为准，这里以当前仓库为例）：

   ```bash
   cd "/Users/xxx/Documents/path.../chrome-extension-auth/native_host"
   chmod +x run.sh write_auth.py install_mac.sh
   ./install_mac.sh 你的扩展ID
   ```

3. 脚本会在 `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/` 下：
   - 创建纯英文目录 `auth_capture_host`，并复制 `run.sh` / `write_auth.py`；
   - 生成 manifest 文件 `com.auth_capture.bridge.json`，其中：
     - `"name"` 为 `com.auth_capture.bridge`；
     - `"path"` 指向上述目录下的 `run.sh`；
     - `"allowed_origins"` 仅包含你刚才复制的扩展 ID。

4. 完全退出 Chrome（`Cmd+Q`）后重新打开，再次查看扩展弹窗：
   - 若状态显示「**Native 主机：已连接**」，说明 Native 主机安装成功；
   - 之后在受支持域名下触发接口请求，`/tmp/native_host_debug.log` 中也会记录调用日志，`api_tokens.json` 会被自动更新。

> 说明：`run.sh` 会把调试日志写到 `/tmp/native_host_debug.log`，`write_auth.py` 通过 `NATIVE_HOST_DEBUG_LOG` 环境变量共用该日志文件。

---

## 在 Apifox 中按环境使用 token

为避免手动维护多个 `apifox_env_*.json`，推荐通过本仓库的本地 HTTP 服务 + 前置脚本自动设置 `Authorization`。

### 1. 启动本地 HTTP 服务

在当前仓库根目录下执行（默认监听 `127.0.0.1:5678`，直接读取上文写入的 `api_tokens.json`）：

```bash
cd "/Users/xxx/Documents/path.../chrome-extension-auth"
python3 native_host/token_http_server.py
```

服务启动后会输出类似：

```text
Token HTTP server listening on http://127.0.0.1:5678, tokens file: /Users/xxx/Documents/path.../Script/api_tokens.json
```

### 2. 在 Apifox 中配置环境变量

1. 为各个环境增加环境变量（建议）：
   - 医疗 dev 环境：`env = med_dev`
   - 医疗 test 环境：`env = med_test`
   - 医疗 prod 环境：`env = med_prod`
   - 教培 test 环境：`env = edu_test`
2. 也可以只为你实际使用的环境配置对应的 `env` 变量，保持与 `api_tokens.json` 中的 key 一致即可。

### 3. 在前置操作中增加自定义脚本

1. 在 Apifox 的「项目设置」或具体接口的「前置操作」中，新增一条 **自定义脚本**。
2. 打开本仓库的 `apifox/前置脚本-读取api_tokens.js`，将文件内容完整复制粘贴到该脚本中。
3. 确保脚本中 `TOKEN_SERVER_URL` 保持默认即可：

   ```js
   var TOKEN_SERVER_URL = 'http://127.0.0.1:5678/token';
   ```

4. 每次发送请求前，Apifox 会：
   - 读取当前环境变量 `env`；
   - 调用 `GET http://127.0.0.1:5678/token?env=...`；
   - 若返回 `{ token: "Bearer xxx" }`，自动将其写入环境变量 `Authorization`。

---

## 运行链路总结

1. 你在浏览器中登录对应环境（dev/test/prod 等），并触发带 Authorization 的接口请求；
2. Chrome 扩展在 `background.js` 中拦截请求，提取 `Authorization`，按域名映射成 `med_dev` / `med_test` / `med_prod` / `edu_test` 等 key；
3. 扩展通过 Native Messaging 调用 `com.auth_capture.bridge`，由 `run.sh` + `write_auth.py` 负责合并写入 `api_tokens.json`；
4. 启动中的 `token_http_server.py` 从 `api_tokens.json` 读取最新 token，并通过 HTTP 接口对外暴露；
5. Apifox 在前置脚本中按环境调用本地 HTTP 服务，自动将返回的 token 写入 `Authorization` 环境变量，真正发请求时直接复用。
