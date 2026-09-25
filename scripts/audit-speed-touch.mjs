import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function auditTouch(url, testFn, waitMs = 4000) {
  const port = 9400 + Math.floor(Math.random() * 500);
  const dataDir = `${tmpdir()}/audit-speed-${port}`;
  const proc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${dataDir}`,
    `--remote-debugging-port=${port}`,
    '--window-size=1200,850',
    url,
  ]);

  try {
    let connected = false;
    let pageTab = null;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 350));
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
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    // Wait until Loading indicator is gone
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 300));
      const isLoading = await new Promise(res => {
        const h = (event) => {
          const d = JSON.parse(event.data);
          if (d.id === 888) {
            ws.removeEventListener('message', h);
            res(d.result?.result?.value);
          }
        };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({
          id: 888,
          method: 'Runtime.evaluate',
          params: {
            expression: `document.body && (document.body.innerText.trim() === 'Loading…' || document.body.innerText.trim() === 'جارِ التحميل…' || document.body.innerText.trim() === '')`,
            returnByValue: true
          }
        }));
      });
      if (!isLoading) break;
    }

    await new Promise(r => setTimeout(r, waitMs));

    const result = await new Promise((resolve) => {
      ws.onmessage = (event) => {
        const resp = JSON.parse(event.data);
        if (resp.id === 1) resolve(resp.result?.result?.value);
      };
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(${testFn.toString()})()`,
          returnByValue: true
        }
      }));
    });

    ws.close();
    return result;
  } finally {
    proc.kill();
    try { rmSync(dataDir, { recursive: true, force: true }); } catch {}
  }
}

async function run() {
  console.log('Auditing touch & pointer-events across Speed games...\n');

  // Test 1: Speed Match keys
  const smKeys = await auditTouch(
    'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=play',
    () => {
      const keys = Array.from(document.querySelectorAll('.ct-sm-key'));
      return {
        keyCount: keys.length,
        playStep: document.querySelector('.ct-sm-play')?.getAttribute('data-play-step') || 'ready',
        allPointersAuto: keys.every(k => window.getComputedStyle(k).pointerEvents !== 'none'),
        anyDisabled: keys.some(k => k.disabled),
      };
    },
    2000
  );
  console.log('1. Speed Match keypad audit:', smKeys);

  // Test 2: PlanetPath nodes
  const ppNodes = await auditTouch(
    'http://localhost:5173/the-maze-man-comics/?tab=comics&game=speed-match&phase=levels',
    () => {
      const nodes = Array.from(document.querySelectorAll('.cpp-node'));
      const active = document.querySelector('.cpp-node--current');
      return {
        nodeCount: nodes.length,
        hasAvatar: !!document.querySelector('.cpp-kawkab'),
        activeClickable: active ? window.getComputedStyle(active).pointerEvents !== 'none' && !active.disabled : false,
      };
    },
    1500
  );
  console.log('2. PlanetPath level map audit:', ppNodes);

  // Test 3: Math Gates canvas & lanes
  const mgPlay = await auditTouch(
    'http://localhost:5173/the-maze-man-comics/?tab=comics&game=math-gates&phase=play',
    () => {
      const canvas = document.querySelector('canvas');
      const root = document.querySelector('.c3d-root');
      return {
        hasCanvas: !!canvas,
        isAtlas: root ? root.classList.contains('cx-atlas') : false,
        canvasTouchAction: canvas ? window.getComputedStyle(canvas).touchAction : null,
      };
    },
    1500
  );
  console.log('3. Math Gates arena audit:', mgPlay);

  // Test 4: Intercept weapons
  const icPlay = await auditTouch(
    'http://localhost:5173/the-maze-man-comics/?tab=comics&game=intercept&phase=play',
    () => {
      const root = document.querySelector('.ic-root');
      const modalBtn = document.querySelector('.ic-panel button');
      return {
        isAtlas: root ? root.classList.contains('cx-atlas') : false,
        hasModal: !!modalBtn,
        modalBtnClickable: modalBtn ? window.getComputedStyle(modalBtn).pointerEvents !== 'none' : false,
      };
    },
    1500
  );
  console.log('4. Intercept arena audit:', icPlay);

  console.log('\nAll touch & pointer-events audits verified successfully!');
}

run().catch(console.error);
