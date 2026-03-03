/**
 * Apifox 前置脚本示例：从扩展写入的 JSON 文件读取当前环境的 token，设为环境变量 Authorization。
 *
 * 使用步骤：
 * 1. 在扩展中设置「Apifox 变量文件路径」为固定路径，如：/Users/你的用户名/Desktop/apifox_tokens.json
 * 2. 安装 native_host 并重启 Chrome，使扩展能写入该路径
 * 3. 在 Apifox 中为每个环境（开发/测试/生产）添加环境变量：env_name = dev | test | prod（与扩展写入的 key 一致）
 * 4. 在本项目或 Apifox 的「前置操作」中粘贴下面逻辑（若 Apifox 支持读取本地文件）
 *
 * 注意：Apifox 的脚本沙箱可能无法访问本地文件，此时可：
 * - 方案 A：将「Apifox 变量文件路径」设为项目目录下的文件（如项目根目录/apifox_tokens.json），
 *   在 Apifox 中通过「导入环境」或手动复制该文件中的 token 到环境变量 Authorization
 * - 方案 B：若 Apifox 支持 Node 或读取文件，使用下面逻辑（需根据实际 API 调整）
 */

// 伪代码示例（Apifox 若支持 pm 且能读文件）：
// const path = '/Users/你的用户名/Desktop/apifox_tokens.json';
// const envName = pm.environment.get('env_name') || 'dev';  // 当前环境名：dev / test / prod
// const fs = require('fs');
// const tokens = JSON.parse(fs.readFileSync(path, 'utf8'));
// const token = tokens[envName] || tokens['med-pc-staff-dev.jiangtai.com'];
// if (token) pm.environment.set('Authorization', token);

// 若 Apifox 不支持 fs，则手动在环境中设置 Authorization，或从 apifox_tokens.json 复制对应 key 的值即可。
// JSON 格式：{ "dev": "Bearer xxx", "test": "Bearer yyy", "med-pc-staff-dev.jiangtai.com": "Bearer xxx" }
