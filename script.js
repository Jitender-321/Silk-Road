// Global variables
let items = [];
let filteredItems = [];
let currentSearchTerm = '';
let lastItemCount = 0;
let isPageVisible = true;

// Enhanced initialization with performance optimizations
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth page transitions
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });
    
    setupFormSubmission();
    setupSearch();
    loadItems();
    
    // Add enhanced interactions
    setupAdvancedFeatures();
    setupKeyboardShortcuts();
    setupAnimationObserver();
});

// Page visibility API for efficient refreshing
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
        // Refresh immediately when page becomes visible
        performSmartRefresh();
    }
});

// Setup form submission handler with enhanced features
function setupFormSubmission() {
    const form = document.getElementById('add-item-form');
    
    if (!form) {
        console.error('Form not found! Check HTML structure.');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted');
        
        try {
            showLoading(true);
            hideError();
            
            // Get form elements with validation
            const sellerInput = document.getElementById('seller-name');
            const titleInput = document.getElementById('item-title');
            const descInput = document.getElementById('item-description');
            const priceInput = document.getElementById('item-price');
            const locationInput = document.getElementById('item-location');
            const meetingInput = document.getElementById('meeting-time');
            
            if (!sellerInput || !titleInput || !descInput || !priceInput || !locationInput || !meetingInput) {
                throw new Error('Form elements not found. Check HTML structure.');
            }
            
            const itemData = {
                seller: sellerInput.value.trim(),
                title: titleInput.value.trim(),
                description: descInput.value.trim(),
                price: parseFloat(priceInput.value),
                location: locationInput.value.trim(),
                meetingTime: meetingInput.value.trim()
            };
            
            console.log('Form data:', itemData);
            
            // Validate item data
            if (!validateItemData(itemData)) {
                return;
            }
            
            // Handle image upload
            const imageFile = document.getElementById('item-image').files[0];
            if (imageFile) {
                if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
                    throw new Error('Image size must be less than 5MB');
                }
                itemData.image = await convertImageToBase64(imageFile);
            }
            
            const result = await submitItem(itemData);
            console.log('Item submitted successfully:', result);
            
            showEnhancedNotification('Item added successfully! Your listing is now live.', 'success');
            
            // Clear the form with animation
            form.reset();
            
            // Add subtle form reset animation
            const formInputs = form.querySelectorAll('input, textarea, select');
            formInputs.forEach((input, index) => {
                setTimeout(() => {
                    input.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        input.style.transform = 'scale(1)';
                    }, 100);
                }, index * 50);
            });
            
            // Refresh the items display
            loadItems();
            
        } catch (error) {
            console.error('Error adding item:', error);
            showEnhancedNotification(
                `Failed to add item: ${error.message}. Please try again.`, 
                'error'
            );
        } finally {
            showLoading(false);
        }
    });
}

// Validate item data
function validateItemData(itemData) {
    console.log('Validating item data:', itemData);
    
    if (!itemData.seller || itemData.seller.length < 2) {
        showEnhancedNotification('Seller name must be at least 2 characters long.', 'error');
        return false;
    }
    
    if (!itemData.title || itemData.title.length < 3) {
        showEnhancedNotification('Item title must be at least 3 characters long.', 'error');
        return false;
    }
    
    if (!itemData.description || itemData.description.length < 10) {
        showEnhancedNotification('Description must be at least 10 characters long.', 'error');
        return false;
    }
    
    if (isNaN(itemData.price) || itemData.price <= 0) {
        showEnhancedNotification('Please enter a valid price greater than £0.', 'error');
        return false;
    }
    
    if (!itemData.location || itemData.location.length < 3) {
        showEnhancedNotification('Location must be at least 3 characters long.', 'error');
        return false;
    }
    
    if (!itemData.meetingTime || itemData.meetingTime.length < 3) {
        showEnhancedNotification('Please specify when you are available to meet.', 'error');
        return false;
    }
    
    console.log('Validation passed');
    return true;
}

// Convert image to base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

// Submit item to server
async function submitItem(itemData) {
    console.log('Submitting to server:', itemData);
    
    const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemData)
    });
    
    console.log('Server response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(errorText || 'Failed to add item');
    }
    
    const newItem = await response.json();
    console.log('Server returned:', newItem);
    return newItem;
}

