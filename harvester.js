// ==UserScript==
// @name         🔥 Deleted Asset Tracker
// @namespace    jmuhlgasm
// @version      1.0
// @description  Capture all deleted file references across DOM nodes with Vue GUI
// @author       Joel
// @match        *://*/*
// @grant        none
// ==/UserScript==

(() => {
  // Inject Vue if not present
  if (!window.Vue) {
    const vueScript = document.createElement('script');
    vueScript.src = 'https://unpkg.com/vue@3/dist/vue.global.prod.js';
    vueScript.onload = initHarvester;
    document.head.appendChild(vueScript);
  } else {
    initHarvester();
  }

  function initHarvester() {
    const deletedAssets = Vue.reactive([]);

    const extractFileRefs = node => {
      const refs = [];

      // Direct src/href
      if (node.src) refs.push(node.src);
      if (node.href) refs.push(node.href);

      // Inline styles
      const bg = node.style?.backgroundImage;
      if (bg && /url`\(["']?(.*?)["']?\)`/.test(bg)) {
        const match = bg.match(/url`\(["']?(.*?)["']?\)`/);
        if (match?.[1]) refs.push(match[1]);
      }

      // Custom attributes
      for (const attr of node.attributes || []) {
        if (/src|href|data|url/i.test(attr.name) &&
            /\.(jpg|png|mp4|pdf|zip|js|css|woff|ttf|json|svg|webp|txt|html|xml)$/i.test(attr.value)) {
          refs.push(attr.value);
        }
      }

      return refs;
    };

    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.removedNodes.forEach(node => {
          const refs = extractFileRefs(node);
          refs.forEach(ref => {
            deletedAssets.push({
              src: ref,
              type: node.tagName?.toLowerCase() || 'unknown',
              time: new Date().toLocaleTimeString()
            });
          });
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Inject GUI container
    const mount = document.createElement('div');
    mount.id = 'deleted-assets-panel';
    mount.style = `
      position:fixed;bottom:0;right:0;z-index:9999;
      background:#111;color:#eee;font:12px monospace;
      max-height:40vh;overflow:auto;padding:8px;
      border-top-left-radius:6px;border:1px solid #444;
      box-shadow:0 0 10px #000;
    `;
    document.body.appendChild(mount);

    // Mount Vue app
    const app = Vue.createApp({
      setup() {
        return { deletedAssets };
      },
      template: `
        <div>
          <div style="font-weight:bold;margin-bottom:6px;">🔥 Deleted Assets</div>
          <div v-for="(a, i) in deletedAssets" :key="i" style="margin-bottom:4px;">
            <span style="color:#0f0;">[{{ a.time }}]</span>
            <span style="color:#f0f;">{{ a.type }}</span>
            <a :href="a.src" target="_blank" style="color:#0af;">{{ a.src }}</a>
          </div>
        </div>
      `
    });
    app.mount('#deleted-assets-panel');
  }
})();
