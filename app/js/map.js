/* ═══════════════════════════════════════════════════════════════
   map.js — NASA GIBS imagery, before/after slider, Leaflet locator
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const GIBS_WMS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
  const LAYERS = {
    'true':  'MODIS_Terra_CorrectedReflectance_TrueColor',
    'false': 'MODIS_Terra_SurfaceReflectance_Bands721'
  };

  /* Build a WMS GetMap URL for an equal-area-ish bbox.
     aspect = width / height of the target container. */
  function bboxFor(lat, lon, aspect, latSpan) {
    const span = latSpan || 0.78;
    const lonSpan = (span * (aspect || 16 / 9)) / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    return [
      +(lon - lonSpan / 2).toFixed(4),
      +(lat - span / 2).toFixed(4),
      +(lon + lonSpan / 2).toFixed(4),
      +(lat + span / 2).toFixed(4)
    ];
  }

  function gibsUrl(layerKey, bbox, date, w, h) {
    const layer = LAYERS[layerKey] || LAYERS['true'];
    return GIBS_WMS +
      '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1' +
      '&LAYERS=' + layer +
      '&STYLES=&FORMAT=image/jpeg&SRS=EPSG:4326' +
      '&BBOX=' + bbox.join(',') +
      '&WIDTH=' + Math.round(w) + '&HEIGHT=' + Math.round(h) +
      '&TIME=' + date;
  }

  /* ── before / after slider ─────────────────────────────────── */
  function BeforeAfter(root) {
    if (!root) return null;
    const imgA = root.querySelector('.ba-before-img');
    const imgB = root.querySelector('.ba-after');
    const tagL = root.querySelector('.ba-tag-l');
    const tagR = root.querySelector('.ba-tag-r');
    let dragging = false;
    let pending = 0;
    let loadedCount = 0;

    function setPos(pct) {
      const v = Math.max(0, Math.min(100, pct));
      root.style.setProperty('--pos', v + '%');
    }

    function pointer(e) {
      const r = root.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      setPos((x / r.width) * 100);
    }

    root.addEventListener('pointerdown', e => {
      if (e.target.closest('.ba-tag')) return;
      dragging = true;
      root.classList.add('dragging');
      root.setPointerCapture && root.setPointerCapture(e.pointerId);
      pointer(e);
    });
    root.addEventListener('pointermove', e => {
      if (!dragging) return;
      pointer(e);
    });
    const stop = () => { dragging = false; root.classList.remove('dragging'); };
    root.addEventListener('pointerup', stop);
    root.addEventListener('pointercancel', stop);
    root.addEventListener('pointerleave', stop);

    root.addEventListener('keydown', e => {
      const cur = parseFloat(root.style.getPropertyValue('--pos')) || 50;
      if (e.key === 'ArrowLeft') { setPos(cur - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPos(cur + 4); e.preventDefault(); }
    });
    root.setAttribute('tabindex', '0');

    function reset() { setPos(50); }

    function load(cfg) {
      // cfg: {lat, lon, aspect, layer, dateA, dateB, yearA, yearB, w, h}
      const w = cfg.w || 1100;
      const h = cfg.h || Math.round(w / (cfg.aspect || 16 / 9));
      const bbox = bboxFor(cfg.lat, cfg.lon, cfg.aspect, cfg.latSpan);

      loadedCount = 0;
      root.classList.remove('is-loaded', 'is-failed');
      if (tagL && cfg.yearA) tagL.textContent = cfg.yearA;
      if (tagR && cfg.yearB) tagR.textContent = cfg.yearB;

      const urlA = gibsUrl(cfg.layer, bbox, cfg.dateA, w, h);
      const urlB = gibsUrl(cfg.layer, bbox, cfg.dateB, w, h);
      if (imgA) { imgA.dataset.src = urlA; imgA.removeAttribute('src'); }
      if (imgB) { imgB.dataset.src = urlB; imgB.removeAttribute('src'); }

      if (document.body.classList.contains('lite')) {
        // Low-data mode: fetch a small thumbnail instead of the full frame
        const sm = 320;
        if (imgA) imgA.src = gibsUrl(cfg.layer, bbox, cfg.dateA, sm, Math.round(sm / (cfg.aspect || 16 / 9)));
        if (imgB) imgB.src = gibsUrl(cfg.layer, bbox, cfg.dateB, sm, Math.round(sm / (cfg.aspect || 16 / 9)));
      } else {
        if (imgA) imgA.src = urlA;
        if (imgB) imgB.src = urlB;
      }

      const done = () => {
        loadedCount++;
        if (loadedCount >= 2) root.classList.add('is-loaded');
      };
      [imgA, imgB].forEach(img => {
        if (!img) return;
        img.onload = done;
        img.onerror = () => { root.classList.add('is-failed'); done(); };
      });

      // if cached, onload may not fire
      setTimeout(() => {
        if (imgA && imgA.complete && imgA.naturalWidth) done();
        if (imgB && imgB.complete && imgB.naturalWidth) done();
      }, 60);
    }

    return { load, reset, setPos, root };
  }

  /* ── Leaflet locator map ───────────────────────────────────── */
  function initMap(node, sites, onPick) {
    if (!node || !global.L) return null;

    const map = L.map(node, {
      center: [23.75, 90.4],
      zoom: 6,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      minZoom: 4,
      maxZoom: 8,
      worldCopyJump: true
    });

    L.tileLayer(
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
      { maxNativeZoom: 8, maxZoom: 8, tileSize: 256, attribution: 'Imagery © NASA GIBS' }
    ).addTo(map);

    const markers = {};
    sites.forEach(s => {
      const icon = L.divIcon({
        className: 'map-pin-wrap',
        html: `<div class="map-pin" data-id="${s.id}"></div><span class="map-pin-label">${s.name}</span>`,
        iconSize: [13, 13],
        iconAnchor: [6, 6]
      });
      const m = L.marker([s.lat, s.lon], { icon, title: s.name }).addTo(map);
      m.on('click', e => {
        L.DomEvent.stopPropagation(e);
        onPick(s.lat, s.lon, s.id);
      });
      markers[s.id] = m;
    });

    map.on('click', e => {
      onPick(e.latlng.lat, e.latlng.lng, null);
    });

    // keep the map from hijacking page scroll
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());

    return {
      map,
      focus(lat, lon, id) {
        map.flyTo([lat, lon], Math.max(map.getZoom(), 7), { duration: .8 });
        Object.keys(markers).forEach(k => {
          const el = markers[k].getElement();
          if (el) {
            const pin = el.querySelector('.map-pin');
            if (pin) pin.classList.toggle('is-on', k === id);
          }
        });
      },
      invalidate() { map.invalidateSize(); }
    };
  }

  global.MC = {
    gibsUrl,
    bboxFor,
    LAYERS,
    BeforeAfter,
    initMap
  };
})(window);
