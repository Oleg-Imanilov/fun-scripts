// --- State ---
const state = {
  names: [],
  winners: [],  // track winners in order
  spinning: false,
  angle: 0,     // radians
  targetAngle: 0,
  spinStart: 0,
  spinDur: 0,
  winnerIndex: -1,
  nameColors: new Map()  // track persistent colors for each name
};

// --- Elements ---
const el = {
  namesText: document.getElementById('namesText'),
  btnStart: document.getElementById('btnStart'),
  btnReset: document.getElementById('btnReset'),
  btnSample: document.getElementById('btnSample'),
  btnClear: document.getElementById('btnClear'),
  panelInput: document.getElementById('panelInput'),
  panelWheel: document.getElementById('panelWheel'),
  remaining: document.getElementById('remaining'),
  chips: document.getElementById('chips'),
  winners: document.getElementById('winners'),
  winnersSection: document.getElementById('winnersSection'),
  remainingSection: document.getElementById('remainingSection'),
  winnerBox: document.getElementById('winnerBox'),
  winnerName: document.getElementById('winnerName'),
  winnerLabel: document.getElementById('winnerLabel'),
  s1: document.getElementById('s1'),
  s2: document.getElementById('s2'),
  s3: document.getElementById('s3'),
  canvas: document.getElementById('wheel'),
};

const ctx = el.canvas.getContext('2d');

// --- Helpers ---
function parseNames(raw){
  return raw
    .replace(/\r/g, '\n')
    .split(/\n|,/)
    .map(s => s.trim())
    .filter(Boolean);
}

function setStep(step){
  // step: 1 input, 2 spin, 3 finish
  el.s1.classList.toggle('active', step === 1);
  el.s2.classList.toggle('active', step === 2);
  el.s3.classList.toggle('active', step === 3);
}

function updateCounts(){
  el.remaining.textContent = state.names.length;
}

function renderChips(){
  el.chips.innerHTML = '';
  state.names.forEach(n=>{
    const d = document.createElement('div');
    d.className = 'chip';
    d.textContent = n;
    const color = state.nameColors.get(n);
    if (color) {
      d.style.background = color;
      d.style.borderColor = 'rgba(255,255,255,.35)';
      d.style.color = 'rgba(15,16,32,.95)';
      d.style.fontWeight = '800';
    }
    el.chips.appendChild(d);
  });
}

function renderWinners(){
  el.winners.innerHTML = '';
  if (state.winners.length === 0){
    el.winnersSection.style.display = 'none';
    return;
  }
  el.winnersSection.style.display = 'block';
  state.winners.forEach((n, i)=>{
    const d = document.createElement('div');
    d.className = 'chip';
    d.textContent = `${i+1}. ${n}`;
    const color = state.nameColors.get(n);
    if (color) {
      d.style.background = color;
      d.style.borderColor = 'rgba(255,255,255,.35)';
      d.style.color = 'rgba(15,16,32,.95)';
      d.style.fontWeight = '800';
    } else {
      d.style.background = 'linear-gradient(135deg, rgba(46,230,166,.18), rgba(255,209,102,.15))';
      d.style.borderColor = 'rgba(46,230,166,.3)';
    }
    el.winners.appendChild(d);
  });
}

function niceFontSize(nameCount){
  if (nameCount <= 6) return 28;
  if (nameCount <= 12) return 22;
  if (nameCount <= 24) return 18;
  return 15;
}

// Colorful palette for slices
const palette = [
  '#ff3d8d','#ffd166','#2ee6a6','#4cc9f0','#6c63ff',
  '#f72585','#b5179e','#7209b7','#3a0ca3','#4361ee',
  '#4895ef','#4cc9f0','#06d6a0','#ffd166','#ef476f'
];

