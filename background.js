const STORAGE_KEY = 'authCaptureLog';
const DEBUG_KEY = 'authCaptureDebug';
const ENV_TOKENS_KEY = 'authEnvTokens';
const LOG_MAX = 50;
const DEBUG_MAX = 15;
const NATIVE_HOST_NAME = 'com.auth_capture.bridge';

const ENV_ORIGINS = {
  med_dev: 'https://med-pc-staff-dev.jiangtai.com',
  med_test: 'https://med-pc-staff-test.jiangtai.com',
  med_prod: 'https://admin.chinamedins.com',
  edu_test: 'https://edu-man-web-test.jiangtai.com'
};

const API_TOKENS_PATH = '/Users/bzshuo/Documents/JiangTai/Script/api_tokens.json';

function getEnvKeyFromUrl(url) {
  try {
    const u = new URL(url);
    const origin = u.origin;
    for (const [key, base] of Object.entries(ENV_ORIGINS)) {
      if (origin === base || origin.startsWith(base + '/')) return key;
    }
  } catch (_) {}
  return null;
}

function findHeader(headers, name) {
  if (!headers) return null;
  const lower = name.toLowerCase();
  const entry = headers.find((h) => (h.name || '').toLowerCase() === lower);
  return entry ? entry.value : null;
}

function pushLog(entry) {
  chrome.storage.local.get([STORAGE_KEY], (r) => {
    const list = r[STORAGE_KEY] || [];
    list.unshift(entry);
    chrome.storage.local.set({ [STORAGE_KEY]: list.slice(0, LOG_MAX) });
  });
}

function pushDebug(entry) {
  chrome.storage.local.get([DEBUG_KEY], (r) => {
    const list = r[DEBUG_KEY] || [];
    list.unshift(entry);
    chrome.storage.local.set({ [DEBUG_KEY]: list.slice(0, DEBUG_MAX) });
  });
}

function fallbackToDownload(jsonStr) {
  const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
  chrome.downloads.download({
    url: dataUrl,
    filename: 'api_tokens.json',
    saveAs: false
  });
}

function writeEnvToken(envKey, token) {
  chrome.storage.local.get([ENV_TOKENS_KEY], (r) => {
    const envTokens = r[ENV_TOKENS_KEY] || {};
    envTokens[envKey] = token;
    chrome.storage.local.set({ [ENV_TOKENS_KEY]: envTokens });

    const merge = { [envKey]: token };
    chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, { path: API_TOKENS_PATH, merge }, (reply) => {
      const err = chrome.runtime.lastError;
      if (err) {
        pushDebug({
          type: 'nativeError',
          time: new Date().toLocaleString('zh-CN'),
          message: err.message || String(err)
        });
        fallbackToDownload(JSON.stringify(envTokens, null, 2));
        return;
      }

      if (!reply || reply.success !== true) {
        pushDebug({
          type: 'nativeReply',
          time: new Date().toLocaleString('zh-CN'),
          reply: reply || null
        });
      }
    });
  });
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const auth = findHeader(details.requestHeaders, 'Authorization');
    const envKey = getEnvKeyFromUrl(details.url);
    const time = new Date().toLocaleString('zh-CN');
    const entry = { url: details.url, time, hasAuth: !!auth };

    if (envKey !== null) {
      pushLog(entry);
    }
    if (auth) {
      pushDebug(entry);
    }

    if (!auth || envKey === null) return;

    writeEnvToken(envKey, auth);
  },
  { urls: [
    'https://med-pc-staff-dev.jiangtai.com/*',
    'https://med-pc-staff-test.jiangtai.com/*',
    'https://admin.chinamedins.com/*',
    'https://edu-man-web-test.jiangtai.com/*'
  ] },
  ['requestHeaders']
);
