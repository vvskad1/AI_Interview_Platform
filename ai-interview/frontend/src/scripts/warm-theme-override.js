// Dynamic style override script for warm theme
// This script runs to catch any dynamically generated dark styles

const warmColors = {
  darkBackground: '#4A413C',
  lightBackground: '#EBEFFE',
  mediumBackground: '#CCB499',
  primaryColor: '#BB6C43',
  secondaryColor: '#C8906D',
  lightText: '#EBEFFE',
  darkText: '#4A413C'
};

// Function to convert RGB values to warm colors
function convertToWarmColor(rgbString) {
  // Common dark blue/slate colors to replace
  const darkColors = [
    'rgb(30, 41, 59)', // slate-800
    'rgb(15, 23, 42)', // slate-900
    'rgb(51, 65, 85)', // slate-700
    'rgb(71, 85, 105)', // slate-600
    'rgb(59, 130, 246)', // blue-500
    'rgb(37, 99, 235)', // blue-600
    'rgb(29, 78, 216)', // blue-700
  ];

  if (darkColors.includes(rgbString)) {
    return warmColors.darkBackground;
  }
  
  return null;
}

// Function to override inline styles
function overrideInlineStyles() {
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    const style = element.style;
    
    // Check background color
    if (style.backgroundColor) {
      const newBgColor = convertToWarmColor(style.backgroundColor);
      if (newBgColor) {
        style.backgroundColor = newBgColor;
        // Also update text color for contrast
        if (style.color && style.color.includes('rgb(')) {
          style.color = warmColors.lightText;
        }
      }
    }
    
    // Check for search inputs specifically
    if (element.tagName === 'INPUT' && 
        (element.placeholder?.toLowerCase().includes('search') || 
         element.type === 'search')) {
      style.backgroundColor = warmColors.darkBackground;
      style.color = warmColors.lightText;
      style.borderColor = warmColors.primaryColor;
    }
  });
}

// Run the override function
document.addEventListener('DOMContentLoaded', () => {
  overrideInlineStyles();
  
  // Run again after a short delay to catch dynamically loaded content
  setTimeout(overrideInlineStyles, 100);
  setTimeout(overrideInlineStyles, 500);
  setTimeout(overrideInlineStyles, 1000);
});

// Observe DOM changes and reapply overrides
const observer = new MutationObserver(() => {
  overrideInlineStyles();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['style', 'class']
});

// Export for manual use
window.applyWarmTheme = overrideInlineStyles;