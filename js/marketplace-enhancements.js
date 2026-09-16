(function(){
  const notExpired = (item) => !item?.expires_at || new Date(item.expires_at).getTime() > Date.now();
  const originalRender = window.renderMarketplaceListings;
  if (typeof originalRender === 'function') {
    window.renderMarketplaceListings = function(list){
      return originalRender(notExpired(list));
    };
  }
  const originalFilter = window.applyHomeFilters;
  if (typeof originalFilter === 'function') {
    // The main renderer filters by expiry; this wrapper keeps the public function stable.
    window.applyHomeFilters = function(){ return originalFilter.apply(this, arguments); };
  }
})();
