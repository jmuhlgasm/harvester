(async () => {
  const load = src => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  await load('https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js');
  await load('https://cdn.jsdelivr.net/npm/fflate/umd/index.js');

  const cage = document.createElement('div');
  cage.id = 'harvester-vault';
  cage.style = `
    position:fixed;top:0;right:0;width:100vw;height:100vh;
    background:#1e1e1e;color:#fff;z-index:999999;
    font-family:sans-serif;display:flex;flex-direction:row;
    box-shadow:0 0 20px #000;
  `;
  document.body.appendChild(cage);

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
      if (this.modules.scrollTrigger) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
      if (this.modules.interceptDeletions) {
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
      }

      setTimeout(() => {
        const nodes = [...document.querySelectorAll('img, video, audio, source, iframe, a[href], link[rel="stylesheet"]')];
        const urls = this.modules.scrapeAssets
          ? nodes.map(n => n.src || n.href || n.getAttribute('data-src')).filter(Boolean)
          : [];

        const bgUrls = this.modules.scrapeBackgrounds
          ? Array.from(document.querySelectorAll('*')).map(el => {
              const bg = getComputedStyle(el).backgroundImage;
              const match = bg?.match(/url`\(["']?(.*?)["']?\)`/);
              return match?.[1];
            }).filter(Boolean)
          : [];

        this.assets = [...new Set([...urls, ...bgUrls])];
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
      <div style="width:250px;padding:15px;border-right:1px solid #333;">
        <h3>😈 Vault Settings</h3>
        <label><input type="checkbox" v-model="modules.scrapeAssets"> 🧲 Scrape Assets</label><br>
        <label><input type="checkbox" v-model="modules.scrapeBackgrounds"> 🖼️ Backgrounds</label><br>
        <label><input type="checkbox" v-model="modules.scrollTrigger"> 🔄 Scroll Trigger</label><br>
        <label><input type="checkbox" v-model="modules.interceptDeletions"> 🛡️ Deletion Watch</label><br><br>
        <button @click="bundle" :disabled="bundling || selected.size === 0">
          {{ bundling ? 'Bundling...' : '📦 Download ZIP' }}
        </button>
      </div>
      <div style="flex:1;padding:15px;overflow-y:auto;">
        <h3>📁 Scraped Assets ({{ assets.length }})</h3>
        <div v-for="src in assets" :key="src" style="margin:5px 0;">
          <input type="checkbox" :checked="selected.has(src)" @change="toggle(src)">
          <a :href="src" target="_blank" rel="noopener noreferrer" style="color:#0af;text-decoration:underline;">
            {{ src.split('/').pop() }}
          </a>
        </div>
      </div>
    `
  }).mount('#harvester-vault');
})();
