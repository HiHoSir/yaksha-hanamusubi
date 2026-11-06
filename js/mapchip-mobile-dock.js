/* Mobile mapchip cursor controls. The shared JSON/PNG engine remains authoritative.
   A swipe only moves the floating cursor; PUSH is the sole touch draw action. */
(() => {
  'use strict';
  const bridge = window.YakshaMapchipEditorBridge;
  const editor = document.querySelector('.shell > section[aria-label="ドット編集"]');
  const tiles = document.querySelector('.shell > section[aria-label="タイル一覧"]');
  const preview = document.querySelector('.shell > section[aria-label="接続と保存"]');
  const surface = document.querySelector('.drawing-surface');
  const canvas = document.getElementById('drawCanvas');
  const shell = document.querySelector('.shell');
  if (!bridge || !editor || !tiles || !preview || !surface || !canvas || !shell) return;

  const mobileQuery = window.matchMedia('(max-width: 660px), (pointer: coarse) and (max-width: 960px)');
  const mobile = () => mobileQuery.matches;
  const cursor = {x: 16, y: 16};
  let navPointer = null;
  let pushHeld = false;
  let lineMode = false;
  let activeSheet = null;

  const cursorEl = document.createElement('div');
  cursorEl.id = 'mobileCursor';
  cursorEl.setAttribute('aria-hidden', 'true');
  surface.appendChild(cursorEl);

  const dock = document.createElement('nav');
  dock.id = 'mobileDock';
  dock.setAttribute('aria-label', 'ドット編集操作');
  dock.innerHTML = `
    <div class="mobile-dock-row">
      <button type="button" class="mobile-dock-item" data-pane="chips"><span class="mobile-glyph">▦</span><span class="mobile-label">選択</span></button>
      <button type="button" class="mobile-dock-item" data-pane="preview"><span class="mobile-glyph">▤</span><span class="mobile-label">配置</span></button>
      <button type="button" class="mobile-dock-item" data-action="undo"><span class="mobile-glyph">↶</span><span class="mobile-label">戻る</span></button>
      <button type="button" class="mobile-dock-item" data-action="redo"><span class="mobile-glyph">↷</span><span class="mobile-label">進む</span></button>
      <button type="button" class="mobile-dock-item" data-pane="settings"><span class="mobile-glyph">⚙</span><span class="mobile-label">設定</span></button>
    </div>
    <div class="mobile-dock-tools">
      <label class="mobile-color" aria-label="描画色"><input type="color" id="mobileColor" value="#9d9a82"><span>パレット</span></label>
      <button type="button" class="mobile-dock-item" data-mobile-tool="picker"><span class="mobile-glyph">♢</span><span class="mobile-label">スポイト</span></button>
      <button type="button" class="mobile-dock-item" data-mobile-tool="erase"><span class="mobile-glyph">▱</span><span class="mobile-label">消しゴム</span></button>
      <button type="button" class="mobile-dock-item active" data-mobile-tool="paint"><span class="mobile-glyph">✎</span><span class="mobile-label">ペン</span></button>
      <button type="button" class="mobile-dock-item" data-mobile-tool="fill"><span class="mobile-glyph">◕</span><span class="mobile-label">塗りつぶし</span></button>
      <button type="button" class="mobile-dock-item" data-mobile-tool="line"><span class="mobile-glyph">／</span><span class="mobile-label">直線</span></button>
    </div>
    <div class="mobile-push-row">
      <div class="mobile-cursor-info" aria-live="polite"><strong id="mobileCursorCoords">16, 16</strong><small id="mobileCursorHelp">スワイプで移動 / PUSHで描画</small></div>
      <button type="button" id="mobilePush" aria-label="PUSH：カーソルの位置に描画">PUSH</button>
    </div>`;
  document.body.appendChild(dock);

  const scrim = document.createElement('div');
  scrim.id = 'mobileScrim';
  scrim.hidden = true;
  document.body.appendChild(scrim);
  const sheet = document.createElement('div');
  sheet.id = 'mobileSheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'mobileSheetTitle');
  sheet.innerHTML = '<div class="sheet-head"><strong id="mobileSheetTitle">ツール</strong><button type="button" id="mobileClose" aria-label="閉じる">×</button></div><div id="mobileSheetBody"></div>';
  document.body.appendChild(sheet);
  const sheetBody = document.getElementById('mobileSheetBody');
  const push = document.getElementById('mobilePush');
  const mobileColor = document.getElementById('mobileColor');
  const coords = document.getElementById('mobileCursorCoords');
  const help = document.getElementById('mobileCursorHelp');
  const grid = document.getElementById('grid');
  const drawColor = document.getElementById('color');

  function updateCursor() {
    cursorEl.style.left = ((cursor.x + 0.5) / 32 * 100) + '%';
    cursorEl.style.top = ((cursor.y + 0.5) / 32 * 100) + '%';
    coords.textContent = cursor.x + ', ' + cursor.y;
    document.getElementById('coords').textContent = cursor.x + ',' + cursor.y;
  }
  function syncColor() { mobileColor.value = drawColor.value; }
  function syncTools() {
    const active = bridge.getTool();
    dock.querySelectorAll('[data-mobile-tool]').forEach(button =>
      button.classList.toggle('active', button.dataset.mobileTool === active));
    help.textContent = active === 'line' ? '直線：PUSHで始点→終点' :
      active === 'picker' ? 'PUSHでスポイト' :
      active === 'fill' ? 'PUSHで塗りつぶし' :
      'スワイプ移動 / PUSHで描画';
    syncColor();
  }
  function moveBy(dx, dy) {
    const oldX = cursor.x, oldY = cursor.y;
    cursor.x = Math.max(0, Math.min(31, cursor.x + dx));
    cursor.y = Math.max(0, Math.min(31, cursor.y + dy));
    if (cursor.x === oldX && cursor.y === oldY) return;
    updateCursor();
    if (pushHeld && (bridge.getTool() === 'paint' || bridge.getTool() === 'erase')) {
      bridge.dragPush(oldX, oldY, cursor.x, cursor.y);
    }
  }
  function pushStart() {
    if (!mobile() || activeSheet) return;
    const continues = bridge.beginPush(cursor.x, cursor.y);
    pushHeld = Boolean(continues);
    push.classList.add('pressed');
    syncTools();
  }
  function pushEnd() { pushHeld = false; push.classList.remove('pressed'); }
  push.addEventListener('pointerdown', event => {
    if (!mobile()) return;
    event.preventDefault();
    pushStart();
  });
  window.addEventListener('pointerup', pushEnd);
  window.addEventListener('pointercancel', pushEnd);
  window.addEventListener('blur', pushEnd);
  push.addEventListener('click', event => {
    if (event.detail !== 0) return; // Pointer presses have already been handled.
    pushStart();
    pushEnd();
  });

  // Capture-phase interception prevents the existing direct-draw handler from
  // painting on touch. The original desktop pointer workflow remains intact.
  canvas.addEventListener('pointerdown', event => {
    if (!mobile()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (navPointer) return;
    navPointer = {id: event.pointerId, x: event.clientX, y: event.clientY, fx: 0, fy: 0};
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  }, true);
  canvas.addEventListener('pointermove', event => {
    if (!mobile()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!navPointer || navPointer.id !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const stepX = rect.width / 32, stepY = rect.height / 32;
    navPointer.fx += (event.clientX - navPointer.x) / stepX;
    navPointer.fy += (event.clientY - navPointer.y) / stepY;
    navPointer.x = event.clientX;
    navPointer.y = event.clientY;
    const dx = Math.trunc(navPointer.fx), dy = Math.trunc(navPointer.fy);
    if (!dx && !dy) return;
    navPointer.fx -= dx;
    navPointer.fy -= dy;
    moveBy(dx, dy);
  }, true);
  function releaseNavigation(event) {
    if (!mobile()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (navPointer && event.pointerId === navPointer.id) navPointer = null;
  }
  canvas.addEventListener('pointerup', releaseNavigation, true);
  canvas.addEventListener('pointercancel', releaseNavigation, true);
  // On a touch device a stationary tap does not paint; the virtual cursor
  // stays where it is until a swipe actually changes its coordinates.

  dock.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.pane) { openSheet(target.dataset.pane); return; }
    if (target.dataset.action) {
      document.getElementById(target.dataset.action).click();
      return;
    }
    if (target.dataset.mobileTool) {
      const mainTool = document.querySelector('[data-tool="' + target.dataset.mobileTool + '"]');
      if (mainTool) mainTool.click();
      bridge.cancelLine();
      syncTools();
    }
  });
  mobileColor.addEventListener('input', () => { drawColor.value = mobileColor.value; });

  const settings = document.createElement('div');
  settings.className = 'mobile-options';
  settings.innerHTML = `
    <p class="note">キャンバス内はカーソル移動だけです。PUSHを押すと現在の画素を編集します。PUSHを押したままスワイプすると連続描画できます（ペン・消しゴム）。</p>
    <label><input type="checkbox" id="mobileGridToggle" checked> 1pxグリッドを表示</label>
    <div class="actions">
      <button type="button" data-proxy="flipX">左右反転</button>
      <button type="button" data-proxy="flipY">上下反転</button>
      <button type="button" data-proxy="rotate">90°回転</button>
      <button type="button" data-proxy="copyTile">チップ複製</button>
      <button type="button" data-proxy="clearTile">チップ消去</button>
    </div>
    <div class="actions">
      <button type="button" data-proxy="exportPNG">PNG保存</button>
      <button type="button" data-proxy="exportJSON">JSON保存</button>
      <button type="button" data-proxy="newProject">新規4×4</button>
    </div>
    <p class="note">アトラスの読み込み・タイル接続・通行情報は「選択」へ。試験配置・接続検査・AI命令は「配置」へ。</p>`;
  settings.querySelector('#mobileGridToggle').addEventListener('change', event => {
    grid.checked = event.target.checked;
    grid.dispatchEvent(new Event('change', {bubbles: true}));
  });
  settings.addEventListener('click', event => {
    const button = event.target.closest('[data-proxy]');
    if (!button) return;
    document.getElementById(button.dataset.proxy).click();
  });

  function openSheet(pane) {
    if (!mobile()) return;
    closeSheet();
    activeSheet = pane;
    const contents = pane === 'chips' ? tiles : pane === 'preview' ? preview : settings;
    document.getElementById('mobileSheetTitle').textContent =
      pane === 'chips' ? 'チップ選択・情報' : pane === 'preview' ? '試験配置・AI・保存' : '編集設定';
    sheetBody.appendChild(contents);
    settings.querySelector('#mobileGridToggle').checked = grid.checked;
    scrim.hidden = false;
    sheet.hidden = false;
    document.body.classList.add('mobile-sheet-open');
    document.getElementById('mobileClose').focus();
  }
  function closeSheet() {
    if (!activeSheet) return;
    if (tiles.parentElement === sheetBody) shell.insertBefore(tiles, editor);
    if (preview.parentElement === sheetBody) shell.appendChild(preview);
    if (settings.parentElement === sheetBody) sheetBody.removeChild(settings);
    activeSheet = null;
    sheet.hidden = true;
    scrim.hidden = true;
    document.body.classList.remove('mobile-sheet-open');
  }
  document.getElementById('mobileClose').addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);
  tiles.addEventListener('click', event => {
    if (event.target.closest('.chip-list button')) closeSheet();
  });
  window.addEventListener('keydown', event => {
    if (!mobile()) return;
    if (event.key === 'Escape' && activeSheet) { closeSheet(); event.preventDefault(); return; }
    if (activeSheet) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    const delta = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key];
    if (delta) { event.preventDefault(); moveBy(...delta); }
    else if (event.code === 'Space' && document.activeElement === document.body) {
      event.preventDefault(); pushStart(); pushEnd();
    }
  });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', () => {
      navPointer = null;
      pushEnd();
      closeSheet();
    });
  }
  updateCursor();
  syncTools();
})();
