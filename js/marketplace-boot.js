document.addEventListener('DOMContentLoaded', () => {
  const fixMobileCategories = () => {
    if (!document.body.classList.contains('home-body')) return;
    const grid = document.querySelector('.home-body .category-grid');
    if (!grid) return;
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    if (mobile) {
      grid.style.setProperty('display', 'flex', 'important');
      grid.style.setProperty('flex-direction', 'row', 'important');
      grid.style.setProperty('flex-wrap', 'nowrap', 'important');
      grid.style.setProperty('overflow-x', 'auto', 'important');
      grid.style.setProperty('overflow-y', 'hidden', 'important');
      grid.style.setProperty('width', 'calc(100vw - 20px)', 'important');
      grid.style.setProperty('margin-left', '0', 'important');
      grid.style.setProperty('padding', '4px 2px 12px', 'important');
      grid.style.setProperty('scroll-snap-type', 'x proximity', 'important');
      grid.style.setProperty('-webkit-overflow-scrolling', 'touch');
      grid.style.setProperty('scrollbar-width', 'none');
      grid.querySelectorAll('.category-card').forEach(card => {
        card.style.setProperty('flex', '0 0 112px', 'important');
        card.style.setProperty('width', '112px', 'important');
        card.style.setProperty('min-width', '112px', 'important');
        card.style.setProperty('min-height', '112px', 'important');
        card.style.setProperty('box-sizing', 'border-box', 'important');
        card.style.setProperty('scroll-snap-align', 'start', 'important');
      });
    } else {
      grid.style.removeProperty('display');
      grid.style.removeProperty('flex-direction');
      grid.style.removeProperty('flex-wrap');
      grid.style.removeProperty('overflow-x');
      grid.style.removeProperty('overflow-y');
      grid.style.removeProperty('width');
      grid.style.removeProperty('margin-left');
      grid.style.removeProperty('padding');
      grid.style.removeProperty('scroll-snap-type');
      grid.querySelectorAll('.category-card').forEach(card => {
        card.style.removeProperty('flex');
        card.style.removeProperty('width');
        card.style.removeProperty('min-width');
        card.style.removeProperty('min-height');
        card.style.removeProperty('scroll-snap-align');
      });
    }
  };

  setTimeout(() => {
    if (Array.isArray(window.homeListings) && typeof window.renderMarketplaceListings === 'function') {
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
    }
    fixMobileCategories();
  }, 900);

  fixMobileCategories();
  window.addEventListener('resize', fixMobileCategories);
});
