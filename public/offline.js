/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.1.1/workbox-sw.js');

const { strategies, backgroundSync } = workbox;
const publicUrl = self.URL;
const bgSyncPlugin = new backgroundSync.Plugin('MLAppFetchQueue', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
});
const strategyToApply = new strategies.StaleWhileRevalidate({
  cacheName: 'MLAppCache',
  plugins:[bgSyncPlugin]
});

workbox.core.skipWaiting();

workbox.core.clientsClaim();

workbox.routing.registerRoute(
  new RegExp(`^${publicUrl}`),
  strategyToApply
);

self.addEventListener('fetch', (event) => {
  event.respondWith(strategyToApply.makeRequest({request: event.request}));
});