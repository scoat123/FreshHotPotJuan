/* 鮮味愛喝湯 離線快取：先用快取、背景更新；安裝新版時略過瀏覽器快取，確保拿到最新檔案 */
var CACHE = 'freshpot-v28';
var FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(FILES.map(function (u) { return fetch(new Request(u, { cache: 'reload' })).then(function (r) { if (!r.ok) throw new Error(u); return c.put(u, r); }); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  // Firebase SDK（gstatic）：快取起來，離線也能啟動
  if (req.method === 'GET' && u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0) {
    e.respondWith(caches.open(CACHE).then(function (c) { return c.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; });
    }); }));
    return;
  }
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; });
      if (hit) { net.catch(function () {}); return hit; }
      return net.catch(function () { return c.match('./index.html'); });
    });
  }));
});
