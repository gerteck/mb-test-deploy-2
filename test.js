window.mermaidPromise = null;
    
    // Function to load mermaid if not already loaded
    const loadMermaid = () => {
      if (window.mermaidPromise === null) {
        window.mermaidPromise = import('${address || DEFAULT_CDN_ADDRESS}')
          .then(({ default: mermaid }) => {
            mermaid.initialize({
              startOnLoad: false,
              securityLevel: 'loose'
            });
            console.log('Mermaid loaded successfully');
            return mermaid;
          })
          .catch((error) => {
            console.error('Mermaid failed to load:', error);
            window.mermaidPromise = false;
            return null;
          });
      }
      return window.mermaidPromise;
    };

    // Function to render mermaid diagrams
    const renderMermaidDiagrams = (elements) => {
      if (!elements || elements.length === 0) {
        return Promise.resolve();
      }

      return loadMermaid().then(mermaid => {
        if (!mermaid) return;
        
        return mermaid.run({ nodes: Array.from(elements) })
          .then(() => {
            // Mark diagrams as processed
            elements.forEach(el => {
              el.classList.add('processed');
            });
          })
          .catch(err => console.error('Error rendering mermaid diagrams:', err));
      });
    };

    // Set up MutationObserver to watch for new mermaid diagrams
    const setupMermaidObserver = () => {
      const observer = new MutationObserver((mutations) => {
        let newMermaidElements = [];
        
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
              // Check if node is ELEMENT_NODE and is mermaid diagram
              if (node.nodeType === 1 && node.classList && 
                  node.classList.contains('mermaid') && 
                  !node.classList.contains('processed')) {
                newMermaidElements.push(node);
              }
              
              // Check if within node contains mermaid diagrams
              if (node.nodeType === 1 && node.querySelectorAll) {
                const mermaidInNode = node.querySelectorAll('.mermaid:not(.processed)');
                if (mermaidInNode.length) {
                  newMermaidElements = [...newMermaidElements, ...mermaidInNode];
                }
              }
            });
          }
        });
        
        // Render newly added mermaid diagrams
        if (newMermaidElements.length > 0) {
          renderMermaidDiagrams(newMermaidElements);
        }
      });
      
      // Start observing the entire document for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      return observer;
    };


    // Fallback for cases where DOMContentLoaded might have already fired
    if (document.readyState === 'loading') {
      // Initialize on DOM content loaded
      document.addEventListener('DOMContentLoaded', () => {
        // Process any existing mermaid diagrams
        const existingDiagrams = document.querySelectorAll('.mermaid:not(.processed)');
        if (existingDiagrams.length > 0) {
          renderMermaidDiagrams(existingDiagrams);
        }
        
        // Set up observer for dynamically added diagrams
        setupMermaidObserver();
      });
    } else {
      // DOMContentLoaded has already fired
      setTimeout(() => {
        const existingDiagrams = document.querySelectorAll('.mermaid:not(.processed)');
        if (existingDiagrams.length > 0) {
          renderMermaidDiagrams(existingDiagrams);
        }
        setupMermaidObserver();
      }, 0);
    }