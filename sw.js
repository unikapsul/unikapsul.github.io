/*
 * ÜniKapsül çevrimdışı önbelleği (2026-10-23).
 *
 * Strateji ağ öncelikli: çevrimiçiyken her açılışta güncel sayfa ve veri alınır,
 * önbellek yalnız ağ yokken kullanılır. Önbellek öncelikli strateji veriyi
 * dondururdu (sınav programı yayımlandığında öğrenci eski hâlini görürdü) —
 * APK'nın reddedilme sebebiyle aynı sorun.
 *
 * Yalnız aynı kökenden GET istekleri önbelleğe girer; uygulama başka hiçbir
 * adrese istek atmaz (CSP connect-src 'none').
 */
"use strict";

// v7 (2026-10-28): Hızlı bölüm arama seçimi düzeltildi (defaultGrade hatası giderildi).
var CACHE = "unikapsul-v7";
var ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-180.png",
  "fonts/inter-latin.woff2",
  "fonts/inter-latin-ext.woff2",
  "data/catalog.js",
  "data/offerings.js",
  "data/grading-rules.js",
  "data/dining-menu.js",
  "data/academic-calendar.js",
  "data/curriculum.js",
  "data/exams.js",
  "data/activities.js",
  "data/med-schedule.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(ASSETS.map(function (path) { return new Request(path, { cache: "no-cache" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request, { cache: "no-cache" }).then(function (response) {
    if (response && response.ok && response.type === "basic") {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
    }
    return response;
  }).catch(function () {
    return caches.match(request, { ignoreSearch: true }).then(function (hit) {
      return hit || (request.mode === "navigate" ? caches.match("index.html") : Response.error());
    });
  }));
});
