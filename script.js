(function () {
  // Dark Mode Toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  const html = document.documentElement;

  // Detect device theme preference
  const getDeviceTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Check for saved theme preference, then device preference, or default to light mode
  const currentTheme = localStorage.getItem('theme') || getDeviceTheme();
  html.setAttribute('data-theme', currentTheme);

  // Toggle dark mode
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Review "Read More" functionality
  const maxChars = 150;
  const reviewTexts = document.querySelectorAll('.review-text');

  reviewTexts.forEach((reviewEl) => {
    const fullText = reviewEl.textContent.trim();

    if (fullText.length > maxChars) {
      const truncatedText = fullText.substring(0, maxChars) + '...';

      // Create elements
      const truncatedSpan = document.createElement('span');
      truncatedSpan.className = 'truncated-text';
      truncatedSpan.textContent = truncatedText;

      const fullSpan = document.createElement('span');
      fullSpan.className = 'full-text';
      fullSpan.style.display = 'none';
      fullSpan.textContent = fullText;

      const readMoreLink = document.createElement('a');
      readMoreLink.href = '#';
      readMoreLink.className = 'read-more-link';
      readMoreLink.textContent = ' Read more';

      // Clear and rebuild content
      reviewEl.textContent = '';
      reviewEl.appendChild(truncatedSpan);
      reviewEl.appendChild(fullSpan);
      reviewEl.appendChild(readMoreLink);

      // Toggle functionality
      readMoreLink.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = fullSpan.style.display === 'inline';

        if (isExpanded) {
          truncatedSpan.style.display = 'inline';
          fullSpan.style.display = 'none';
          readMoreLink.textContent = ' Read more';
        } else {
          truncatedSpan.style.display = 'none';
          fullSpan.style.display = 'inline';
          readMoreLink.textContent = ' Read less';
        }
      });
    }
  });

  // FAQ Toggle functionality
  const toggleFaqsBtn = document.getElementById('toggleFaqs');
  const additionalFaqs = document.getElementById('additionalFaqs');

  if (toggleFaqsBtn && additionalFaqs) {
    toggleFaqsBtn.addEventListener('click', () => {
      const isHidden = additionalFaqs.classList.contains('d-none');

      if (isHidden) {
        additionalFaqs.classList.remove('d-none');
        toggleFaqsBtn.textContent = 'Show fewer FAQs ↑';
      } else {
        additionalFaqs.classList.add('d-none');
        toggleFaqsBtn.textContent = 'See all FAQs ↓';
      }
    });
  }

  // Contact form now handled by Web3Forms
  // No client-side JavaScript needed for form submission
})();