// Load items from server
async function loadItems() {
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch('/api/items');
        
        if (!response.ok) {
            throw new Error('Failed to load items');
        }
        
        items = await response.json();
        lastItemCount = items.length;
        filteredItems = [...items];
        
        // Apply current search and sort
        performSearch();
        
    } catch (error) {
        console.error('Error loading items:', error);
        showEnhancedNotification(
            '❌ Failed to load items. Please check your connection and refresh the page.', 
            'error'
        );
    } finally {
        showLoading(false);
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const clearSearchBtn = document.getElementById('clear-search');
    
    // Search input handler
    searchInput.addEventListener('input', function() {
        currentSearchTerm = this.value.toLowerCase().trim();
        performSearch();
        updateClearButton();
    });
    
    // Sort select handler
    sortSelect.addEventListener('change', function() {
        performSearch();
    });
    
    // Clear search button
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentSearchTerm = '';
        performSearch();
        updateClearButton();
        searchInput.focus();
    });
}

// Update clear button visibility
function updateClearButton() {
    const clearBtn = document.getElementById('clear-search');
    if (currentSearchTerm) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
}

// Perform search and sort
function performSearch() {
    // Filter items based on search term
    if (!currentSearchTerm) {
        filteredItems = [...items];
    } else {
        filteredItems = items.filter(item => {
            const searchableText = [
                item.title,
                item.description,
                item.location,
                item.seller,
                item.meetingTime || ''
            ].join(' ').toLowerCase();
            
            return searchableText.includes(currentSearchTerm);
        });
    }
    
    // Apply sorting
    applySorting();
    
    // Update display
    updateSearchResults();
    displayItems();
}

// Apply sorting to filtered items
function applySorting() {
    const sortBy = document.getElementById('sort-select').value;
    filteredItems = sortItems(filteredItems, sortBy);
}

// Sort items array
function sortItems(itemsArray, sortBy) {
    const sorted = [...itemsArray];
    
    switch (sortBy) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        case 'oldest':
            return sorted.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        default:
            return sorted;
    }
}

// Update search results info
function updateSearchResults() {
    const resultsDiv = document.getElementById('search-results');
    if (!resultsDiv) return;
    
    if (currentSearchTerm) {
        resultsDiv.innerHTML = `Found ${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''} matching "${currentSearchTerm}"`;
        resultsDiv.style.display = 'block';
    } else {
        resultsDiv.style.display = 'none';
    }
}

// Enhanced display items with animations
function displayItems() {
    const itemsContainer = document.getElementById('items-container');
    
    if (filteredItems.length === 0) {
        itemsContainer.innerHTML = `
            <div class="no-items fade-in">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🏪</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">No items found</div>
                <div>Be the first to list something amazing!</div>
            </div>`;
        return;
    }
    
    // Enhanced display with staggered animations
    itemsContainer.innerHTML = filteredItems.map((item, index) => {
        const card = createItemCard(item);
        return `<div class="fade-in" style="animation-delay: ${index * 0.1}s">${card}</div>`;
    }).join('');
    
    // Add intersection observer for scroll animations
    observeItemCards();
}

