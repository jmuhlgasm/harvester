// harvester.js
(async () => {
  if (window.__vaultInjected) return;
  window.__vaultInjected = true;

  // 🧪 Load Vue 3
  if (!window.Vue) {
    const vueScript = document.createElement('script');
    vueScript.src = 'https://unpkg.com/vue@3/dist/vue.global.prod.js';
    document.head.appendChild(vueScript);
    await new Promise(res => vueScript.onload = res);
  }

  // 🧩 Create root container
  const root = document.createElement('div');
  root.id = 'vault-root';
  root.style = `
    position:fixed;top:10px;right:10px;z-index:999999;
    background:#111;color:#eee;padding:12px 16px;
    border-radius:8px;font-family:sans-serif;
    box-shadow:0 0 12px rgba(0,0,0,0.6);
    max-height:80vh;overflow:auto;
  `;
  document.body.appendChild(root);

  // 🔥 Reactive store for deleted assets
  const deletedAssets = Vue.reactive([]);

  // 🧠 Mutation observer
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      m.removedNodes.forEach(node => {
        const src = node?.src || node?.currentSrc || '';
        const tag = node?.tagName?.toLowerCase();
        if (src && (tag === 'img' || tag === 'video')) {
          deletedAssets.push({
            src,
            type: tag,
            time: new Date().toLocaleTimeString()
          });
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // 🧪 Vue app
  const { createApp, h } = Vue;
  createApp({
    setup() {
      return () => h('div', [
        h('h3', { style: 'margin-bottom:8px;color:#f88' }, '🔥 DeletedOnPost'),
        deletedAssets.length === 0
          ? h('p', { style: 'opacity:0.6' }, 'No intercepted deletions yet.')
          : h('ul', { style: 'list-style:none;padding:0;margin:0' },
              deletedAssets.map(a =>
                h('li', {
                  style: 'margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:4px'
                }, [
                  h('span', { style: 'color:#aaa' }, `[${a.time}] ${a.type.toUpperCase()}: `),
                  h('a', {
                    href: a.src,
                    target: '_blank',
                    style: 'color:#f88;text-decoration:underline'
                  }, a.src)
                ])
              )
            )
      ]);
    }
  }).mount('#vault-root');
})();
