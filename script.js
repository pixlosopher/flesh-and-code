// Set current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  // Copy ETH address to clipboard
  const copyBtn = document.getElementById('copy-btn');
  const ethAddressSpan = document.getElementById('eth-address');
  if (copyBtn && ethAddressSpan) {
    copyBtn.addEventListener('click', () => {
      const addr = ethAddressSpan.textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(addr).then(() => {
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy address';
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Copy failed', err);
        });
      }
    });
  }
});