function drawWheel(){
  const N = state.names.length;
  const {width:w, height:h} = el.canvas;
  ctx.clearRect(0,0,w,h);

  // background ring glow
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.beginPath();
  ctx.arc(0,0,w*0.49,0,Math.PI*2);
  ctx.closePath();
  ctx.shadowColor = 'rgba(255,61,141,.25)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(255,255,255,.04)';
  ctx.fill();
  ctx.restore();

  if (N === 0){
    ctx.save();
    ctx.translate(w/2,h/2);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = '700 26px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add some names', 0, 0);
    ctx.restore();
    return;
  }

  const r = w * 0.45;
  const cx = w/2, cy = h/2;
  const slice = (Math.PI * 2) / N;

  // wheel rotation
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(state.angle);

  for(let i=0;i<N;i++){
    const start = i * slice;
    const end = start + slice;

    // slice
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,r,start,end);
    ctx.closePath();

    // Use persistent color for this name
    const name = state.names[i];
    const c = state.nameColors.get(name) || palette[i % palette.length];
    ctx.fillStyle = c;
    ctx.fill();

    // slice divider
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // text
    const mid = start + slice/2;
    ctx.save();
    ctx.rotate(mid);
    ctx.translate(r*0.62, 0);
    ctx.rotate(Math.PI/2);

    ctx.fillStyle = 'rgba(15,16,32,.95)';
    ctx.font = `900 ${niceFontSize(N)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = state.names[i];
    const maxWidth = r*0.92;
    // shrink-to-fit
    let size = niceFontSize(N);
    while(size > 12){
      ctx.font = `900 ${size}px system-ui`;
      if (ctx.measureText(label).width <= maxWidth) break;
      size -= 1;
    }
    // subtle text shadow
    ctx.shadowColor = 'rgba(255,255,255,.5)';
    ctx.shadowBlur = 0;
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }

  // center cap
  ctx.beginPath();
  ctx.arc(0,0,r*0.18,0,Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.15)';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = 'rgba(15,16,32,.9)';
  ctx.font = '900 22px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPIN', 0, 0);

  ctx.restore();
}

function winnerFromAngle(){
  // pointer is at top (-90deg). We want which slice lands there.
  const N = state.names.length;
  if (N === 0) return -1;
  const twoPi = Math.PI * 2;
  const a = ((twoPi - (state.angle % twoPi)) + twoPi) % twoPi; // wheel angle inverted
  const pointerAngle = (Math.PI * 1.5); // top in wheel coords after our mapping
  const effective = (a + pointerAngle) % twoPi;
  const slice = twoPi / N;
  return Math.floor(effective / slice) % N;
}

function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }

function spin(){
  if (state.spinning) return;
  const N = state.names.length;
  if (N < 2){
    // Finish
    showWinnerFinal();
    return;
  }

  el.winnerBox.style.display = 'none';

  state.spinning = true;
  el.canvas.classList.add('spinning');
  el.btnReset.disabled = true;

  const now = performance.now();
  state.spinStart = now;
  state.spinDur = 5000 + Math.random()*1000; // 5-6s (slower, with 5s slowdown)
  const extraTurns = 4 + Math.random()*3;     // 4-7 turns (fewer turns for slower spin)
  const randOffset = Math.random() * Math.PI * 2;

  const startAngle = state.angle;
  state.targetAngle = state.angle + (extraTurns * Math.PI * 2) + randOffset;

  function tick(t){
    const p = Math.min(1, (t - state.spinStart)/state.spinDur);
    const e = easeOutCubic(p);
    state.angle = startAngle + (state.targetAngle - startAngle) * e;

    drawWheel();

    if (p < 1){
      requestAnimationFrame(tick);
    } else {
      // stabilize final angle
      state.angle = state.targetAngle % (Math.PI*2);
      drawWheel();

      state.winnerIndex = winnerFromAngle();
      const winner = state.names[state.winnerIndex];

      el.winnerLabel.textContent = 'Winner (removed)';
      el.winnerName.textContent = winner ?? '—';
      el.winnerBox.style.display = 'block';
      el.winnerBox.classList.remove('fadeOut');

      // Fade out after 3 seconds
      setTimeout(() => {
        el.winnerBox.classList.add('fadeOut');
        setTimeout(() => {
          el.winnerBox.style.display = 'none';
          el.winnerBox.classList.remove('fadeOut');
        }, 500);
      }, 3000);

      // add to winners and remove from names
      if (state.winnerIndex >= 0){
        state.winners.push(state.names[state.winnerIndex]);
        state.names.splice(state.winnerIndex, 1);
      }

      // if 1 left after removing winner, add it to winners automatically
      if (state.names.length === 1){
        state.winners.push(state.names[0]);
        state.names = [];
        setStep(3);
      }

      updateCounts();
      renderChips();
      renderWinners();
      drawWheel();

      state.spinning = false;
      el.canvas.classList.remove('spinning');

      // Enable reset button
      el.btnReset.disabled = false;
    }
  }
  requestAnimationFrame(tick);
}

function showWheel(){
  el.panelInput.style.display = 'none';
  el.panelWheel.style.display = 'block';
  setStep(2);
  updateCounts();
  renderChips();
  renderWinners();
  drawWheel();
}

function showInput(){
  el.panelWheel.style.display = 'none';
  el.panelInput.style.display = 'block';
  el.winnerBox.style.display = 'none';
  setStep(1);
  state.spinning = false;
  state.angle = 0;
  state.targetAngle = 0;
  state.winnerIndex = -1;
  state.winners = [];
  el.canvas.classList.remove('spinning');
  el.btnReset.disabled = false;
  drawWheel();
  updateCounts();
}

function showWinnerFinal(){
  setStep(3);
  el.canvas.classList.remove('spinning');
  el.btnReset.disabled = false;

  const finalName = state.names[0] ?? '—';
  
  // Add the final name to winners and remove from names
  if (state.names.length === 1) {
    state.winners.push(state.names[0]);
    state.names = [];
  }
  
  el.winnerLabel.textContent = 'Final winner 🎉';
  el.winnerName.textContent = finalName;
  el.winnerBox.style.display = 'block';
  el.winnerBox.classList.remove('fadeOut');

  // Update the UI to show all winners including the final one
  updateCounts();
  renderChips();
  renderWinners();

  // Fade out after 3 seconds
  setTimeout(() => {
    el.winnerBox.classList.add('fadeOut');
    setTimeout(() => {
      el.winnerBox.style.display = 'none';
      el.winnerBox.classList.remove('fadeOut');
    }, 500);
  }, 3000);

  drawWheel();
}

// --- Events ---
el.btnStart.addEventListener('click', ()=>{
  const names = parseNames(el.namesText.value);
  if (names.length < 2){
    alert('Please enter at least 2 names.');
    return;
  }
  state.names = names;
  
  // Assign persistent colors to each name
  state.nameColors.clear();
  state.names.forEach((name, index) => {
    state.nameColors.set(name, palette[index % palette.length]);
  });
  
  updateCounts();
  showWheel();
});

el.canvas.addEventListener('click', spin);

el.btnReset.addEventListener('click', ()=>{
  // go back to input
  state.names = [];
  state.winners = [];
  state.nameColors.clear();
  updateCounts();
  renderChips();
  renderWinners();
  showInput();
  setStep(1);
});

el.btnSample.addEventListener('click', ()=>{
  el.namesText.value = [
    'Alice','Bob','Charlie','Diana','Ethan','Fatima','George','Hana'
  ].join('\n');
});

el.btnClear.addEventListener('click', ()=>{
  el.namesText.value = '';
  el.namesText.focus();
});

// Initial draw
setStep(1);
updateCounts();
drawWheel();

// Better touch: allow Enter on mobile keyboard to start if textarea focused (Ctrl+Enter on desktop)
el.namesText.addEventListener('keydown', (e)=>{
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
    el.btnStart.click();
  }
});
