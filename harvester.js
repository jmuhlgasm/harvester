(function vaultHarvester() {
  // ✅ Wait for DOM readiness
  function onReady(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  // ✅ Scrape visible asset URLs
  function harvestAssets() {
    const nodes = [
      ...document.querySelectorAll('img, video, audio, source, iframe, a[href], link[rel="stylesheet"]')
    ];

    const urls = nodes
      .map(n => n.src || n.href || n.getAttribute('data-src'))
      .filter(Boolean)
      .filter(u => /\.(jpg|jpeg|png|gif|webp|svg|mp4|mp3|pdf|docx?|zip|woff2?|ttf)$/i.test(u));

    return [...new Set(urls)];
  }

  // ✅ Scrape background images
  function harvestBackgroundImages() {
    const bgUrls = [];
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      const match = bg && bg.match(/url`\(["']?(.*?)["']?\)`/);
      if (match && match[1]) bgUrls.push(match[1]);
    });
    return bgUrls;
  }

  // ✅ Trigger lazy-load assets
  function triggerLazyLoad(callback) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    setTimeout(callback, 1000);
  }

  // ✅ Optional GUI hook
  function populateCage(assets) {
    console.log(`🔐 Vault scraped ${assets.length} assets`);
    // Replace with your GUI injection logic
    // e.g., updateVueState(assets);
  }

  // ✅ Run everything
  onReady(() => {
    triggerLazyLoad(() => {
      const allAssets = [...harvestAssets(), ...harvestBackgroundImages()];
      populateCage(allAssets);
    });
  });
})();
