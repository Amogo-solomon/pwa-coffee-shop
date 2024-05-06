// Define the cache name and the assets to cache
const CACHE_NAME = 'coffee-shop-cache-v2'; // Increment version number
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    'offline.html',
    'images',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
];

// Install the service worker
self.addEventListener('install', event => {
    // Wait until the installation is finished before completing the installation process
    event.waitUntil(
        // Open the cache storage specified by CACHE_NAME
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache)) // Add all specified assets to the cache
            .catch(error => {
                // Log an error message if caching fails
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate the service worker
self.addEventListener('activate', event => {
    // Wait until the activation is finished before completing the activation process
    event.waitUntil(
        // Retrieve all cache storage keys
        caches.keys().then(cacheNames => {
            return Promise.all(
                // Iterate through each cache storage key
                cacheNames.filter(cacheName => {
                    // Delete any cache storage that starts with 'coffee-shop-cache' but is not the current CACHE_NAME
                    return cacheName.startsWith('coffee-shop-cache') && cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    // Delete the cache storage
                    return caches.delete(cacheName);
                })
            );
        }).catch(error => {
            // Log an error message if cache activation fails
            console.error('Cache activation failed:', error);
        })
    );
});

// Fetch resources from cache or network
self.addEventListener('fetch', event => {
    // Respond to fetch requests
    event.respondWith(
        // Attempt to find the requested resource in the cache
        caches.match(event.request)
            .then(response => {
                // Cache hit - return the cached response
                if (response) {
                    return response;
                }

                // Clone the request to ensure it's safe to read when responding
                const fetchRequest = event.request.clone();

                // Fetch the resource from the network
                return fetch(fetchRequest)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            // If not, respond with the offline page
                            return caches.match('offline.html');
                        }

                        // Clone the response to ensure it's safe to read when caching
                        const responseToCache = response.clone();

                        // Open the cache storage specified by CACHE_NAME
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Cache the fetched response for future use
                                cache.put(event.request, responseToCache);
                            });

                        // Return the fetched response
                        return response;
                    })
                    .catch(() => {
                        // If fetching fails, respond with the offline page
                        return caches.match('offline.html');
                    });
            })
            .catch(error => {
                // Log an error message if fetch request fails
                console.error('Fetch request failed:', error);
            })
    );
});
