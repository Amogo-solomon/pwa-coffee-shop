document.addEventListener('DOMContentLoaded', function() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalPriceElement = document.querySelector('.total-price');
  
    // Initialize total price
    let totalPrice = 0;
  
    // Open a connection to the IndexedDB database
    const request = indexedDB.open('coffee-shop-db', 1);
  
    request.onerror = function(event) {
        console.error('Failed to open IndexedDB:', event.target.error);
    };
  
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['cartItems'], 'readwrite');
        const objectStore = transaction.objectStore('cartItems');
  
        // Retrieve all cart items from the object store
        const getRequest = objectStore.getAll();
  
        getRequest.onsuccess = function(event) {
            const cartItems = event.target.result;
  
            // Display each cart item
            cartItems.forEach(item => {
                displayCartItem(item);
                totalPrice += item.price;
            });
  
            // Display total price
            totalPriceElement.textContent = `Total: $${totalPrice.toFixed(2)}`;
        };
  
        getRequest.onerror = function(event) {
            console.error('Error retrieving cart items:', event.target.error);
        };
    };
  
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
  
        // Create the cartItems object store
      const cartItemsStore =  db.createObjectStore('cartItems', { keyPath: 'name' });
  
      
  
    // WORKING ON CHECKOUT SUBMISSION TO INDEXDB
  // Create the checkoutData object Stor
   const checkoutDataStore =  db.createObjectStore('checkoutData', {autoIncrement: true});
  };
    //Add event listener for submitting the order
    document.getElementById('submit-order').addEventListener('click', function(event) {
      event.preventDefault();
  
      // Retrieve form data
      const formData = {
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          address: document.getElementById('address').value,
          phoneNumber: document.getElementById('phone-number').value,
      };
  
         // Retrieve cart items
    const cartItems = [];
    document.querySelectorAll('.cart-item').forEach(item => {
        const itemName = item.querySelector('h3').textContent;
        const itemPrice = parseFloat(item.querySelector('.price').textContent.replace('$', ''));
        cartItems.push({ name: itemName, price: itemPrice });
    });

      // Retrieve total price
    const totalPrice = parseFloat(document.querySelector('.total-price').textContent.replace('Total: $', ''));

    // Combine form data, cart items, and total price
    const orderData = {
        formData: formData,
        cartItems: cartItems,
        totalPrice: totalPrice
    };
      // Open a connection to the IndexDB database
      const request = indexedDB.open('coffee-shop-db', 1);
  
      request.onerror = function(event) {
          console.error('Failed to open IndexDB:', event.target.error);
      };
  
      request.onsuccess = function(event) {
          const db = event.target.result;
          const transaction = db.transaction(['checkoutData'], 'readwrite');
          const objectStore = transaction.objectStore('checkoutData');
  
          // Store the form data in the IndexDB database
          /* const addRequest = objectStore.add(formData); */
          // Store the order data in the IndexDB database
        const addRequest = objectStore.add(orderData);
  
          addRequest.onsuccess = function(event) {
           /*    console.log('Form data submitted successfully:', formData); */
              console.log('Order data submitted successfully:', orderData);
              // Commit the transaction
              transaction.oncomplete = function(event) {
                  console.log('Transaction completed');
                  //Optionally, trigger a background sync after transaction completion
              triggerBackgroundSync();
              };
              
          };
  
          addRequest.onerror = function(event) {
              console.error('Failed to submit form data:', event.target.error);
          };
      };
  
      request.onupgradeneeded = function(event) {
          const db = event.target.result;
          
      };
    })
  
  });
  
  // Function to trigger background sync
  function triggerBackgroundSync() {
    if ('SyncManager' in window) {
        navigator.serviceWorker.ready.then(function(registration) {
            return registration.sync.register('checkoutDataSync');
        }).catch(function(err) {
            console.error('Background sync registration failed:', err);
        });
    }
  }
  
  // Function to display the cart item
  function displayCartItem(item) {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartItemHTML = `
        <div class="cart-item">
            <span class="fas fa-times" onclick="removeCartItem('${item.name}')"></span>
            <div class="content">
                <h3>${item.name}</h3>
                <div class="price">$${item.price.toFixed(2)}</div>
            </div>
        </div>
    `;
    cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
  }
  
  // Function to add an item to the cart
  function addToCart(productName, productPrice) {
    const request = indexedDB.open('coffee-shop-db', 1);
  
    request.onerror = function(event) {
        console.error('Failed to open IndexedDB:', event.target.error);
    };
  
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['cartItems'], 'readwrite');
        const objectStore = transaction.objectStore('cartItems');
  
        // Check if the item is already in the cart
        const getRequest = objectStore.get(productName);
  
        getRequest.onsuccess = function(event) {
            const existingItem = event.target.result;
  
            if (existingItem) {
                // Update the quantity of the existing item
                existingItem.quantity += 1;
                const updateRequest = objectStore.put(existingItem);
  
                updateRequest.onsuccess = function(event) {
                    console.log('Item quantity updated in cart:', existingItem.name);
                };
  
                updateRequest.onerror = function(event) {
                    console.error('Failed to update item quantity in cart:', event.target.error);
                };
            } else {
                // Add the new item to the cart
                const newItem = { name: productName, price: productPrice, quantity: 1 };
                const addRequest = objectStore.add(newItem);
  
                addRequest.onsuccess = function(event) {
                    console.log('Item added to cart:', newItem.name);
                    // Display the item in the cart
                    displayCartItem(newItem);
                };
  
                addRequest.onerror = function(event) {
                    console.error('Failed to add item to cart:', event.target.error);
                };
            }
        };
    };
  }
  
  // Function to remove an item from the cart
  function removeCartItem(itemName) {
    const request = indexedDB.open('coffee-shop-db', 1);
  
    request.onerror = function(event) {
        console.error('Failed to open IndexedDB:', event.target.error);
    };
  
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['cartItems'], 'readwrite');
        const objectStore = transaction.objectStore('cartItems');
  
        // Find the item in the object store by name
        const deleteRequest = objectStore.delete(itemName);
  
        deleteRequest.onsuccess = function() {
            console.log('Item removed from cart:', itemName);
            // Refresh the page to reflect the changes
            location.reload();
        };
  
        deleteRequest.onerror = function() {
            console.error('Failed to remove item from cart:', itemName);
        };
    };
  }
  
  // Add event listeners for menu buttons
  document.querySelectorAll('.menu .btn').forEach(button => {
    button.addEventListener('click', function(event) {
        const product = event.target.closest('.box');
        const productName = product.querySelector('h3').textContent;
        const productPrice = parseFloat(product.querySelector('.price').textContent.replace('$', ''));
  
        // Add the selected item to the cart
        addToCart(productName, productPrice);
    });
  });
  
  // Add event listeners for search and cart buttons
  document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const searchForm = document.querySelector('.search-form');
    const cartItemContainer = document.querySelector('.cart-items-container');
  
    document.querySelector('#menu-btn').onclick = () => {
        navbar.classList.toggle('active');
        searchForm.classList.remove('active');
        cartItemContainer.classList.remove('active');
    };
  
    document.querySelector('#search-btn').onclick = () => {
        searchForm.classList.toggle('active');
        navbar.classList.remove('active');
        cartItemContainer.classList.remove('active');
    };
  
    document.querySelector('#cart-btn').onclick = () => {
        cartItemContainer.classList.toggle('active');
        navbar.classList.remove('active');
        searchForm.classList.remove('active');
    };
  
    window.onscroll = () => {
        navbar.classList.remove('active');
        searchForm.classList.remove('active');
        cartItemContainer.classList.remove('active');
    };
  });
  
  // Request permission for push notifications
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
            console.log('Notification permission granted');
            // Subscribe to push notifications
            subscribeToPushNotifications();
        } else {
            console.warn('Notification permission denied');
        }
    });
  }
  
  // Function to subscribe to push notifications
  function subscribeToPushNotifications() {
    navigator.serviceWorker.ready.then(function(registration) {
        registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BFgxZbP36JNCyaRVWmyQ0pl_M_cPA1QLzBSlvLV9faQQ_38zx9S_TBAHrhLuMGtDtIR2KcI8uNNm5uUqTlGU5cY')
        }).then(function(subscription) {
            console.log('Push notification subscription successful:', subscription);
            // Send the subscription details to your server for further processing
            sendSubscriptionToServer(subscription);
        }).catch(function(error) {
            console.error('Push notification subscription failed:', error);
        });
    });
  }
  
  // Function to convert base64 string to Uint8Array
  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  // Function to send subscription details to server
  function sendSubscriptionToServer(subscription) {
    // Send the subscription details to your server using fetch or any other method
    fetch('/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    }).then(function(response) {
        console.log('Subscription details sent to server:', response);
    }).catch(function(error) {
        console.error('Failed to send subscription details to server:', error);
    });
  }
  