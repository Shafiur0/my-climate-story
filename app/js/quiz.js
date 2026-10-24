/* ═══════════════════════════════════════════════════════════════
   quiz.js — "Can you spot forty years of change?"
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const SITES = (global.NASA_DATA && global.NASA_DATA.sites) || [];
  const byId = {};
  SITES.forEach(s => (byId[s.id] = s));

  const Q = [
    {
      tag: 'Image detective · Bhola',
      type: 'image',
      site: 'bhola',
      prompt: 'Two Novembers in the Meghna estuary, twenty-four years apart. Which one is <em>older</em>?',
      answerYear: 2000,
      explain: 'Genuinely hard — which is the point. A single pair of images is <strong>suggestive, not proof</strong>. Braided channels, sediment plumes and tides all move the picture. That is exactly why every story here is backed by a 24-year time series and a significance test, not just two pictures.'
    },
    {
      tag: 'Trend detective',
      type: 'choice',
      prompt: 'Across all four pilot sites, which calendar month warmed fastest between 2001 and 2024?',
      options: ['March', 'July', 'September', 'December'],
      correct: 2,
      explain: 'September is the only month that warms significantly at <em>all four</em> sites in the 2001–2024 window — Dhaka +0.43, Bhola +0.45, Satkhira +0.37, Sylhet +0.32 °C per decade. Open the Trend Lab to see the full grid.'
    },
    {
      tag: 'Read the number',
      type: 'choice',
      prompt: 'Dhaka&rsquo;s September trend is <b>+0.425 °C per decade</b>. Roughly how much warmer is a September now than in 2001?',
      options: ['About 0.1 °C', 'About 0.4 °C', 'About 1.0 °C', 'About 4 °C'],
      correct: 2,
      explain: '0.425 °C per decade × 2.3 decades ≈ <b>1.0 °C</b>. A slope is a rate, not a total. Reading it as a total is the single most common mistake people make with trend charts.'
    },
    {
      tag: 'Image detective · Satkhira',
      type: 'image',
      site: 'satkhira',
      prompt: 'The Sundarbans edge, southwest Bangladesh. Which of these is the <em>later</em> date?',
      answerYear: 2024,
      explain: 'Satkhira sits where fresh river water meets the tide. Watch the channel geometry and the sediment, not the colour — haze and sun angle change the palette between years and can fool you completely.'
    },
    {
      tag: 'Evidence',
      type: 'choice',
      prompt: 'The test returns <b>q = 0.0014</b> after correcting for 48 separate tests. What does that actually mean?',
      options: [
        'Temperature rose by 0.14 °C',
        'After accounting for how many tests we ran, this result is still very unlikely to be luck',
        'The dataset is 99.86% accurate',
        'The trend will continue for another 48 years'
      ],
      correct: 1,
      explain: 'q is a false-discovery-rate adjusted p-value. Run enough tests and something will look significant by chance. Correcting across all 48 site–month combinations is what makes the September signal worth trusting.'
    },
    {
      tag: 'Scientific honesty',
      type: 'choice',
      prompt: 'Which of these claims would this app <b>refuse</b> to make?',
      options: [
        'September warmed at all four pilot sites from 2001 to 2024',
        '2024 was the warmest year in the global GISTEMP record',
        'The river moved because of global climate change',
        'The 1985–2024 rainfall series shows a step change we cannot yet explain'
      ],
      correct: 2,
      explain: 'Bank erosion, dredging, upstream flow, tides and land use all move a shoreline. Two satellite dates show <em>that</em> something changed — not <em>why</em>. Attribution needs evidence this method does not have, so the app says so instead of guessing.'
    }
  ];

  const state = { i: 0, score: 0, answered: false, order: [] };

  let dom = {};

  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  function init() {
    dom = {
      intro: document.getElementById('quizIntro'),
      stage: document.getElementById('quizStage'),
      result: document.getElementById('quizResult'),
      body: document.getElementById('quizBody'),
      bar: document.getElementById('quizBar'),
      counter: document.getElementById('quizCounter'),
      score: document.getElementById('quizScore'),
      startBtn: document.getElementById('quizStart')
    };
    if (!dom.startBtn) return;
    dom.startBtn.addEventListener('click', start);
  }

  function start() {
    state.i = 0; state.score = 0; state.answered = false;
    dom.intro.hidden = true;
    dom.result.hidden = true;
    dom.stage.hidden = false;
    render();
  }

  function render() {
    const q = Q[state.i];
    state.answered = false;
    dom.body.innerHTML = '';
    dom.counter.textContent = (state.i + 1) + ' / ' + Q.length;
    dom.score.textContent = state.score + (state.score === 1 ? ' pt' : ' pts');
    dom.bar.style.width = ((state.i) / Q.length) * 100 + '%';

    const card = document.createElement('div');
    card.className = 'q-card';

    const tag = document.createElement('span');
    tag.className = 'q-tag';
    tag.textContent = q.tag;
    card.appendChild(tag);

    const text = document.createElement('h2');
    text.className = 'q-text';
    text.innerHTML = q.prompt;
    card.appendChild(text);

    if (q.type === 'image') {
      renderImageQ(card, q);
    } else {
      renderChoiceQ(card, q);
    }

    dom.body.appendChild(card);
  }

  function renderImageQ(card, q) {
    const site = byId[q.site];
    const years = shuffle([2000, 2024]);

    const pair = document.createElement('div');
    pair.className = 'q-imgpair';

    years.forEach((yr, idx) => {
      const tile = document.createElement('button');
      tile.className = 'q-img';
      tile.type = 'button';
      tile.dataset.year = yr;

      const img = document.createElement('img');
      img.alt = 'Satellite imagery, ' + yr;
      const aspect = 4 / 3;
      const bbox = global.MC.bboxFor(site.lat, site.lon, aspect, 0.62);
      img.src = global.MC.gibsUrl('true', bbox, yr + '-11-15', 600, 450);
      img.loading = 'eager';
      tile.appendChild(img);

      const label = document.createElement('span');
      label.className = 'q-img-label';
      label.textContent = 'Image ' + (idx === 0 ? 'A' : 'B');
      tile.appendChild(label);

      const mark = document.createElement('span');
      mark.className = 'q-img-mark';
      tile.appendChild(mark);

      tile.addEventListener('click', () => {
        if (state.answered) return;
        pair.querySelectorAll('.q-img').forEach(t => t.classList.remove('is-picked'));
        tile.classList.add('is-picked');
        setTimeout(() => answer(yr === q.answerYear, tile, mark, q), 220);
      });

      pair.appendChild(tile);
    });

    card.appendChild(pair);
  }

  function renderChoiceQ(card, q) {
    const wrap = document.createElement('div');
    wrap.className = 'q-options';
    const keys = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, idx) => {
      const b = document.createElement('button');
      b.className = 'q-opt';
      b.type = 'button';
      b.innerHTML = '<span class="q-opt-key">' + keys[idx] + '</span><span>' + opt + '</span>';
      b.addEventListener('click', () => {
        if (state.answered) return;
        answer(idx === q.correct, b, null, q, idx);
      });
      wrap.appendChild(b);
    });
    card.appendChild(wrap);
  }

  function answer(ok, node, mark, q, chosenIdx) {
    state.answered = true;
    if (ok) state.score++;
    dom.score.textContent = state.score + (state.score === 1 ? ' pt' : ' pts');

    const card = dom.body.querySelector('.q-card');

    if (q.type === 'choice') {
      const opts = card.querySelectorAll('.q-opt');
      opts.forEach((b, i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add('is-right');
        else if (i === chosenIdx) b.classList.add('is-wrong');
      });
    } else if (mark) {
      mark.textContent = ok ? '✓' : '✕';
      mark.style.background = ok ? '#2ee6c5' : '#ff4d3d';
      mark.style.color = ok ? '#03130f' : '#fff';
      mark.style.opacity = '1';
      mark.style.transform = 'scale(1)';
      card.querySelectorAll('.q-img').forEach(t => (t.style.pointerEvents = 'none'));
    }

    const fb = document.createElement('div');
    fb.className = 'q-feedback show ' + (ok ? 'ok' : 'bad');
    fb.innerHTML =
      '<div class="qf-head">' +
        (ok
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Correct'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 8v5" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9"/></svg>Not quite') +
      '</div>' +
      '<p>' + q.explain + '</p>';

    const next = document.createElement('div');
    next.className = 'q-next';
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-sm';
    btn.textContent = state.i === Q.length - 1 ? 'See results' : 'Next question';
    btn.addEventListener('click', () => {
      state.i++;
      if (state.i >= Q.length) finish();
      else render();
    });
    next.appendChild(btn);
    fb.appendChild(next);

    card.appendChild(fb);
    setTimeout(() => btn.focus({ preventScroll: true }), 120);
  }

  function finish() {
    dom.stage.hidden = true;
    dom.result.hidden = false;
    dom.bar.style.width = '100%';

    const pct = state.score / Q.length;
    const R = 72, C = 2 * Math.PI * R;

    const verdict =
      pct === 1 ? 'Flawless. You read data like an analyst.' :
      pct >= 0.66 ? 'Strong. You already think like a trend detective.' :
      pct >= 0.33 ? 'Decent instincts — the details are where it gets interesting.' :
      'Good. You now know exactly why this is harder than it looks.';

    dom.result.innerHTML =
      '<div class="qr-ring">' +
        '<svg viewBox="0 0 170 170">' +
          '<defs><linearGradient id="qrGrad" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#2ee6c5"/><stop offset="100%" stop-color="#8b7cf6"/>' +
          '</linearGradient></defs>' +
          '<circle class="qr-ring-c" cx="85" cy="85" r="' + R + '" fill="none" stroke-width="9"/>' +
          '<circle class="qr-ring-v" cx="85" cy="85" r="' + R + '" fill="none" stroke-width="9" ' +
            'stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/>' +
        '</svg>' +
        '<div class="qr-val">' + state.score + '<small>/' + Q.length + '</small></div>' +
      '</div>' +
      '<h2>' + verdict + '</h2>' +
      '<p>Every answer above is grounded in the same NASA POWER and GISTEMP records behind the rest of the app. ' +
      'Nothing here was invented for a quiz.</p>' +
      '<div class="hero-cta" style="justify-content:center">' +
        '<button class="btn btn-primary" id="quizAgain">Play again</button>' +
        '<button class="btn btn-ghost" data-view="trend">Open the Trend Lab</button>' +
      '</div>';

    requestAnimationFrame(() => {
      const ring = dom.result.querySelector('.qr-ring-v');
      if (ring) ring.style.strokeDashoffset = C * (1 - pct);
    });

    const again = document.getElementById('quizAgain');
    if (again) again.addEventListener('click', start);
    if (global.MC && global.MC.bindNav) global.MC.bindNav(dom.result);
  }

  global.Quiz = { init, start };
})(window);
