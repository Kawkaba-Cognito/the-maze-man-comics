import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (!existsSync('review/memory')) {
  mkdirSync('review/memory', { recursive: true });
}

async function waitForReady(ws) {
  for (let i = 0; i < 40; i++) {
    const isReady = await new Promise((resolve) => {
      const handler = (event) => {
        const d = JSON.parse(event.data);
        if (d.id === 999) {
          ws.removeEventListener('message', handler);
          resolve(d.result?.result?.value);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({
        id: 999,
        method: 'Runtime.evaluate',
        params: {
          expression: `
            (() => {
              const body = document.body ? document.body.innerText : '';
              if (body.toLowerCase().includes('loading') || body.includes('تحميل') || !body.trim()) return false;
              const found = document.querySelector('.cpp-path') ||
                            document.querySelector('.ct-kt-panel') ||
                            document.querySelector('.ct-sg-card') ||
                            document.querySelector('.c3d-root canvas') ||
                            document.querySelector('.ct-pal3d-root') ||
                            document.querySelector('.ct-training-mode-list') ||
                            document.querySelector('.ct-training-play-header');
              return !!found;
            })()
          `,
          returnByValue: true
        }
      }));
    });

    if (isReady) {
      await new Promise(r => setTimeout(r, 1000));
      return true;
    }
    await new Promise(r => setTimeout(r, 350));
  }
  return false;
}

async function run() {
  console.log('Capturing all Memory domain views via single Chrome session...\n');

  const port = 9252;
  const proc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--window-size=1200,850',
    'about:blank',
  ]);

  try {
    let connected = false;
    let pageTab = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        const listRes = await fetch(`http://127.0.0.1:${port}/json`);
        const tabs = await listRes.json();
        pageTab = tabs.find(t => t.type === 'page' && !t.url.startsWith('chrome'));
        if (pageTab) {
          connected = true;
          break;
        }
      } catch {}
    }

    if (!connected || !pageTab) throw new Error('Could not connect to Chrome');

    const ws = new globalThis.WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

    const tasks = [
      // 1. Keep Track
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=keep-track&phase=menu', out: 'review/memory/kt-hub-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=keep-track&phase=menu', out: 'review/memory/kt-hub-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=keep-track&phase=levels', out: 'review/memory/kt-levels-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=keep-track&phase=levels', out: 'review/memory/kt-levels-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=keep-track&phase=play', out: 'review/memory/kt-brief-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=keep-track&phase=play', out: 'review/memory/kt-brief-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=keep-track&phase=play', out: 'review/memory/kt-stream-desktop.png', w: 1200, h: 850, evalJs: '(() => { const b = document.querySelector(".ct-kt-panel button"); if (b) b.click(); })()', evalWait: 1500 },

      // 2. Story Time
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=story-grid&phase=menu', out: 'review/memory/sg-hub-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=story-grid&phase=menu', out: 'review/memory/sg-hub-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=story-grid&phase=levels', out: 'review/memory/sg-levels-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=story-grid&phase=levels', out: 'review/memory/sg-levels-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=story-grid&phase=play', out: 'review/memory/sg-watch-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=story-grid&phase=play', out: 'review/memory/sg-watch-mobile.png', w: 390, h: 844 },

      // 3. Pair Match
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=paired-associates&phase=menu', out: 'review/memory/pal-hub-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=paired-associates&phase=menu', out: 'review/memory/pal-hub-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=paired-associates&phase=levels', out: 'review/memory/pal-levels-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=paired-associates&phase=levels', out: 'review/memory/pal-levels-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=paired-associates&phase=play', out: 'review/memory/pal-play-desktop.png', w: 1200, h: 850, waitMs: 2500 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=paired-associates&phase=play', out: 'review/memory/pal-play-mobile.png', w: 390, h: 844, waitMs: 2500 },
    ];

    for (const t of tasks) {
      // 1. Set viewport
      ws.send(JSON.stringify({
        id: 10,
        method: 'Emulation.setDeviceMetricsOverride',
        params: {
          width: t.w,
          height: t.h,
          deviceScaleFactor: 1,
          mobile: t.w < 600,
        }
      }));

      // 2. Navigate and wait for page to actually load
      await new Promise((resolve) => {
        const handler = (event) => {
          const d = JSON.parse(event.data);
          if (d.method === 'Page.loadEventFired') {
            ws.removeEventListener('message', handler);
            resolve();
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({
          id: 11,
          method: 'Page.navigate',
          params: { url: t.url }
        }));
      });

      // 3. Wait for game ready
      await waitForReady(ws);

      // Optional action before capture (e.g. click to dismiss banner or wait for countdown)
      if (t.waitMs) {
        await new Promise(r => setTimeout(r, t.waitMs));
      }
      if (t.evalJs) {
        await new Promise((resolve) => {
          const handler = (event) => {
            const d = JSON.parse(event.data);
            if (d.id === 888) {
              ws.removeEventListener('message', handler);
              resolve();
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({
            id: 888,
            method: 'Runtime.evaluate',
            params: { expression: t.evalJs }
          }));
        });
        await new Promise(r => setTimeout(r, t.evalWait || 1200));
      }

      // 4. Capture screenshot
      const b64 = await new Promise((resolve) => {
        const handler = (event) => {
          const d = JSON.parse(event.data);
          if (d.id === 12) {
            ws.removeEventListener('message', handler);
            resolve(d.result.data);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({
          id: 12,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      });

      writeFileSync(t.out, Buffer.from(b64, 'base64'));
      console.log(`✓ Captured ${t.out}`);
    }

    console.log('\nAll memory domain captures successfully finished!');
    ws.close();
  } finally {
    proc.kill();
  }
}

run().catch(console.error);
