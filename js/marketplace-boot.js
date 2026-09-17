document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!Array.isArray(window.homeListings) || typeof window.renderMarketplaceListings !== 'function') return;
    const active = window.homeListings.filter(item => !item.expires_at || new Date(item.expires_at).getTime() > Date.now());
    window.homeListings = active;
    if (!document.querySelector('.products')) return;
    if (typeof window.applyHomeFilters === 'function' && (
      document.getElementById('categoryFilter')?.value ||
      document.getElementById('locationFilter')?.value ||
      document.getElementById('searchInput')?.value ||
      document.getElementById('minPrice')?.value ||
      document.getElementById('maxPrice')?.value ||
      document.getElementById('nearbyOnly')?.checked
    )) {
      window.applyHomeFilters();
    } else {
      window.renderMarketplaceListings(active);
    }
  }, 900);
});
