/**
 * Apifox 前置操作脚本：根据当前环境变量 env（dev/test/prod）从 api_tokens.json 读取 token 并设为 Authorization
 *
 * 使用步骤：
 * 1. 在 Apifox 中为「开发环境」「测试环境」「生产环境」分别添加环境变量：env = dev / test / prod
 * 2. 在 项目 或 接口 的「前置操作」中新增「自定义脚本」，粘贴本脚本内容
 * 3. 若 Apifox 不支持 require('fs')，请在各环境中手动添加变量 Authorization，从 api_tokens.json 复制对应 key 的值
 */

var TOKENS_PATH = '/Users/bzshuo/Desktop/api_tokens.json';

function readTokenAndSetAuth() {
  var env = pm.environment.get('env');
  if (!env) {
    console.warn('未设置环境变量 env，请在各环境中添加 env：dev / test / prod');
    return;
  }
  try {
    var fs = require('fs');
    var raw = fs.readFileSync(TOKENS_PATH, 'utf8');
    var tokens = JSON.parse(raw);
    var token = tokens[env];
    if (token) {
      pm.environment.set('Authorization', token);
    } else {
      console.warn('api_tokens.json 中无 key: ' + env);
    }
  } catch (e) {
    console.warn('读取 api_tokens.json 失败（若 Apifox 不支持 fs，请手动在环境中设置 Authorization）: ' + e.message);
  }
}

readTokenAndSetAuth();
