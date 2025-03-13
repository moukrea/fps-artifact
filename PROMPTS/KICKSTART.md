You are being tasked with creating an extensible project utilizing Claude's Artifacts Unlocker extension, which allows artifacts to access and use external files hosted on GitHub.

## Project Repository & Knowledge Base

The GitHub repository for this project is already set up and its information is available in the knowledge base. However, **the repository is empty at startup** since this is the first message to kickstart the project. All artifacts you create will be synced to this repository.

You **MUST** follow all file naming and structuring rules exactly as specified below. The success of the entire project depends on your strict adherence to these guidelines.

## Project Description

I want to create a simple FPS game using HTML Canvas. Map is to be procedurally generated and infinite, enemy tracked in 3D space with AI. Sprite based graphics (like original DOOM), increasing difficulty and scoring system.

Must work on keyboard/mouse (WASD/ZQSD compatible) with free camera (up/down/left/right), shoot and reload.
Must also work on mobile when touch screen is detected, with proper modern FPS controls.

No jumping, no sprinting, no crouch buttons.

We target 60 FPS on any device, bare minimum (but gameplay must not be tied to framerate)

Sprites are not provided, use placeholders.

Whole game, including HUD must be contained within Canvas, not as HTML elements.

Game screen must adjust to visible DOM width/height, fully responsive UI/HUD.

You can try using shading/lighting and particules, but be mindful of framerate.

## Important: Immediate File Availability

**Any file you create as an artifact will be immediately synced and available on the GitHub repository.** This means:
- You can create multiple artifacts in a single conversation
- Each artifact will be instantly accessible at its corresponding GitHub URL
- The main artifact can immediately reference and load these external files
- No manual upload or deployment process is needed

## Project Structure

- All artifacts you generate will be synced to a GitHub repository: `https://github.com/moukrea/fps-artifact`
- External files can be accessed at runtime from: `https://raw.githubusercontent.com/moukrea/fps-artifact/refs/heads/main/`
- The main artifact is always `index.html`, which serves as the entry point and loads all other external files
- **CRITICAL RULE**: All other artifacts must be named EXACTLY according to their path relative to the repository root (e.g., `js/main.js`, `css/styles.css`)
- Check the file tree in the knowledge base to see the current structure of the repository

## File Loading Mechanism

The following loading mechanism MUST be used in the main artifact (`index.html`) to properly load external files from GitHub, as direct script/link tags often fail due to security constraints:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Name</title>
  <style>
    /* Initial inline styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #000;
      color: white;
      font-family: Arial, sans-serif;
    }
    
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    
    #error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: red;
      max-width: 80%;
      display: none;
    }
  </style>
</head>
<body>
  <div id="app-container">
    <!-- Your app content here -->
    <div id="loading">Loading...</div>
    <div id="error"></div>
  </div>
  
  <script>
    // Script loader
    (function() {
      const errorElement = document.getElementById('error');
      const loadingElement = document.getElementById('loading');
      const appContainer = document.getElementById('app-container');
      
      // Function to load a script from a URL
      const loadScript = async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to load script from ${url}: ${response.status}`);
          }
          return await response.text();
        } catch (err) {
          console.error(`Error loading script: ${err.message}`);
          showError(`Failed to load script: ${err.message}`);
          return null;
        }
      };
      
      // Function to load CSS from a URL
      const loadCSS = async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to load CSS from ${url}: ${response.status}`);
          }
          const cssText = await response.text();
          const styleElement = document.createElement('style');
          styleElement.textContent = cssText;
          document.head.appendChild(styleElement);
          return true;
        } catch (err) {
          console.error(`Error loading CSS: ${err.message}`);
          return false;
        }
      };
      
      // Show error message
      const showError = (message) => {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        loadingElement.style.display = 'none';
      };
      
      // Base repository URL - REPLACE WITH YOUR ACTUAL REPO URL
      const baseUrl = 'https://raw.githubusercontent.com/username/repository/refs/heads/main';
      
      // List of CSS files to load
      const cssFiles = [
        `${baseUrl}/css/styles.css`
      ];
      
      // List of scripts to load in order
      const scripts = [
        `${baseUrl}/js/utils.js`,
        `${baseUrl}/js/main.js`
      ];
      
      // Load and execute all resources
      const loadAllResources = async () => {
        try {
          // Global namespace for the app
          window.MyApp = {};
          
          // First load all CSS files
          for (const cssUrl of cssFiles) {
            await loadCSS(cssUrl);
          }
          
          // Then load scripts in sequence
          for (const scriptUrl of scripts) {
            const scriptCode = await loadScript(scriptUrl);
            if (!scriptCode) {
              return; // Stop if any script fails to load
            }
            
            // Execute the code
            try {
              // Create a function from the code to execute it in the global scope
              const scriptFunction = new Function('MyApp', scriptCode);
              scriptFunction(window.MyApp);
            } catch (execError) {
              showError(`Error executing ${scriptUrl}: ${execError.message}`);
              console.error(execError);
              return;
            }
          }
          
          // Give a small delay to ensure scripts are fully processed
          setTimeout(() => {
            console.log("App object:", MyApp);
            // Check for init function and initialize
            if (typeof MyApp.init === 'function') {
              console.log("Initializing application...");
              MyApp.init(appContainer);
              // Hide loading screen
              loadingElement.style.display = 'none';
            } else {
              console.error("Init function not found in MyApp:", MyApp);
              showError('Application initialization function not found! Check console for details.');
            }
          }, 500); // 500ms delay to ensure scripts are processed
          
        } catch (err) {
          showError(`Failed to initialize application: ${err.message}`);
          console.error(err);
        }
      };
      
      // Start loading resources when the page is loaded
      window.addEventListener('load', loadAllResources);
    })();
  </script>
</body>
</html>
```

## External JavaScript Files Structure

External JavaScript files should use an IIFE (Immediately Invoked Function Expression) pattern to avoid polluting the global scope and properly export functionality:

```javascript
// js/main.js example
(function(MyApp) {
  // Private variables and functions
  const privateVar = 'Hello';
  
  function privateFunction() {
    console.log('Private function');
  }
  
  // Public initialization function
  function init(container) {
    console.log('Initializing application with container:', container);
    // Your initialization code here
  }
  
  // Export public functions and variables to the App namespace
  MyApp.init = init;
  MyApp.publicVar = 'World';
  
  // Log to console to confirm loading
  console.log('Main module loaded successfully');
})(MyApp || {});

// Optional fallback to ensure functions are available globally
if (typeof window !== 'undefined' && window.MyApp && !window.MyApp.init) {
  window.MyApp.init = init;
  console.log("Added init function to global MyApp object as fallback");
}
```

## Best Practices

1. **Modular Architecture**: Split your code into logical modules (e.g., `utils.js`, `ui.js`, `data.js`) to maintain organization.

2. **Loading Order**: Always ensure dependent scripts are loaded in the correct order.

3. **Error Handling**: Include comprehensive error handling for both loading and execution.

4. **Namespacing**: Use a single global namespace (e.g., `MyApp`) to avoid polluting the global scope.

5. **Initialize Last**: Ensure all resources are loaded before initializing the application.

## Compliance Checklist

Before completing each response, verify that:

- The main artifact is named exactly `index.html`
- All other artifacts are named with their exact repository paths
- The loading mechanism is properly implemented in index.html
- All file references use the correct GitHub raw URLs
- JavaScript files follow the proper namespacing pattern
- You have tested for potential errors or conflicts
