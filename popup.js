const STORAGE_KEY = 'authCaptureLog';
const DEBUG_KEY = 'authCaptureDebug';
const ENV_TOKENS_KEY = 'authEnvTokens';
const ENV_KEYS = ['dev', 'test', 'prod'];
const NATIVE_HOST_NAME = 'com.auth_capture.bridge';
const API_TOKENS_PATH = '/Users/bzshuo/Documents/JiangTai/Script/api_tokens.json';

function checkNativeHost() {
  const el = document.getElementById('nativeStatus');
  if (!el) return;
  chrome.runtime.sendNativeMessage(
    NATIVE_HOST_NAME,
    { path: API_TOKENS_PATH, merge: {} },
    (reply) => {
      const err = chrome.runtime.lastError;
      if (!err && reply && reply.success) {
        el.textContent = 'Native 主机：已连接（会写入桌面文件）';
        el.className = 'path-hint native-ok';
      } else {
        const msg = err ? err.message : (reply && reply.error) || '未知错误';
        el.textContent = 'Native 主机：未连接 — ' + msg;
        el.className = 'path-hint native-fail';
      }
    }
  );
}

function renderList(list, maxLen) {
  return list.slice(0, maxLen).map((x) => {
    const cls = x.hasAuth ? 'has-auth' : 'no-auth';
    const badge = x.hasAuth ? '<span class="badge yes">有 Auth</span>' : '<span class="badge no">无</span>';
    const shortUrl = x.url.length > 60 ? x.url.slice(0, 57) + '...' : x.url;
    return `<li class="${cls}"><span class="time">${x.time}</span>${badge}<br>${shortUrl}</li>`;
  }).join('');
}

checkNativeHost();

chrome.storage.local.get([STORAGE_KEY, DEBUG_KEY, ENV_TOKENS_KEY], (r) => {
  const list = r[STORAGE_KEY] || [];
  const debugList = r[DEBUG_KEY] || [];
  const envTokens = r[ENV_TOKENS_KEY] || {};
  const ul = document.getElementById('list');
  const debugEl = document.getElementById('debug');

  const captured = ENV_KEYS.filter((k) => envTokens[k]);
  document.getElementById('envHint').textContent = captured.length
    ? '已捕获环境：' + captured.join('、')
    : '已捕获环境：—（登录 dev/test/prod 并触发请求后自动写入）';

  if (list.length === 0 && debugList.length === 0) {
    ul.innerHTML = '<li class="empty">暂无记录。登录任一环境卫健网并点击页面触发请求即可自动写入。</li>';
    if (debugEl) debugEl.innerHTML = '';
    return;
  }

  if (list.length === 0) {
    ul.innerHTML = '<li class="empty">未监听到三环境请求。</li>';
  } else {
    ul.innerHTML = renderList(list, 20);
  }

  if (debugEl && debugList.length > 0) {
    debugEl.innerHTML = '<p class="debug-title">最近带 Authorization 的请求</p><ul class="debug-list">' + renderList(debugList, 10) + '</ul>';
  } else {
    debugEl.innerHTML = '';
  }
});
