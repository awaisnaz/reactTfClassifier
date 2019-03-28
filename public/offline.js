/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.1.1/workbox-sw.js');

const { strategies, backgroundSync, cacheableResponse } = workbox;
const publicUrl = `http`;//`${self.location.origin}`;
console.log(`public url: ${publicUrl}`)
const bgSyncPlugin = new backgroundSync.Plugin('MLAppFetchQueue', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
});
const strategyToApply = new strategies.StaleWhileRevalidate({
  cacheName: 'MLAppCache',
  plugins:[
    bgSyncPlugin,
    // cacheableResponse.Plugin({
    //   statuses: [0,200]
    // })
  ]
});

workbox.core.skipWaiting();

workbox.core.clientsClaim();

workbox.routing.registerRoute(
  new RegExp(`${publicUrl}`,'i'),
  strategyToApply
);

self.addEventListener('fetch', (event) => {
  event.respondWith(strategyToApply.makeRequest({request: event.request}));
});