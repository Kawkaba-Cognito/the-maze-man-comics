import { useEffect } from 'react';

export default function MazeBackground() {
  useEffect(() => {
    const c = document.getElementById('maze-bg-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const CELL = 30;
    let cols, rows, grid;

    function generate() {
      grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({ t: true, r: true, b: true, l: true, v: false }))
      );
      function carve(cc, rr) {
        grid[rr][cc].v = true;
        [[0, -1, 't', 'b'], [1, 0, 'r', 'l'], [0, 1, 'b', 't'], [-1, 0, 'l', 'r']]
          .sort(() => Math.random() - 0.5)
          .forEach(([dc, dr, wa, wb]) => {
            const nc = cc + dc, nr = rr + dr;
            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows && !grid[nr][nc].v) {
              grid[rr][cc][wa] = false; grid[nr][nc][wb] = false; carve(nc, nr);
            }
          });
      }
      carve(0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2.2; ctx.lineCap = 'square';
      for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
        const cell = grid[r][cc];
        const x = cc * CELL, y = r * CELL;
        if (cell.t) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); ctx.stroke(); }
        if (cell.r) { ctx.beginPath(); ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (cell.b) { ctx.beginPath(); ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (cell.l) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); ctx.stroke(); }
      }
    }

    function resize() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      cols = Math.max(2, Math.floor(c.width / CELL));
      rows = Math.max(2, Math.floor(c.height / CELL));
      generate(); draw();
    }

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return null;
}