// Create enhanced item card
function createItemCard(item) {
    const timeAgo = getTimeAgo(new Date(item.dateAdded));
    const formattedPrice = formatPrice(item.price);
    
    return `
        <div class="item-card" data-item-id="${item.id}">
            ${item.image ? `
                <div class="item-image-container" style="
                    position: relative; 
                    overflow: hidden; 
                    border-radius: 12px; 
                    margin-bottom: 1rem;
                    height: 200px;
                ">
                    <img src="${item.image}" 
                         alt="${escapeHtml(item.title)}" 
                         class="item-image"
                         style="
                            width: 100%; 
                            height: 100%; 
                            object-fit: cover; 
                            transition: transform 0.4s ease;
                         "
                         onmouseover="this.style.transform='scale(1.05)'"
                         onmouseout="this.style.transform='scale(1)'">
                    <div style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 15px;
                        font-size: 0.8rem;
                        font-weight: 600;
                    ">${formattedPrice}</div>
                </div>
            ` : `
                <div style="
                    height: 120px;
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                    color: #666;
                    font-size: 2rem;
                ">📦</div>
            `}
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
                <h3 class="item-title" style="margin: 0; color: #2c3e50; font-size: 1.3rem; font-weight: 700;">${escapeHtml(item.title)}</h3>
                ${!item.image ? `<span class="item-price" style="color: #3498db; font-weight: 700; font-size: 1.2rem;">${formattedPrice}</span>` : ''}
            </div>
            
            <p class="item-description" style="
                color: #666; 
                line-height: 1.6; 
                margin-bottom: 1.2rem;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
            ">${escapeHtml(item.description)}</p>
            
            <div class="item-details" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="item-detail" style="display: flex; align-items: center; gap: 8px;">
                    <span class="icon">📍</span>
                    <span style="color: #2c3e50; font-weight: 600;">${escapeHtml(item.location)}</span>
                </div>
                
                <div class="item-detail" style="display: flex; align-items: center; gap: 8px;">
                    <span class="icon">👤</span>
                    <span style="color: #2c3e50;">${escapeHtml(item.seller)}</span>
                    <span style="color: #999; font-size: 0.9rem; margin-left: auto;">${timeAgo}</span>
                </div>
                
                ${item.meetingTime ? `
                    <div class="meeting-time" style="margin-top: 1rem;">
                        <span style="margin-right: 8px;">⏰</span>
                        Available to meet: ${escapeHtml(item.meetingTime)}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Format price in British pounds
function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(price);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get relative time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
    });
}

// Show/hide loading indicator
function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
}

// Enhanced notification system
function showSuccess(message) {
    showEnhancedNotification(message, 'success');
}

function showError(message) {
    showEnhancedNotification(message, 'error');
}

function showEnhancedNotification(message, type = 'success') {
    // Remove any existing messages of the same type
    const existingMessage = document.querySelector(`.${type}-message`);
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message slide-up`;
    messageDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2em;">${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        </div>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Enhanced auto-hide with fade out
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.transition = 'all 0.5s ease-out';
            messageDiv.style.transform = 'translateX(100%)';
            messageDiv.style.opacity = '0';
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 500);
        }
    }, type === 'success' ? 4000 : 6000);
}

function hideError() {
    const existingError = document.querySelector('.error-message');
    const existingSuccess = document.querySelector('.success-message');
    if (existingError) existingError.remove();
    if (existingSuccess) existingSuccess.remove();
}

// Smart refresh functionality
function performSmartRefresh() {
    if (!isPageVisible) return;
    
    fetch('/api/items')
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(serverItems => {
            const newItemsCount = serverItems.length - lastItemCount;
            
            if (newItemsCount > 0) {
                items = serverItems;
                lastItemCount = serverItems.length;
                performSearch();
                
                // Enhanced notification with animation
                showEnhancedNotification(
                    `🎉 ${newItemsCount} new item${newItemsCount > 1 ? 's' : ''} just listed!`,
                    'success'
                );
                
                // Add subtle animation to new items
                setTimeout(() => {
                    const itemCards = document.querySelectorAll('.item-card');
                    itemCards.forEach((card, index) => {
                        if (index >= itemCards.length - newItemsCount) {
                            card.classList.add('fade-in');
                        }
                    });
                }, 100);
            } else if (serverItems.length !== items.length) {
                items = serverItems;
                lastItemCount = serverItems.length;
                performSearch();
            }
        })
        .catch(() => {
            // Silent fail for background updates
            console.log('Background refresh failed');
        });
}

// Smart refresh interval - more frequent when page is active
setInterval(performSmartRefresh, isPageVisible ? 20000 : 60000);

// Advanced features setup
function setupAdvancedFeatures() {
    // Add hover effects to form inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
    
    // Add click ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255,255,255,0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.pointerEvents = 'none';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
    });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('search-input');
            if (searchInput && searchInput === document.activeElement) {
                searchInput.value = '';
                currentSearchTerm = '';
                performSearch();
                updateClearButton();
                searchInput.blur();
            }
        }
    });
}

// Animation observer for scroll-triggered animations
function setupAnimationObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-up');
            }
        });
    }, { threshold: 0.1 });
    
    // Observe elements as they're added
    window.observeItemCards = function() {
        const cards = document.querySelectorAll('.item-card');
        cards.forEach(card => observer.observe(card));
    };
}

// Handle form validation on input
document.addEventListener('input', function(e) {
    const form = document.getElementById('add-item-form');
    if (e.target.form === form) {
        // Clear previous error when user starts typing
        hideError();
    }
});
