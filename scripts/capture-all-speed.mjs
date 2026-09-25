import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (!existsSync('review/speed')) {
  mkdirSync('review/speed', { recursive: true });
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
                            document.querySelector('.ct-sm-pad') ||
                            document.querySelector('.c3d-root canvas') ||
                            document.querySelector('.ic-field') ||
                            document.querySelector('.ic-panel') ||
                            document.querySelector('.ct-mph-constellation');
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
  console.log('Capturing all Speed domain views via single Chrome session...\n');

  const port = 9250;
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
      // Speed Match
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=menu', out: 'review/speed/sm-hub-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=menu', out: 'review/speed/sm-hub-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=levels', out: 'review/speed/sm-levels-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=levels', out: 'review/speed/sm-levels-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=play', out: 'review/speed/sm-play-desktop.png', w: 1200, h: 850, waitMs: 2600 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=play', out: 'review/speed/sm-play-mobile.png', w: 390, h: 844, waitMs: 2600 },

      // Math Gates
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=math-gates&phase=menu', out: 'review/speed/mg-hub-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=math-gates&phase=menu', out: 'review/speed/mg-hub-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=math-gates&phase=levels', out: 'review/speed/mg-levels-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=math-gates&phase=levels', out: 'review/speed/mg-levels-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=math-gates&phase=play', out: 'review/speed/mg-play-desktop.png', w: 1200, h: 850, waitMs: 800 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=math-gates&phase=play', out: 'review/speed/mg-play-mobile.png', w: 390, h: 844, waitMs: 800 },

      // Intercept
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=menu', out: 'review/speed/ic-hub-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=menu', out: 'review/speed/ic-hub-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=levels', out: 'review/speed/ic-levels-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=levels', out: 'review/speed/ic-levels-mobile.png', w: 390, h: 844 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=play', out: 'review/speed/ic-brief-desktop.png', w: 1200, h: 850 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=play', out: 'review/speed/ic-play-desktop.png', w: 1200, h: 850, evalJs: '(() => { const b = document.querySelector(".ic-panel button"); if (b) b.click(); })()', evalWait: 1500 },
      { url: 'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=play', out: 'review/speed/ic-play-mobile.png', w: 390, h: 844, evalJs: '(() => { const b = document.querySelector(".ic-panel button"); if (b) b.click(); })()', evalWait: 1500 },
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

    console.log('\nAll captures successfully finished!');
    ws.close();
  } finally {
    proc.kill();
  }
}

run().catch(console.error);
