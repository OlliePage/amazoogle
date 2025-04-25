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

    // Clear existing content
    document.body.innerHTML = '';
    document.body.style.backgroundColor = darkMode ? '#1E1E1E' : '#F7F7F7'; // Dark ash grey for dark mode
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