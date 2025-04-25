# Amazoogle - A Minimalist Amazon UK Interface

Amazoogle is a Chrome extension that transforms Amazon UK's homepage into a clean, Google-like search interface with quick access tiles for your most-used features. This helps you stay focused and intent-driven when shopping on Amazon.

## Features

- 🔍 Clean, distraction-free interface with just a search bar
- 📦 Quick access tiles for Order History, Buy Again, and Wish List
- 🌙 Light/Dark mode toggle that remembers your preference
- ⚡ Ultra-fast loading with no flash of original content
- 🔁 Toolbar icon to easily toggle between minimal and original interfaces
- 🔄 Works on Amazon's homepage while preserving normal functionality on product pages
- 🔄 Automatically applies when navigating back to the homepage
- 🧠 Smart state persistence across browser sessions

## Installation

### Manual Installation

1. Download this repository or clone it:
   ```
   git clone https://github.com/YourUsername/amazoogle.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the amazoogle folder

5. The extension should now be installed and active

## Usage

1. Visit Amazon UK's homepage (https://www.amazon.co.uk/)
2. The minimalist interface will automatically be applied
3. Use the search bar to find products (press Enter to search)
4. Click on any of the quick access tiles to go directly to:
   - Order History
   - Buy Again
   - Wish List
5. Toggle between light and dark mode using the moon/sun button in the footer
6. Use the extension toolbar icon to toggle between minimalist and original Amazon interfaces
7. You can also click "Restore Original Amazon" in the footer to temporarily view the original interface

## Performance Features

- Starts loading before Amazon's original interface becomes visible
- Optimized CSS transitions for smooth appearance
- Smart detection of user's preferred color scheme

## How It Works

Amazoogle uses content scripts that load at document start to detect when you're on Amazon UK's homepage. It efficiently replaces the interface with a minimalist version before the original content is displayed, eliminating any flash of unwanted content.

The extension preserves Amazon's core functionality while removing the distracting elements and uses Chrome's storage API for persistent settings.

## Development

To modify this extension:

1. Clone the repository
2. Make your changes to the files
3. Reload the extension in Chrome's extensions page

### Files:

- `manifest.json`: Extension configuration and permissions
- `content.js`: Main script that creates the minimalist interface
- `background.js`: Background script for detecting navigation and handling toolbar icon
- `styles.css`: Styling for the minimalist interface
- `icon*.png`: Extension icons in various sizes

## License

MIT License