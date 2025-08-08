(function() {
  console.log('Amazon Minimalist: Content script loaded');

  // Check if we're on the Amazon UK homepage
  const isAmazonHomepage = () => {
    const isRootPath = window.location.pathname === '/';
    const isNavLogoPath = window.location.pathname === '/ref=nav_logo';
    const isAmazonDomain = window.location.hostname === 'www.amazon.co.uk' || 
                          window.location.hostname === 'amazon.co.uk';
    
    return isAmazonDomain && (isRootPath || isNavLogoPath);
  };

  // Add a style to hide Amazon content immediately while our interface loads
  // but ONLY on the Amazon homepage
  if (isAmazonHomepage()) {
    const hideAmazonStyle = document.createElement('style');
    hideAmazonStyle.id = 'amazon-minimalist-hide-style';
    hideAmazonStyle.textContent = `
      html, body {
        visibility: hidden !important;
        opacity: 0 !important;
        transition: opacity 0.2s ease !important;
      }
      
      body.minimalist-ready, html.minimalist-ready {
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    
    // Add the style as early as possible
    if (document.documentElement) {
      document.documentElement.appendChild(hideAmazonStyle);
    } else {
      // If document not ready, add as soon as it is
      const observer = new MutationObserver(() => {
        if (document.documentElement) {
          document.documentElement.appendChild(hideAmazonStyle);
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    }
  }

  // Get dark mode preference from localStorage or system preference
  const isDarkMode = () => {
    const storedPreference = localStorage.getItem('amazon-minimalist-dark-mode');
    if (storedPreference !== null) {
      return storedPreference === 'true';
    }
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const darkModeEnabled = !isDarkMode();
    localStorage.setItem('amazon-minimalist-dark-mode', darkModeEnabled.toString());
    applyTheme(darkModeEnabled);
    return darkModeEnabled;
  };

  // Apply theme based on dark mode setting
  const applyTheme = (darkMode) => {
    const container = document.getElementById('minimalist-amazon-container');
    if (!container) return;
    
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // Check if the interface is disabled
  const isMinimalistDisabled = async () => {
    return new Promise(resolve => {
      chrome.storage.local.get('minimalistDisabled', (result) => {
        // First check Chrome storage
        if (result.minimalistDisabled === true) {
          console.log('Amazon Minimalist: Disabled via extension storage');
          resolve(true);
          return;
        }
        
        // Then check localStorage (for backwards compatibility)
        if (localStorage.getItem('amazon-minimalist-disabled') === 'true') {
          console.log('Amazon Minimalist: Disabled by user preference in localStorage');
          // Also update Chrome storage to match
          chrome.storage.local.set({ minimalistDisabled: true });
          resolve(true);
          return;
        }
        
        resolve(false);
      });
    });
  };

  // Create our minimalist interface
  const createMinimalistInterface = async () => {
    // Only apply on the homepage
    if (!isAmazonHomepage()) {
      console.log('Amazon Minimalist: Not on homepage, skipping');
      if (document.getElementById('amazon-minimalist-hide-style')) {
        document.getElementById('amazon-minimalist-hide-style').remove();
        document.documentElement.classList.add('minimalist-ready');
        document.body.classList.add('minimalist-ready');
      }
      return;
    }

    console.log('Amazon Minimalist: Creating interface');

    // Don't reapply if our interface is already active
    if (document.getElementById('minimalist-amazon-container')) {
      console.log('Amazon Minimalist: Interface already applied');
      return;
    }

    // Check if user has disabled the minimalist interface
    if (await isMinimalistDisabled()) {
      if (document.getElementById('amazon-minimalist-hide-style')) {
        document.getElementById('amazon-minimalist-hide-style').remove();
        document.documentElement.classList.add('minimalist-ready');
        document.body.classList.add('minimalist-ready');
      }
      return;
    }

    // Get dark mode setting
    const darkMode = isDarkMode();

    // Clear existing content and add homepage class
    document.body.innerHTML = '';
    document.body.classList.add('amazon-minimalist-homepage');
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }

    // Create container
    const container = document.createElement('div');
    container.id = 'minimalist-amazon-container';

    // Create logo
    const logoContainer = document.createElement('div');
    logoContainer.id = 'amazon-logo-container';

    // Create Amazon logo using the local image
    // Make it a clickable element that reloads the homepage with our interface
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.id = 'amazon-logo-link';
    logoLink.addEventListener('click', (e) => {
      // Prevent default navigation which would load the original Amazon interface
      e.preventDefault();
      // Instead reload the page through our extension to maintain our interface
      window.location.href = '/';
    });
    
    // Use the local logo image
    const logoImg = document.createElement('img');
    logoImg.id = 'amazon-minimalist-logo';
    logoImg.src = chrome.runtime.getURL('amazon_homepage.png');
    logoImg.alt = 'Amazon';
    logoImg.style.cursor = 'pointer';
    logoImg.style.maxHeight = '120px'; // Much larger logo size
    logoImg.style.width = 'auto';
    
    // Create a logo background container for better contrast
    const logoBg = document.createElement('div');
    logoBg.id = 'amazon-logo-background';
    logoBg.className = darkMode ? 'dark' : '';
    logoBg.appendChild(logoImg);

    logoLink.appendChild(logoBg);
    logoContainer.appendChild(logoLink);

    // Create search form
    const searchForm = document.createElement('form');
    searchForm.id = 'minimalist-search-form';
    searchForm.action = '/s';
    searchForm.method = 'get';
    
    searchForm.addEventListener('submit', () => {
      // Remove our hiding style before form submission
      const style = document.getElementById('amazon-minimalist-hide-style');
      if (style) style.remove();
      
      // Make sure body and html are visible
      document.documentElement.classList.add('minimalist-ready');
      document.body.classList.add('minimalist-ready');
      
      // Let the form submit and Amazon handle the search
      return true;
    });

    // Create the search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.name = 'k';  // Amazon's search parameter
    searchInput.id = 'minimalist-search-input';
    searchInput.placeholder = 'Search Amazon';
    searchInput.autocomplete = 'off';
    searchInput.autofocus = true;

    searchForm.appendChild(searchInput);

    // Create quick access links container
    const linksContainer = document.createElement('div');
    linksContainer.id = 'quick-access-links';
    
    // Create Order History link
    const orderHistoryLink = createQuickAccessLink(
      'Order History', 
      'https://www.amazon.co.uk/gp/css/order-history',
      darkMode
    );
    
    // Create Buy Again link
    const buyAgainLink = createQuickAccessLink(
      'Buy Again', 
      'https://www.amazon.co.uk/buyagain',
      darkMode
    );
    
    // Create Wish List link
    const wishListLink = createQuickAccessLink(
      'Wish List', 
      'https://www.amazon.co.uk/hz/wishlist/ls',
      darkMode
    );

    // Add links to container
    linksContainer.appendChild(orderHistoryLink);
    linksContainer.appendChild(document.createTextNode(' · '));
    linksContainer.appendChild(buyAgainLink);
    linksContainer.appendChild(document.createTextNode(' · '));
    linksContainer.appendChild(wishListLink);

    // Add theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.id = 'theme-toggle';
    themeToggle.innerHTML = darkMode ? '☀️' : '🌙';
    themeToggle.title = darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    themeToggle.onclick = (e) => {
      e.preventDefault();
      const isDark = toggleDarkMode();
      themeToggle.innerHTML = isDark ? '☀️' : '🌙';
      themeToggle.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      document.body.style.backgroundColor = isDark ? '#1E1E1E' : '#F7F7F7';
      
      // Update logo background for dark/light mode
      const logoBg = document.getElementById('amazon-logo-background');
      if (logoBg) {
        if (isDark) {
          logoBg.classList.add('dark');
        } else {
          logoBg.classList.remove('dark');
        }
      }
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      
      // Update link colors for dark/light mode
      const links = document.querySelectorAll('.quick-access-link');
      links.forEach(link => {
        if (isDark) {
          link.classList.add('dark');
        } else {
          link.classList.remove('dark');
        }
      });
      
      // Force a repaint to fix any rendering issues
      const container = document.getElementById('minimalist-amazon-container');
      if (container) {
        container.style.display = 'none';
        setTimeout(() => { container.style.display = 'flex'; }, 10);
      }
    };

    // Add footer with links
    const footer = document.createElement('div');
    footer.id = 'minimalist-footer';

    const restoreLink = document.createElement('a');
    restoreLink.href = '#';
    restoreLink.textContent = 'Restore Original Amazon';
    restoreLink.onclick = (e) => {
      e.preventDefault();
      // Update both storage mechanisms
      localStorage.setItem('amazon-minimalist-disabled', 'true');
      chrome.storage.local.set({ minimalistDisabled: true }, () => {
        window.location.reload();
      });
    };

    footer.appendChild(restoreLink);
    footer.appendChild(document.createTextNode(' | '));
    footer.appendChild(themeToggle);

    // Assemble the page
    container.appendChild(logoContainer);
    container.appendChild(searchForm);
    container.appendChild(linksContainer);
    container.appendChild(footer);
    document.body.appendChild(container);

    // Remove the hiding style and show our interface
    if (document.getElementById('amazon-minimalist-hide-style')) {
      document.getElementById('amazon-minimalist-hide-style').remove();
    }
    
    document.documentElement.classList.add('minimalist-ready');
    document.body.classList.add('minimalist-ready');

    // Focus on the search input
    searchInput.focus();

    console.log('Amazon Minimalist: Interface applied successfully');
  };

  // Helper function to create minimal quick access links
  function createQuickAccessLink(title, url, isDarkMode) {
    const link = document.createElement('a');
    link.href = url;
    link.className = 'quick-access-link';
    if (isDarkMode) {
      link.classList.add('dark');
    }
    
    link.textContent = title;
    
    return link;
  }

  // Function to apply filters to search results
  const applyFilters = () => {
    if (!window.location.pathname.includes('/s')) return; // Only apply on search results pages
    
    const filtersEnabled = localStorage.getItem('amazon-filters-enabled') !== 'false'; // Default to enabled
    
    // If filters are disabled, show all products and return
    if (!filtersEnabled) {
      const allProducts = document.querySelectorAll('[data-filtered="true"]');
      allProducts.forEach(product => {
        product.style.display = '';
        product.removeAttribute('data-filtered');
      });
      addFilterStatusIndicator(false, 0, 0);
      return;
    }
    
    const hideSponsored = localStorage.getItem('amazon-hide-sponsored') === 'true';
    const minRating = parseFloat(localStorage.getItem('amazon-min-rating') || '0');
    const minReviews = parseInt(localStorage.getItem('amazon-min-reviews') || '0');
    
    // Find all product containers - updated selectors based on real Amazon structure
    // Use more specific selectors to avoid catching pagination and other UI elements
    const productSelectors = [
      '[data-component-type="s-search-result"]',
      '[data-asin]:not([data-asin=""]):not(.s-pagination-container):not(.s-pagination-item)',
      '.s-result-item:not(.s-pagination-item)',
      '.AdHolder'
    ];
    
    const uniqueProducts = [];
    const seenProducts = new Set();
    
    productSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(product => {
        // Extra safety: exclude pagination elements and their children
        const isPagination = product.closest('.s-pagination-container') ||
                            product.classList.contains('s-pagination-item') ||
                            product.querySelector('.s-pagination-container') ||
                            product.querySelector('[cel_widget_id*="PAGINATION"]') ||
                            (product.getAttribute('cel_widget_id') || '').includes('PAGINATION');
        
        if (!isPagination && !seenProducts.has(product)) {
          uniqueProducts.push(product);
          seenProducts.add(product);
        }
      });
    });
    
    uniqueProducts.forEach(product => {
      let shouldHide = false;
      
      // Check for sponsored products
      if (hideSponsored) {
        // Enhanced sponsored detection based on real Amazon HTML
        const isSponsored = 
          // Direct class indicators
          product.classList.contains('AdHolder') ||
          product.classList.contains('s-sponsored-list-item') ||
          // Data attributes
          product.hasAttribute('data-sponsored') ||
          (product.getAttribute('data-component-type') || '').includes('sponsored') ||
          // Look for sponsored text content
          product.textContent.toLowerCase().includes('sponsored') ||
          // Look for impression logger with sponsored tracking
          product.querySelector('[data-component-type="s-impression-logger"]') &&
          product.querySelector('[data-component-props*="SponsoredProducts"]') ||
          // Check for sponsored label elements
          product.querySelector('.s-sponsored-label') ||
          product.querySelector('[aria-label*="sponsored" i]') ||
          // Look for sponsored in URLs
          Array.from(product.querySelectorAll('a')).some(a => 
            (a.href || '').includes('sponsored') || 
            (a.href || '').includes('SponsoredProducts')
          );
        
        if (isSponsored) {
          shouldHide = true;
        }
      }
      
      // Check rating
      if (minRating > 0 && !shouldHide) {
        // Updated selectors based on real Amazon structure
        const ratingSelectors = [
          '.a-icon-alt',
          '[aria-label*="stars"]',
          '[aria-label*="out of 5"]',
          '.a-offscreen',
          '[data-cy="reviews-ratings-slot"] .a-icon-alt'
        ];
        
        let foundRating = false;
        for (const selector of ratingSelectors) {
          const elements = product.querySelectorAll(selector);
          for (const element of elements) {
            const ratingText = element.textContent || element.getAttribute('aria-label') || '';
            // Match patterns like "4.5 out of 5 stars" or "4.5 stars"
            const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*(?:out of \d+|stars?|\/\d+)/i);
            if (ratingMatch) {
              const rating = parseFloat(ratingMatch[1]);
              if (rating < minRating) {
                shouldHide = true;
              }
              foundRating = true;
              break;
            }
          }
          if (foundRating) break;
        }
        
        // If no rating found, hide if filter is active
        if (!foundRating) {
          shouldHide = true;
        }
      }
      
      // Check review count
      if (minReviews > 0 && !shouldHide) {
        // Enhanced review count detection based on real Amazon structure
        const reviewSelectors = [
          '[aria-label*="ratings"]',  // Primary pattern: aria-label="88,901 ratings"
          '[aria-label*="rating"]',   // Backup: aria-label contains "rating"
          'a[href*="#customerReviews"]', 
          'a[href*="customer-reviews"]',
          '.a-link-normal[href*="customerReviews"]',
          '.a-size-small',            // Often contains abbreviated numbers like (88.9K)
          '.puis-normal-weight-text', // Specific class for review count display
          'span[aria-hidden="true"]'  // Hidden spans often contain formatted numbers
        ];
        
        let foundReviewCount = false;
        for (const selector of reviewSelectors) {
          const elements = product.querySelectorAll(selector);
          for (const element of elements) {
            const reviewText = element.textContent || element.getAttribute('aria-label') || '';
            
            // Multiple regex patterns for review count detection
            const reviewPatterns = [
              // Primary pattern from aria-label="88,901 ratings"
              /(\d+(?:,\d+)*)\s*ratings?/i,
              // Abbreviated formats like "(88.9K)", "(183)", "(1.2M)"
              /\((\d+(?:\.\d+)?[KkMm]?)\)/,
              // Direct number patterns
              /(\d+(?:,\d+)*)\s*reviews?/i,
              /(\d+(?:,\d+)*)\s+bought/i,
              /^(\d+(?:,\d+)*)$/
            ];
            
            for (const pattern of reviewPatterns) {
              const reviewMatch = reviewText.match(pattern);
              if (reviewMatch) {
                let reviewCount = 0;
                const matchStr = reviewMatch[1];
                
                // Handle abbreviated formats (K, M)
                if (matchStr.toLowerCase().includes('k')) {
                  reviewCount = Math.round(parseFloat(matchStr) * 1000);
                } else if (matchStr.toLowerCase().includes('m')) {
                  reviewCount = Math.round(parseFloat(matchStr) * 1000000);
                } else {
                  // Handle comma-separated numbers
                  reviewCount = parseInt(matchStr.replace(/,/g, ''));
                }
                
                if (!isNaN(reviewCount) && reviewCount > 0) {
                  console.log(`Amazon filters: Found review count ${reviewCount} for product (original: "${matchStr}"), minimum required: ${minReviews}`);
                  if (reviewCount < minReviews) {
                    shouldHide = true;
                  }
                  foundReviewCount = true;
                  break;
                }
              }
            }
            if (foundReviewCount) break;
          }
          if (foundReviewCount) break;
        }
        
        // If no review count found, hide if filter is active
        if (!foundReviewCount) {
          console.log('Amazon filters: No review count found, hiding product due to active filter');
          shouldHide = true;
        }
      }
      
      // Apply visibility
      if (shouldHide) {
        product.style.display = 'none';
        product.setAttribute('data-filtered', 'true');
      } else {
        product.style.display = '';
        product.removeAttribute('data-filtered');
      }
    });
    
    // Explicitly ensure pagination is always visible
    const paginationContainer = document.querySelector('.s-pagination-container');
    if (paginationContainer) {
      paginationContainer.style.display = '';
      paginationContainer.removeAttribute('data-filtered');
      console.log('Amazon filters: Ensured pagination container is visible');
    }
    
    // Add filter status indicator
    addFilterStatusIndicator(hideSponsored, minRating, minReviews);
  };

  // Add filter status indicator to search results page
  const addFilterStatusIndicator = (hideSponsored, minRating, minReviews) => {
    let indicator = document.getElementById('filter-status-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'filter-status-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 9999;
        max-width: 250px;
      `;
      document.body.appendChild(indicator);
    }
    
    const filters = [];
    if (hideSponsored) filters.push('Hide Sponsored');
    if (minRating > 0) filters.push(`Min Rating: ${minRating}+`);
    if (minReviews > 0) filters.push(`Min Reviews: ${minReviews}+`);
    
    if (filters.length > 0) {
      indicator.innerHTML = `Active Filters:<br>${filters.join('<br>')}`;
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  };

  // Create filter controls for search results pages
  const createSearchFilters = () => {
    // Create filter controls container
    const filterContainer = document.createElement('div');
    filterContainer.id = 'search-results-filters';
    filterContainer.className = 'search-results-filters';
    
    // Master toggle for all filters
    const masterToggle = document.createElement('label');
    masterToggle.className = 'filter-toggle';
    masterToggle.style.fontWeight = 'bold';
    masterToggle.style.borderBottom = '1px solid #ddd';
    masterToggle.style.paddingBottom = '8px';
    masterToggle.style.marginBottom = '8px';
    const masterCheckbox = document.createElement('input');
    masterCheckbox.type = 'checkbox';
    masterCheckbox.id = 'filters-master-toggle';
    masterCheckbox.checked = localStorage.getItem('amazon-filters-enabled') !== 'false'; // Default to enabled
    const masterLabel = document.createElement('span');
    masterLabel.textContent = 'Enable Filters';
    masterToggle.appendChild(masterCheckbox);
    masterToggle.appendChild(masterLabel);

    // Sponsored products toggle
    const sponsoredToggle = document.createElement('label');
    sponsoredToggle.className = 'filter-toggle';
    const sponsoredCheckbox = document.createElement('input');
    sponsoredCheckbox.type = 'checkbox';
    sponsoredCheckbox.id = 'hide-sponsored-results';
    sponsoredCheckbox.checked = localStorage.getItem('amazon-hide-sponsored') === 'true';
    const sponsoredLabel = document.createElement('span');
    sponsoredLabel.textContent = 'Hide Sponsored';
    sponsoredToggle.appendChild(sponsoredCheckbox);
    sponsoredToggle.appendChild(sponsoredLabel);

    // Rating filter with numeric input
    const ratingFilter = document.createElement('div');
    ratingFilter.className = 'filter-input';
    const ratingLabel = document.createElement('label');
    ratingLabel.textContent = 'Min Rating:';
    ratingLabel.htmlFor = 'rating-filter-results';
    const ratingInput = document.createElement('input');
    ratingInput.type = 'number';
    ratingInput.id = 'rating-filter-results';
    ratingInput.min = '0';
    ratingInput.max = '5';
    ratingInput.step = '0.1';
    ratingInput.placeholder = '0';
    ratingInput.value = localStorage.getItem('amazon-min-rating') || '';
    ratingFilter.appendChild(ratingLabel);
    ratingFilter.appendChild(ratingInput);

    // Review count filter with numeric input
    const reviewCountFilter = document.createElement('div');
    reviewCountFilter.className = 'filter-input';
    const reviewCountLabel = document.createElement('label');
    reviewCountLabel.textContent = 'Min Reviews:';
    reviewCountLabel.htmlFor = 'review-count-filter-results';
    const reviewCountInput = document.createElement('input');
    reviewCountInput.type = 'number';
    reviewCountInput.id = 'review-count-filter-results';
    reviewCountInput.min = '0';
    reviewCountInput.step = '1';
    reviewCountInput.placeholder = '0';
    reviewCountInput.value = localStorage.getItem('amazon-min-reviews') || '';
    reviewCountFilter.appendChild(reviewCountLabel);
    reviewCountFilter.appendChild(reviewCountInput);

    // Save filter settings when changed
    masterCheckbox.addEventListener('change', () => {
      localStorage.setItem('amazon-filters-enabled', masterCheckbox.checked);
      
      // Enable/disable other filter controls
      const controls = [sponsoredCheckbox, ratingInput, reviewCountInput];
      controls.forEach(control => {
        control.disabled = !masterCheckbox.checked;
        control.style.opacity = masterCheckbox.checked ? '1' : '0.5';
      });
      
      // Update labels opacity too
      const labels = [sponsoredToggle, ratingFilter, reviewCountFilter];
      labels.forEach(label => {
        label.style.opacity = masterCheckbox.checked ? '1' : '0.5';
      });
      
      applyFilters();
    });
    
    sponsoredCheckbox.addEventListener('change', () => {
      localStorage.setItem('amazon-hide-sponsored', sponsoredCheckbox.checked);
      applyFilters();
    });
    
    ratingInput.addEventListener('input', () => {
      const value = parseFloat(ratingInput.value) || 0;
      localStorage.setItem('amazon-min-rating', value.toString());
      applyFilters();
    });
    
    reviewCountInput.addEventListener('input', () => {
      const value = parseInt(reviewCountInput.value) || 0;
      localStorage.setItem('amazon-min-reviews', value.toString());
      applyFilters();
    });

    // Initialize the state of other controls based on master toggle
    const filtersEnabled = masterCheckbox.checked;
    const controls = [sponsoredCheckbox, ratingInput, reviewCountInput];
    controls.forEach(control => {
      control.disabled = !filtersEnabled;
      control.style.opacity = filtersEnabled ? '1' : '0.5';
    });
    
    const labels = [sponsoredToggle, ratingFilter, reviewCountFilter];
    labels.forEach(label => {
      label.style.opacity = filtersEnabled ? '1' : '0.5';
    });

    filterContainer.appendChild(masterToggle);
    filterContainer.appendChild(sponsoredToggle);
    filterContainer.appendChild(ratingFilter);
    filterContainer.appendChild(reviewCountFilter);

    return filterContainer;
  };

  // Check if we're on a search results page and apply filters
  const handleSearchResultsPage = () => {
    if (window.location.pathname.includes('/s')) {
      // Add filter controls to the search results page with a simple, safe approach
      setTimeout(() => {
        if (!document.getElementById('search-results-filters')) {
          const searchFilters = createSearchFilters();
          
          // Use a simple, safe floating approach that won't break Amazon's layout
          const floatingContainer = document.createElement('div');
          floatingContainer.id = 'amazon-filters-float';
          floatingContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: rgba(248, 249, 250, 0.95);
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            backdrop-filter: blur(5px);
            max-width: 400px;
          `;
          
          // Dark mode support
          if (document.body.classList.contains('dark-mode')) {
            floatingContainer.style.background = 'rgba(42, 42, 42, 0.95)';
            floatingContainer.style.borderColor = '#555';
          }
          
          floatingContainer.appendChild(searchFilters);
          document.body.appendChild(floatingContainer);
          
          console.log('Amazon filters: Added floating filter controls');
        }
      }, 2000); // Give Amazon time to fully load
      
      // Wait for products to load and apply filters
      const waitForProducts = () => {
        const products = document.querySelectorAll('[data-component-type="s-search-result"]');
        if (products.length > 0) {
          console.log('Amazon filters: Found products, applying filters');
          setTimeout(applyFilters, 100);
        } else {
          setTimeout(waitForProducts, 500);
        }
      };
      
      waitForProducts();
      
      // Re-apply filters when new content is loaded (pagination, infinite scroll)
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          applyFilters();
        }, 300);
      });
    }
  };

  // Try to apply as early as possible, but only on the homepage
  if (isAmazonHomepage()) {
    if (document.readyState === 'loading') {
      // Document still loading, add event listener
      document.addEventListener('DOMContentLoaded', () => {
        createMinimalistInterface();
      });
    } else {
      // Document already loaded
      createMinimalistInterface();
    }

    // Also apply on document ready as a fallback
    window.addEventListener('load', () => {
      createMinimalistInterface();
    });
  } else {
    // Not on homepage, ensure we're visible if the style was added
    const style = document.getElementById('amazon-minimalist-hide-style');
    if (style) {
      style.remove();
      document.documentElement.classList.add('minimalist-ready');
      document.body.classList.add('minimalist-ready');
    }
    
    // Handle search results pages
    handleSearchResultsPage();
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'applyMinimalist') {
      console.log('Amazon Minimalist: Received message to apply interface');
      
      if (isAmazonHomepage()) {
        setTimeout(createMinimalistInterface, 50); // Reduced timeout
      } else {
        // Not on homepage, ensure we're visible if the style was added
        const style = document.getElementById('amazon-minimalist-hide-style');
        if (style) {
          style.remove();
          document.documentElement.classList.add('minimalist-ready');
          document.body.classList.add('minimalist-ready');
        }
      }
    } else if (message.action === 'toggleMinimalist') {
      console.log('Amazon Minimalist: Received toggle message, setting to', message.enabled ? 'enabled' : 'disabled');
      
      // Update both storage mechanisms
      localStorage.setItem('amazon-minimalist-disabled', message.enabled ? 'false' : 'true');
      chrome.storage.local.set({ minimalistDisabled: !message.enabled });
      
      // If we're enabling and on homepage, apply minimalist interface
      if (message.enabled && isAmazonHomepage()) {
        setTimeout(createMinimalistInterface, 50);
      }
    }
  });
})();