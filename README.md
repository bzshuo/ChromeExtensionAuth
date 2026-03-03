# Token 捕获扩展（三环境 + Apifox）

监听不同环境请求，自动解析并写入 **Authorization** 到固定 JSON 文件，**全自动化，无需用户确认**。Apifox 通过前置脚本按环境变量读取该文件并设置 Authorization。

## 监听环境与写入路径

| 环境 | 地址 | JSON key |
|------|------|----------|
| dev  | https://med-pc-staff-dev.jiangtai.com/  | `dev`  |
| test | https://med-pc-staff-test.jiangtai.com/ | `test` |
| prod | https://admin.chinamedins.com/          | `prod` |

- **写入文件**：`/Users/xxxx/Desktop/api_tokens.json`
- **格式**：`{ "dev": "Bearer xxx", "test": "Bearer yyy", "prod": "Bearer zzz" }`
- 登录任一环境并触发接口请求后，对应 key 的 token 会自动更新，无需任何弹窗或确认。

## 安装

1. Chrome 打开 `chrome://extensions/`，开启「开发者模式」，加载已解压的扩展程序，选择本目录
2. **安装 Native Messaging**（否则无法写入桌面，会退化为下载到默认下载目录）：
   
   - 复制本扩展的 **扩展 ID**
   - 终端执行：
     ```bash
     cd chrome-extension-jiangtai-auth/native_host
     chmod +x run.sh write_auth.py
     ./install_mac.sh 你的扩展ID
     ```
   - 重启 Chrome

## 在 Apifox 中按环境使用 token

1. 为每个环境添加环境变量 **env**：
   - 开发环境：`env` = `dev`
   - 测试环境：`env` = `test`
   - 生产环境：`env` = `prod`

2. 在项目或接口的 **前置操作** 中增加 **自定义脚本**，粘贴 `apifox/前置脚本-读取api_tokens.js` 的内容。脚本会根据当前环境的 `env` 从 `/Users/xxx/Desktop/api_tokens.json` 读取对应 token 并设置 `Authorization`。

3. 若 Apifox 前置脚本不支持 `require('fs')`，则在各环境中手动添加变量 **Authorization**，从 `api_tokens.json` 中复制对应 key（dev/test/prod）的值即可。
