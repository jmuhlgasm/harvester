(async () => {
  // 🕵️‍♂️ Obfuscated loader
  const load = (url) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  // 📦 Load fflate for ZIP bundling
  await load('https://cdn.jsdelivr.net/npm/fflate/umd/index.js');

  // 🧱 Inject Vue
  await load('https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js');

  // 😈 Create GUI container
  const cage = document.createElement('div');
  cage.id = 'harvester-vault';
  cage.style = `
    position:fixed;top:10px;right:10px;z-index:999999;
    background:#111;color:#fff;padding:10px;border-radius:8px;
    font-family:sans-serif;box-shadow:0 0 10px #000;
  `;
  document.body.appendChild(cage);

  // 🧲 Asset harvesting logic
  const harvestAssets = () => {
    const assets = [...document.images, ...document.querySelectorAll('video, audio, a[href]')]
      .map(el => el.src || el.href)
      .filter(src => src && /\.(jpg|jpeg|png|gif|webp|mp4|mp3|pdf|docx?)$/i.test(src));
    return [...new Set(assets)];
  };

  // 🛡️ Intercept deletion
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

  // 🧠 Vue App
  Vue.createApp({
    data() {
      return {
        assets: [],
        selected: new Set(),
        bundling: false
      };
    },
    mounted() {
      this.assets = harvestAssets();
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
