// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Function to render math in an element
  function renderMathInElement(element) {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(element, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    }
  }

  // Render math in the entire document
  renderMathInElement(document.body);

  // Add a mutation observer to handle dynamically loaded content
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            renderMathInElement(node);
          }
        });
      }
    });
  });

  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
