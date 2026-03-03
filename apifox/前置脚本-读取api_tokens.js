/**
 * Apifox 前置操作脚本：通过本地 HTTP 服务按环境拉取 token，并设为 Authorization。
 *
 * 搭配本仓库的 Chrome 扩展 & native_host 使用：
 * - 扩展自动把三个环境（dev/test/prod）的 Authorization 写入本地 api_tokens.json
 * - 在本机启动 token_http_server.py（默认 http://127.0.0.1:5678）
 * - Apifox 在请求前调用本脚本，通过 HTTP 拉取对应 env 的 token
 *
 * 使用步骤：
 * 1. 在 Apifox 中为「开发环境」「测试环境」「生产环境」分别添加环境变量：env = dev / test / prod
 * 2. 本机终端启动本地服务（路径按你实际仓库为准）：
 *    python3 native_host/token_http_server.py
 * 3. 在 项目 或 接口 的「前置操作」中新增「自定义脚本」，粘贴本脚本内容
 */

var TOKEN_SERVER_URL = 'http://127.0.0.1:5678/token';

function fetchTokenAndSetAuth() {
  var env = pm.environment.get('env') || 'dev';

  pm.sendRequest(
    {
      url: TOKEN_SERVER_URL + '?env=' + encodeURIComponent(env),
      method: 'GET',
    },
    function (err, res) {
      if (err) {
        console.log('调用本地 token 服务失败:', err);
        return;
      }

      try {
        var data = res.json ? res.json() : JSON.parse(res.text());
        if (data && data.token) {
          pm.environment.set('Authorization', data.token);
        } else {
          console.log('本地 token 服务未返回 token，env = ' + env + ', 响应: ' + res.text());
        }
      } catch (e) {
        console.log('解析本地 token 响应失败:', e);
      }
    }
  );
}

fetchTokenAndSetAuth();

