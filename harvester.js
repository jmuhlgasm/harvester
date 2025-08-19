(async () => {
  // Load Vue and fflate
  const load = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  await load('https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js');
  await load('https://cdn.jsdelivr.net/npm/fflate/umd/index.js');

  // Create GUI container
  const cage = document.createElement('div');
  cage.id = 'harvester-vault';
  cage.style = `
    position:fixed;top:10px;right:10px;z-index:999999;
    background:#111;color:#fff;padding:12px;border-radius:8px;
    font-family:sans-serif;box-shadow:0 0 10px #000;
    max-height:80vh;overflow:auto;
  `;
  document.body.appendChild(cage);

  // Scraper modules
  const scrapeAssets = () => {
    const nodes = [...document.querySelectorAll('img, video, audio, source, iframe, a[href], link[rel="stylesheet"]')];
    return [...new Set(nodes.map(n => n.src || n.href || n.getAttribute('data-src')).filter(Boolean))];
  };

  const scrapeBackgrounds = () => {
    const urls = [];
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      const match = bg?.match(/url`\(["']?(.*?)["']?\)`/);
      if (match?.[1]) urls.push(match[1]);
    });
    return urls;
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const interceptDeletions = () => {
    const observer = new MutationObserver(muts => {
      muts.forEach(m => {
        m.removedNodes.forEach(n => {
          if (n.tagName && /IMG|VIDEO|AUDIO/.test(n.tagName)) {
            console.warn('Intercepted deletion:', n.src || n.href);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // Vue App
  Vue.createApp({
    data() {
      return {
        assets: [],
        selected: new Set(),
        bundling: false,
        modules: {
          scrapeAssets: true,
          scrapeBackgrounds: true,
          scrollTrigger: true,
          interceptDeletions: true
        }
      };
    },
    mounted() {
      if (this.modules.scrollTrigger) scrollToBottom();
      if (this.modules.interceptDeletions) interceptDeletions();

      setTimeout(() => {
        const scraped = [];
        if (this.modules.scrapeAssets) scraped.push(...scrapeAssets());
        if (this.modules.scrapeBackgrounds) scraped.push(...scrapeBackgrounds());
        this.assets = [...new Set(scraped)];
      }, 1000);
    },
    methods: {
      toggle(src) {
        this.selected.has(src) ? this.selected.delete(src) : this.selected.add(src);
      },
      async bundle() {
        this.bundling = true;
        const zip = new fflate.Zip();
        for (const src of this.selected) {
          try {
            const res = await fetch(src);
            const blob = await res.blob();
            const buf = await blob.arrayBuffer();
            zip.add(src.split('/').pop(), new Uint8Array(buf));
          } catch (e) {
            console.error('Failed to fetch:', src);
          }
        }
        const zipped = fflate.zipSync(zip);
        const blob = new Blob([zipped], { type: 'application/zip' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'harvest.zip';
        a.click();
        this.bundling = false;
      }
    },
    template: `
      <div>
        <h3>😈 Harvester Vault</h3>
        <div style="margin-bottom:10px;">
          <strong>Modules:</strong><br>
          <label><input type="checkbox" v-model="modules.scrapeAssets"> Scrape Assets</label><br>
          <label><input type="checkbox" v-model="modules.scrapeBackgrounds"> Background Images</label><br>
          <label><input type="checkbox" v-model="modules.scrollTrigger"> Scroll Trigger</label><br>
          <label><input type="checkbox" v-model="modules.interceptDeletions"> Deletion Interception</label>
        </div>
        <div v-for="src in assets" :key="src" style="margin:5px 0;">
          <input type="checkbox" :checked="selected.has(src)" @change="toggle(src)">
          <label>{{ src.split('/').pop() }}</label>
        </div>
        <button @click="bundle" :disabled="bundling || selected.size === 0">
          {{ bundling ? 'Bundling...' : 'Download ZIP' }}
        </button>
      </div>
    `
  }).mount('#harvester-vault');
})();
