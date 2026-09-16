document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!Array.isArray(window.homeListings) || typeof window.renderMarketplaceListings !== 'function') return;
    const active = window.homeListings.filter(item => !item.expires_at || new Date(item.expires_at).getTime() > Date.now());
    window.homeListings = active;
    if (document.querySelector('.products')) window.renderMarketplaceListings(active);
  }, 900);
});
