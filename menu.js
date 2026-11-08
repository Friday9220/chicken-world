// Chicken World – menu, kurv og bestilling
(function () {
  var MENU = window.CW_MENU || [];
  var EXTRAS = window.CW_PIZZA_EXTRAS || [];
  var SODAS = window.CW_SODAS || [];
  var CFG = window.CW_CONFIG || {};
  var HOURS = CFG.hours || {};
  var DEL = CFG.delivery || { fee: 0, freeFrom: 0, from: 0, to: 0 };
  var LUNCH = CFG.lunch || { days: [], from: 0, to: 0 };
  var LAST = CFG.lastOrderMinutes || 15;
  var PREP = CFG.prepMinutes || 20;
  var STORE_KEY = 'cw-kurv';
  var ONLINE = !!(CFG.supabaseUrl && CFG.supabaseKey); // ellers: kunden ringer bestillingen ind
  var DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];

  var $ = function (id) { return document.getElementById(id); };
  var kr = function (n) { return n.toLocaleString('da-DK') + ',-'; };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var fmt = function (m) { return pad(Math.floor(m / 60)) + '.' + pad(m % 60); };

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Byg menuen ----------
  function pricesOf(sec, item) {
    var p = item[3];
    if (typeof p === 'number') return [{ label: '', price: p }];
    var labels = item[5] || sec.sizes || []; // en ret kan have egne prisnavne, fx ['Pizza', '+ sodavand']
    return p.map(function (v, i) { return { label: labels[i] || '', price: v }; })
            .filter(function (x) { return x.price != null; });
  }
  // Retter i en sektion med "menu" får også en menu-knap (alm. størrelse + tillæg). Tillæg og ekstra får ingen.
  function isAddon(item) { return /^(Tillæg|Gør din)/.test(item[2]) || /^(Ekstra|Dobbelt|Menu-tillæg)/.test(item[1]); }
  function pricesWithMenu(sec, item) {
    var ps = pricesOf(sec, item);
    if (!sec.menu || isAddon(item) || !ps.length) return ps;
    var base = ps[0];
    return ps.concat([{ label: base.label ? base.label + ' menu' : 'Menu', price: base.price + sec.menu, menu: true }]);
  }

  // Retter i disse sektioner kan bestilles uden en eller flere af ingredienserne i beskrivelsen
  var NO_SECS = ['pizza', 'burgere', 'pita', 'bowls', 'ruller'];
  // Kødet/hovedingrediensen (første ord i burgere, pita og bowls) og "x eller y" kan ikke fravælges
  var NO_MAIN = ['burgere', 'pita', 'bowls'];
  function ingredients(desc, skipFirst) {
    if (!desc || /bemærkning/i.test(desc)) return [];
    var parts = [];
    desc.split(/,\s*/).forEach(function (p) { p.split(/\s+og\s+/).forEach(function (q) { q = q.trim(); if (q) parts.push(q); }); });
    if (skipFirst) parts.shift();
    parts = parts.filter(function (p) { return !/^\d|^dobbelt\b|\beller\b/i.test(p); });
    return parts.map(function (p) { return /^[A-ZÆØÅ][a-zæøå]/.test(p) ? p.charAt(0).toLowerCase() + p.slice(1) : p; });
  }
  var list = $('menu-list'), links = $('catlinks');
  var byKey = {};
  MENU.forEach(function (sec) {
    var section = document.createElement('section');
    section.className = 'msec msec--' + sec.id + (sec.lunch ? ' msec--lunch' : '');
    section.id = sec.id;
    var html = '<div class="msec__head"><h2 class="display">' + esc(sec.title) + '</h2>' +
      (sec.note ? '<p>' + esc(sec.note) + '</p>' : '') + '</div><ul class="dishes">';
    sec.items.forEach(function (item, i) {
      var nr = item[0], name = item[1], desc = item[2], tag = item[4];
      var search = (nr + ' ' + name + ' ' + desc + ' ' + sec.title).toLowerCase();
      html += '<li class="dish' + (nr ? '' : ' dish--plain') + '" data-search="' + esc(search) + '">' +
        '<span class="dish__nr">' + esc(nr) + '</span>' +
        '<div class="dish__main"><h3 class="dish__name">' + esc(name) +
        (tag ? '<span class="dish__tag">' + esc(tag) + '</span>' : '') + '</h3>' +
        (desc ? '<p class="dish__desc">' + esc(desc) + '</p>' : '') + '</div>' +
        '<div class="dish__prices">';
      pricesWithMenu(sec, item).forEach(function (p) {
        var key = sec.id + '|' + i + '|' + p.label;
        byKey[key] = {
          key: key, nr: nr, name: name, desc: desc, size: p.label, price: p.price, lunch: !!sec.lunch, menu: !!p.menu,
          pizza: sec.id === 'pizza' || /^Frokostpizza/.test(name),
          soda: !!(item[6] && item[6].drinks) || !!sec.drinks || !!p.menu || /sodavand/i.test(p.label) || /^Sodavand/.test(name),
          drinks: (item[6] && item[6].drinks) || sec.drinks || null,
          extras: (item[6] && item[6].extras) || null,
          pick: (item[6] && item[6].pick) || (sec.pick && !isAddon(item) ? sec.pick : null),
          ingr: NO_SECS.indexOf(sec.id) >= 0 && !isAddon(item) ? ingredients(desc, NO_MAIN.indexOf(sec.id) >= 0) : [],
          section: sec.lunch ? 'Frokost' : (sec.id === 'pizza' || sec.id === 'kylling' || sec.id === 'burgere' ? '' : sec.title)
        };
        html += '<button class="price' + (p.menu ? ' price--menu' : '') + '" type="button" data-key="' + esc(key) + '" aria-label="Læg ' +
          esc(name + (p.label ? ' ' + p.label : '')) + ' i kurven, ' + p.price + ' kr">' +
          (p.label ? '<small>' + esc(p.label) + '</small>' : '') + kr(p.price) + '</button>';
      });
      html += '</div></li>';
    });
    section.innerHTML = html + '</ul>';
    list.appendChild(section);

    var a = document.createElement('a');
    a.href = '#' + sec.id; a.textContent = sec.title; a.dataset.id = sec.id;
    links.appendChild(a);
  });

  // ---------- Søgning ----------
  $('search').addEventListener('input', function () {
    var q = this.value.trim().toLowerCase();
    var any = false;
    document.querySelectorAll('.msec').forEach(function (sec) {
      var shown = 0;
      sec.querySelectorAll('.dish').forEach(function (d) {
        var hit = !q || d.dataset.search.indexOf(q) !== -1;
        d.hidden = !hit; if (hit) shown++;
      });
      sec.hidden = shown === 0; if (shown) any = true;
    });
    $('menu-empty').hidden = any;
  });

  // ---------- Aktiv kategori ----------
  if ('IntersectionObserver' in window) {
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        if (id === current) return;
        current = id;
        links.querySelectorAll('a').forEach(function (a) {
          var on = a.dataset.id === id;
          a.classList.toggle('is-active', on);
          if (on) links.scrollTo({ left: a.offsetLeft - 40, behavior: 'smooth' });
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.msec').forEach(function (s) { io.observe(s); });
  }

  // ---------- Åbningstider ----------
  var SPECIAL = CFG.specialHours || {};
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hoursOn(d) { var k = dayKey(d); return k in SPECIAL ? SPECIAL[k] : (HOURS[d.getDay()] || null); }
  function isLunch(d, mins) {
    return LUNCH.days.indexOf(d.getDay()) !== -1 && mins >= LUNCH.from * 60 && mins < LUNCH.to * 60;
  }
  // Status i toppen: "Åbent nu til 20.00" / "Lukket – åbner i morgen kl. 10.00"
  (function showOpen() {
    var el = $('openstatus'); if (!el) return;
    var now = new Date(), mins = now.getHours() * 60 + now.getMinutes(), h = hoursOn(now);
    var open = h && mins >= h[0] * 60 && mins < h[1] * 60;
    if (open) { el.innerHTML = '<span class="dot"></span> Åbent nu til kl. ' + fmt(h[1] * 60); return; }
    var next = nextOpenDay(now, h && mins < h[0] * 60 ? 0 : 1);
    el.innerHTML = '<span class="dot is-closed"></span> Lukket nu · åbner ' + next.label + ' kl. ' + fmt(next.hours[0] * 60);
  })();
  function nextOpenDay(from, offset) {
    for (var i = offset; i < offset + 8; i++) {
      var d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      var h = hoursOn(d);
      if (h) return { date: d, hours: h, label: i === 0 ? 'i dag' : i === 1 ? 'i morgen' : DAYS[d.getDay()] };
    }
    return null;
  }

  // ---------- Kurv ----------
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { cart = []; }
  function drinksOf(it) { return it.drinks || SODAS; }
  // Tilkøb i pop-up'en: rettens egne (7. felt "extras") eller pizzatilvalgene
  function extrasOf(it) { return it.extras || (it.pizza ? EXTRAS : []); }
  // Valg fra pop-up'en ligger i nøglen: "<nøgle>!0,2" (uden ingrediens nr. 0 og 2), "#dressing,ost" (pizzatilvalg)
  // og "@1" (drik nr. 1), fx "pizza|1|Alm.!1#ost@0".
  function withExtras(key) {
    if (byKey[key]) return byKey[key];
    var m = /^([^!$#@]+)(?:!([\d,]*))?(?:\$(\d+))?(?:#([^@]*))?(?:@(\d+))?$/.exec(key);
    var base = m && byKey[m[1]];
    if (!base) return null;
    var without = (m[2] ? m[2].split(',') : []).map(function (n) { return (base.ingr || [])[Number(n)]; }).filter(Boolean);
    var choice = m[3] != null && base.pick ? base.pick.options[Number(m[3])] : null;
    if (m[3] != null && !choice) return null;
    var ids = m[4] ? m[4].split(',') : [];
    var picked = extrasOf(base).filter(function (x) { return ids.indexOf(x.id) >= 0; });
    var soda = m[5] != null ? drinksOf(base)[Number(m[5])] : null;
    if (m[5] != null && !soda) return null;
    var it = {};
    for (var k in base) it[k] = base[k];
    it.key = key;
    it.price = base.price + picked.reduce(function (s, x) { return s + x.price; }, 0);
    var size = base.size || '';
    if (choice) size += (size ? ' · ' : '') + choice.toLowerCase();
    if (picked.length) size += (size ? ' · ' : '') + '+ ' + picked.map(function (x) { return x.name.toLowerCase(); }).join(', ');
    if (without.length) size += (size ? ' · ' : '') + 'uden ' + without.join(', ');
    if (soda) size += (size ? ' · ' : '') + soda;
    it.size = size;
    return (byKey[key] = it);
  }
  cart = cart.filter(function (l) { return withExtras(l.key); });

  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {} }
  function subtotal() { return cart.reduce(function (s, l) { return s + byKey[l.key].price * l.qty; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function isDelivery() { var r = document.querySelector('input[name=mode]:checked'); return r && r.value === 'levering'; }
  // Leveringstidspunkt i minutter efter midnat (ud fra valgt tid; "hurtigst muligt" = nu + leveringstid)
  function deliveryMinute() {
    var v = ($('o-time') || {}).value || '';
    if (/^\d\d\.\d\d$/.test(v)) return Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
    var now = new Date();
    return now.getHours() * 60 + now.getMinutes() + (DEL.minutes || 45);
  }
  // Gebyret gælder kun ved levering fra kl. feeFrom (før er levering gratis) og under freeFrom kr.
  function feeTime() { return !DEL.feeFrom || deliveryMinute() >= DEL.feeFrom * 60; }
  function baseFee() { return isDelivery() && subtotal() < DEL.freeFrom && feeTime() ? DEL.fee : 0; }
  // Kørselstillæg: perKm kr pr. km ud over baseKm, talt ud og hjem (afrundet op til hele km)
  var dist = { km: null, state: 'none', key: '' }; // state: none | busy | ok | fail | far
  function extraKm() {
    if (!isDelivery() || dist.km == null || !DEL.perKm) return 0;
    var over = Math.max(0, dist.km - (DEL.baseKm || 0));
    return over > 0 ? Math.ceil(over * (DEL.roundTrip ? 2 : 1)) : 0;
  }
  function kmFee() { return extraKm() * (DEL.perKm || 0); }
  function fee() { return baseFee() + kmFee(); }
  // Rabatkode: procent af maden, ikke af levering og ikke af frokosttilbud. Databasen tjekker koden og mailadressen.
  var disc = { code: '', pct: 0, email: '' };
  var DISC_MIN = 250; // rabatkoden gælder kun ved køb af mad (uden frokosttilbud) for mindst 250 kr. (samme grænse står i databasen)
  // Maden, der kan gives rabat på: alt undtagen frokosttilbud
  function discBase() { return cart.reduce(function (s, l) { return byKey[l.key].lunch ? s : s + byKey[l.key].price * l.qty; }, 0); }
  function discount() { var b = discBase(); return disc.pct && b >= DISC_MIN ? Math.round(b * disc.pct / 100) : 0; }
  function discHint() {
    if (!disc.pct) return;
    var miss = DISC_MIN - discBase(), lunchNote = hasLunch() ? ' Frokosttilbud giver ikke rabat og tæller ikke med.' : '';
    if (miss > 0) codeHint('Rabatkoden gælder ved køb af mad for mindst ' + DISC_MIN + ' kr. Køb for ' + kr(miss) + ' mere for at få ' + disc.pct + ' % rabat.' + lunchNote, false);
    else codeHint('Rabatkoden er godkendt: ' + disc.pct + ' % rabat på maden.' + lunchNote, true);
  }
  function total() { return subtotal() - discount() + fee(); }
  function hasLunch() { return cart.some(function (l) { return byKey[l.key].lunch; }); }
  function label(it) {
    return (it.nr ? it.nr + '. ' : '') + (it.section ? it.section + ': ' : '') + it.name + (it.size ? ' (' + it.size + ')' : '');
  }

  function render() {
    var n = count();
    $('cartbtn').hidden = n === 0;
    $('cartcount').textContent = n;
    $('carttotal-btn').textContent = kr(subtotal());
    $('cartempty').hidden = n > 0;
    $('orderform').querySelector('button[type=submit]').disabled = n === 0;
    $('cartitems').innerHTML = cart.map(function (l, i) {
      var it = byKey[l.key];
      return '<li class="citem"><div><div class="citem__name">' + esc(label(it)) + '</div>' +
        (it.desc ? '<div class="citem__meta">' + esc(it.desc) + '</div>' : '') +
        '<div class="qty"><button type="button" data-q="-1" data-i="' + i + '" aria-label="Fjern én">−</button>' +
        '<span>' + l.qty + '</span>' +
        '<button type="button" data-q="1" data-i="' + i + '" aria-label="Tilføj én">+</button></div></div>' +
        '<div class="citem__price">' + kr(it.price * l.qty) + '</div></li>';
    }).join('');
    var del = isDelivery();
    $('feeline').hidden = !del || n === 0;
    $('fee').textContent = baseFee() ? kr(baseFee()) : 'Gratis' + (DEL.feeFrom && !feeTime() && subtotal() < DEL.freeFrom ? ' før kl. ' + fmt(DEL.feeFrom * 60) : '');
    $('kmline').hidden = !del || n === 0 || !kmFee();
    $('kmlabel').textContent = 'Kørselstillæg (' + extraKm() + ' km × ' + DEL.perKm + ' kr)';
    $('kmfee').textContent = kr(kmFee());
    var missing = DEL.freeFrom - subtotal(), short = (DEL.minOrder || 0) - subtotal();
    $('freehint').hidden = !del || n === 0 || (short <= 0 && (missing <= 0 || !feeTime()));
    $('freehint').textContent = short > 0
      ? 'Levering kræver køb for mindst ' + kr(DEL.minOrder) + '. Køb for ' + kr(short) + ' mere, eller vælg afhentning.'
      : 'Køb for ' + kr(missing) + ' mere, så slipper du for leveringsgebyret på ' + kr(DEL.fee) + '.';
    $('freehint').classList.toggle('form-error', short > 0);
    $('discline').hidden = !discount() || n === 0;
    discHint();
    $('disclabel').textContent = 'Rabat ' + disc.code.toUpperCase() + ' (' + disc.pct + ' %)';
    $('discamt').textContent = '−' + kr(discount());
    $('carttotal').textContent = kr(total());
    save();
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 1800);
  }
  function bump(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.price');
    if (!btn) return;
    var key = btn.dataset.key;
    var it0 = byKey[key];
    if (extrasOf(it0).length || (it0.soda && drinksOf(it0).length) || (it0.ingr && it0.ingr.length) || it0.pick) { openExtras(key, btn); return; }
    addToCart(key, btn);
  });
  function addToCart(key, btn) {
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty++; else cart.push({ key: key, qty: 1 });
    render();
    if (btn) bump(btn, 'is-added');
    bump($('cartbtn'), 'is-bump');
    toast(byKey[key].name + ' er lagt i kurven');
  }

  // ---------- Pop-up med tilvalg til pizza og valg af sodavand ----------
  var pz = $('pizzapop'), pzKey = '', pzBtn = null;
  function pzPicked() { return Array.prototype.map.call(pz.querySelectorAll('input[name=pzx]:checked'), function (c) { return c.value; }); }
  function pzWithout() { return Array.prototype.map.call(pz.querySelectorAll('input[name=pzn]:checked'), function (c) { return c.value; }); }
  function pzPick() { var r = pz.querySelector('input[name=pzp]:checked'); return r ? r.value : ''; }
  function pzSoda() { var r = pz.querySelector('input[name=pzs]:checked'); return r ? r.value : ''; }
  function pzSum() {
    var ids = pzPicked();
    return byKey[pzKey].price + extrasOf(byKey[pzKey]).reduce(function (s, x) { return ids.indexOf(x.id) >= 0 ? s + x.price : s; }, 0);
  }
  function pzUpdate() { $('pz-add').textContent = 'Læg i kurven · ' + kr(pzSum()); $('pz-err').hidden = true; if (pzPick() !== '') $('pz-p-err').hidden = true; }
  function openExtras(key, btn) {
    pzKey = key; pzBtn = btn;
    var it = byKey[key];
    var hasX = extrasOf(it).length, hasS = it.soda && drinksOf(it).length, isJuice = !!it.drinks && !/sodavand/i.test(it.name);
    var hasN = it.ingr && it.ingr.length;
    $('pz-kicker').textContent = hasS && !hasX && !hasN && !it.pick ? (isJuice ? 'Hvilken juice vil du have?' : 'Hvilken sodavand vil du have?') :
      hasX ? 'Vil du have noget ekstra?' : 'Tilpas din bestilling';
    $('pz-title').textContent = (it.nr ? it.nr + '. ' : '') + it.name + (it.size ? ' (' + it.size + ')' : '');
    $('pz-info').textContent = it.menu ? (window.CW_MENU_INFO || '') : '';
    $('pz-info').hidden = !(it.menu && window.CW_MENU_INFO);
    $('pz-soda').hidden = !hasS;
    $('pz-soda-legend').textContent = isJuice ? 'Vælg juice' : 'Vælg sodavand';
    $('pz-err').textContent = isJuice ? 'Vælg hvilken juice du vil have.' : 'Vælg hvilken sodavand du vil have.';
    $('pz-soda-list').innerHTML = hasS ? drinksOf(it).map(function (s, i) {
      return '<label class="pzpop__chip"><input type="radio" name="pzs" value="' + i + '"><span>' + esc(s) + '</span></label>';
    }).join('') : '';
    $('pz-x').hidden = !hasX;
    $('pz-list').innerHTML = hasX ? extrasOf(it).map(function (x) {
      return '<li><label><input type="checkbox" name="pzx" value="' + esc(x.id) + '"' + (x.group ? ' data-group="' + esc(x.group) + '"' : '') + '><span>' + esc(x.name) + '</span>' +
        '<b>' + (x.price ? '+ ' + kr(x.price) : 'Gratis') + '</b></label></li>';
    }).join('') : '';
    $('pz-p').hidden = !it.pick;
    $('pz-p-legend').textContent = it.pick ? it.pick.title : '';
    $('pz-p-list').innerHTML = it.pick ? it.pick.options.map(function (s, i) {
      return '<label class="pzpop__chip"><input type="radio" name="pzp" value="' + i + '"><span>' + esc(s) + '</span></label>';
    }).join('') : '';
    $('pz-p-err').hidden = true;
    $('pz-n').hidden = !hasN;
    $('pz-n-list').innerHTML = hasN ? it.ingr.map(function (g, i) {
      return '<li><label><input type="checkbox" name="pzn" value="' + i + '"><span>Uden ' + esc(g) + '</span></label></li>';
    }).join('') : '';
    pzUpdate();
    pz.hidden = false;
    document.body.classList.add('pz-open');
    var first = pz.querySelector('input');
    if (first) first.focus();
  }
  function closeExtras() { pz.hidden = true; document.body.classList.remove('pz-open'); if (pzBtn) pzBtn.focus(); }
  pz.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'pzx' && t.checked && t.dataset.group) {
      pz.querySelectorAll('input[name=pzx][data-group="' + t.dataset.group + '"]').forEach(function (o) { if (o !== t) o.checked = false; });
    }
    pzUpdate();
  });
  $('pz-add').addEventListener('click', function () {
    var it = byKey[pzKey], ids = pzPicked(), soda = pzSoda(), no = pzWithout(), pick = pzPick();
    if (it.pick && pick === '') { $('pz-p-err').hidden = false; $('pz-p').scrollIntoView({ block: 'nearest' }); return; }
    if (it.soda && drinksOf(it).length && soda === '') { $('pz-err').hidden = false; return; }
    var key = pzKey + (no.length ? '!' + no.join(',') : '') + (pick !== '' ? '$' + pick : '') + (ids.length ? '#' + ids.join(',') : '') + (soda !== '' ? '@' + soda : '');
    withExtras(key);
    closeExtras();
    addToCart(key, pzBtn);
  });
  $('pz-cancel').addEventListener('click', closeExtras);
  pz.addEventListener('click', function (e) { if (e.target === pz) closeExtras(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pz.hidden) closeExtras(); });

  $('cartitems').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-q]');
    if (!b) return;
    var l = cart[Number(b.dataset.i)];
    l.qty += Number(b.dataset.q);
    if (l.qty <= 0) cart.splice(Number(b.dataset.i), 1);
    render();
    fillTimes();
  });

  // Åbn og luk kurven
  var cartEl = $('cart');
  function openCart() {
    fillTimes();
    if ($('step-sent').hidden) showStep('cart');
    cartEl.classList.add('is-open'); cartEl.setAttribute('aria-hidden', 'false');
    $('scrim').hidden = false; $('cartbtn').setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('cartclose').focus(); }, 50);
  }
  function closeCart() {
    cartEl.classList.remove('is-open'); cartEl.setAttribute('aria-hidden', 'true');
    $('scrim').hidden = true; $('cartbtn').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  $('cartbtn').addEventListener('click', openCart);
  $('cartclose').addEventListener('click', closeCart);
  $('scrim').addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });

  // Afhentning eller levering
  document.querySelectorAll('input[name=mode]').forEach(function (r) {
    r.addEventListener('change', function () {
      var del = isDelivery();
      $('addrfields').hidden = !del;
      $('time-label').textContent = del ? 'Levering: dato og tidspunkt' : 'Afhentning: dato og tidspunkt';
      if (del) updateDistance();
      render(); fillTimes();
    });
  });

  // ---------- Afstand fra butikken til kundens adresse ----------
  // Adressen slås op i OpenStreetMap (Nominatim, med Photon som reserve), og køreafstanden findes via OSRM.
  // Kan ruten ikke hentes, bruges afstanden i luftlinje × 1,3. (DAWA lukkede i 2026.)
  var SHOP = { lat: 56.37456, lon: 9.65760 }; // Banegårdspladsen 13, 8850 Bjerringbro
  function inDK(p) { return p && p.lat > 54.4 && p.lat < 57.9 && p.lon > 7.9 && p.lon < 15.3; }
  function nominatim(street, zip) {
    var city = zip.replace(/^\d{4}\s*/, '');
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=dk&accept-language=da' +
      '&street=' + encodeURIComponent(street) + '&postalcode=' + encodeURIComponent(zip.slice(0, 4)) + (city ? '&city=' + encodeURIComponent(city) : '');
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('net'); return r.json(); }).then(function (a) {
      if (!a || !a[0]) {
        if (city) return nominatim(street, zip.slice(0, 4)); // prøv igen uden bynavn
        throw new Error('ukendt');
      }
      return { lat: Number(a[0].lat), lon: Number(a[0].lon) };
    });
  }
  function photon(street, zip) {
    var url = 'https://photon.komoot.io/api/?limit=1&lat=' + SHOP.lat + '&lon=' + SHOP.lon + '&q=' + encodeURIComponent(street + ', ' + zip + ', Danmark');
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('net'); return r.json(); }).then(function (j) {
      var f = j && j.features && j.features[0];
      if (!f || (f.properties.postcode && f.properties.postcode.slice(0, 4) !== zip.slice(0, 4))) throw new Error('ukendt');
      return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
    });
  }
  // Fejler begge tjenester med netværksfejl, markeres fejlen som "net" (så kan kunden stadig bestille)
  function geocode(street, zip) {
    return nominatim(street, zip).catch(function (e1) {
      return photon(street, zip).catch(function (e2) {
        throw new Error(e1.message === 'ukendt' || e2.message === 'ukendt' ? 'ukendt' : 'net');
      });
    }).then(function (p) { if (!inDK(p)) throw new Error('ukendt'); return p; });
  }
  function airKm(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function roadKm(a, b) {
    return fetch('https://router.project-osrm.org/route/v1/driving/' + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat + '?overview=false')
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.routes || !j.routes[0]) throw new Error('rute'); return j.routes[0].distance / 1000; })
      .catch(function () { return airKm(a, b) * 1.3; });
  }
  var distTimer = null;
  function showDist() {
    var el = $('disthint');
    var t = { none: '', busy: 'Beregner afstand …',
      ok: dist.km != null ? 'Afstand fra butikken: ca. ' + dist.km.toFixed(1).replace('.', ',') + ' km' +
        (kmFee() ? ' – kørselstillæg ' + kr(kmFee()) + ' (' + extraKm() + ' km ud og hjem ud over de første ' + DEL.baseKm + ' km).' : ' – intet kørselstillæg.') : '',
      far: 'Adressen ligger ca. ' + (dist.km || 0).toFixed(1).replace('.', ',') + ' km fra butikken. Vi leverer desværre kun op til ' + DEL.km + ' km. Ring på ' + CFG.phone + ', så finder vi en løsning.',
      fail: 'Vi kunne ikke finde adressen. Tjek vejnavn, husnummer og postnummer.',
      unknown: 'Vi kunne ikke beregne afstanden lige nu. Du kan stadig bestille' + (DEL.perKm ? '. Ligger adressen over ' + DEL.baseKm + ' km væk, ringer vi om kørselstillægget.' : ', og vi ringer, hvis adressen ligger for langt væk.') }[dist.state];
    el.textContent = t; el.hidden = !t;
    el.classList.toggle('form-error', dist.state === 'far' || dist.state === 'fail');
  }
  function updateDistance() {
    var street = $('o-street').value.trim(), zip = $('o-zip').value.trim();
    var key = street + '|' + zip;
    if (street.length < 4 || !/^\d{4}/.test(zip)) { dist = { km: null, state: 'none', key: '' }; showDist(); render(); return; }
    if (key === dist.key && dist.state !== 'fail' && dist.state !== 'unknown') return;
    dist = { km: null, state: 'busy', key: key }; showDist(); render();
    var known = picked && picked.key === key ? Promise.resolve({ lat: picked.lat, lon: picked.lon }) : geocode(street, zip);
    known.then(function (p) {
      return roadKm(SHOP, p);
    }).then(function (km) {
      if (dist.key !== key) return;
      dist = { km: km, state: DEL.km && km > DEL.km ? 'far' : 'ok', key: key };
      showDist(); render();
    }).catch(function (e) {
      if (dist.key !== key) return;
      dist = { km: null, state: e && e.message === 'net' ? 'unknown' : 'fail', key: key }; showDist(); render();
    });
  }
  // ---------- Adresseforslag mens man skriver (Photon / OpenStreetMap) ----------
  var SUG_KM = 20; // forslag fra alle adresser inden for 20 km
  var picked = null; // { key, lat, lon } når kunden har valgt et forslag
  var sugTimer = null, sugReq = 0, sugItems = [], sugIdx = -1;
  function sugBox() { return $('addr-sug'); }
  function closeSug() { sugBox().hidden = true; sugItems = []; sugIdx = -1; $('o-street').setAttribute('aria-expanded', 'false'); }
  function drawSug() {
    var box = sugBox();
    if (!sugItems.length) { closeSug(); return; }
    box.innerHTML = sugItems.map(function (a, i) {
      return '<li role="option" data-i="' + i + '" aria-selected="' + (i === sugIdx) + '">' + esc(a.line1) + '<small>' + esc(a.line2) + '</small></li>';
    }).join('');
    box.hidden = false; $('o-street').setAttribute('aria-expanded', 'true');
  }
  function fetchSug() {
    var q = $('o-street').value.trim();
    if (q.length < 3) { closeSug(); return; }
    var my = ++sugReq;
    // Søg kun inden for SUG_KM km fra butikken (firkant til søgningen, cirkel bagefter)
    var dLat = SUG_KM / 111.2, dLon = SUG_KM / (111.32 * Math.cos(SHOP.lat * Math.PI / 180));
    var url = 'https://photon.komoot.io/api/?limit=15&lat=' + SHOP.lat + '&lon=' + SHOP.lon +
      '&bbox=' + [SHOP.lon - dLon, SHOP.lat - dLat, SHOP.lon + dLon, SHOP.lat + dLat].map(function (n) { return n.toFixed(4); }).join(',') +
      '&q=' + encodeURIComponent(q);
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (my !== sugReq) return;
      var seen = {};
      sugItems = (j.features || []).map(function (f) {
        var p = f.properties || {}, c = f.geometry && f.geometry.coordinates;
        if (p.countrycode && p.countrycode !== 'DK') return null;
        var street = p.street || (p.type === 'street' ? p.name : '');
        if (!street || !p.postcode || !c) return null;
        if (airKm(SHOP, { lat: c[1], lon: c[0] }) > SUG_KM) return null;
        var line1 = street + (p.housenumber ? ' ' + p.housenumber : '');
        var zip = p.postcode + ' ' + (p.city || p.district || '');
        if (seen[line1 + zip]) return null; seen[line1 + zip] = 1;
        return { line1: line1, line2: zip.trim(), zip: zip.trim(), house: !!p.housenumber, lat: c[1], lon: c[0] };
      }).filter(Boolean).slice(0, 6);
      sugIdx = -1; drawSug();
    }).catch(function () { closeSug(); });
  }
  function pickSug(i) {
    var a = sugItems[i]; if (!a) return;
    closeSug();
    $('o-street').value = a.line1 + (a.house ? '' : ' ');
    $('o-zip').value = a.zip;
    if (a.house) {
      picked = { key: $('o-street').value.trim() + '|' + a.zip, lat: a.lat, lon: a.lon };
      updateDistance();
      $('o-zip').blur();
    } else {
      picked = null;
      $('o-street').focus(); // mangler husnummer
    }
  }
  $('o-street').addEventListener('input', function () { clearTimeout(sugTimer); sugTimer = setTimeout(fetchSug, 250); });
  $('o-street').addEventListener('keydown', function (e) {
    if (sugBox().hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sugIdx = Math.min(sugItems.length - 1, sugIdx + 1); drawSug(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sugIdx = Math.max(0, sugIdx - 1); drawSug(); }
    else if (e.key === 'Enter' && sugIdx >= 0) { e.preventDefault(); pickSug(sugIdx); }
    else if (e.key === 'Escape') closeSug();
  });
  sugBox().addEventListener('mousedown', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    e.preventDefault(); pickSug(Number(li.dataset.i));
  });
  $('o-street').addEventListener('blur', function () { setTimeout(closeSug, 150); });

  ['o-street', 'o-zip'].forEach(function (id) {
    $(id).addEventListener('input', function () { clearTimeout(distTimer); distTimer = setTimeout(updateDistance, 700); });
    $(id).addEventListener('change', updateDistance);
  });

  // Tidspunkter i kvarterer inden for åbningstiden – både afhentning og levering.
  // Dato først, derefter tidspunkt. Der kan bestilles til i dag og i morgen; kun dage med ledige tider vises.
  var DAYS_AHEAD = 2, slotDays = []; // i dag + i morgen
  var MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
  function fillTimes() {
    var dsel = $('o-date'), keepDate = dsel.value, keepTime = $('o-time').value;
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var del = isDelivery();
    var lunchOnly = hasLunch();
    function windowFor(h) {
      var from = h[0] * 60, to = h[1] * 60 - LAST;
      if (del && DEL.from != null) from = Math.max(from, DEL.from * 60);
      if (del && DEL.to != null) to = Math.min(to, DEL.to * 60);
      return [from, to];
    }
    slotDays = [];
    for (var i = 0; i < DAYS_AHEAD; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var h = hoursOn(d); if (!h) continue;
      var w = windowFor(h), slots = [];
      if (i === 0) {
        var lead = del ? (DEL.minutes || 45) : PREP;
        if (mins >= w[0] - lead && mins + lead <= w[1] && mins >= h[0] * 60 && (!lunchOnly || isLunch(d, mins + lead))) {
          slots.push(['asap', 'Hurtigst muligt (ca. ' + lead + ' min)']);
        }
        for (var m = Math.max(Math.ceil((w[0] + lead) / 15) * 15, Math.ceil((mins + lead + 10) / 15) * 15); m <= w[1]; m += 15) {
          if (!lunchOnly || isLunch(d, m)) slots.push([fmt(m), 'kl. ' + fmt(m)]);
        }
      } else {
        // Første tid: når køkkenet (og chaufføren) kan nå det efter åbning
        var first = Math.ceil((w[0] + (del ? (DEL.minutes || 45) : PREP)) / 15) * 15;
        for (var m2 = first; m2 <= w[1]; m2 += 15) {
          if (!lunchOnly || isLunch(d, m2)) slots.push([fmt(m2), 'kl. ' + fmt(m2)]);
        }
      }
      if (!slots.length) continue;
      var lbl = i === 0 ? 'i dag' : i === 1 ? 'i morgen' : DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + MONTHS[d.getMonth()];
      var full = i <= 1 ? lbl + ' (' + DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + MONTHS[d.getMonth()] + ')' : lbl;
      slotDays.push({ key: d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), label: lbl, text: full.charAt(0).toUpperCase() + full.slice(1), slots: slots });
    }
    dsel.innerHTML = slotDays.length
      ? slotDays.map(function (x) { return '<option value="' + x.key + '">' + x.text + '</option>'; }).join('')
      : '<option value="">Ingen ledige dage</option>';
    dsel.disabled = !slotDays.length;
    if (keepDate && slotDays.some(function (x) { return x.key === keepDate; })) dsel.value = keepDate;
    fillSlots(keepTime);
    render();
    var hint = '';
    if (del && slotDays.length) {
      hint = slotDays[0].label === 'i dag'
        ? 'Vi leverer i hele åbningstiden.'
        : (hoursOn(now) ? 'Vi kan ikke nå at levere mere i dag' : 'Vi har lukket i dag') + ', men du kan bestille nu til i morgen.';
    }
    $('delclosed').hidden = !hint;
    $('delclosed').textContent = hint;
    $('lunchhint').hidden = !lunchOnly;
  }
  function chosenDay() {
    var k = $('o-date').value;
    return slotDays.filter(function (x) { return x.key === k; })[0] || null;
  }
  function fillSlots(keep) {
    var sel = $('o-time'), day = chosenDay(), opts = day ? day.slots : [];
    sel.innerHTML = opts.length
      ? opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1].charAt(0).toUpperCase() + o[1].slice(1) + '</option>'; }).join('')
      : '<option value="">Ingen ledige tider</option>';
    sel.disabled = !opts.length;
    if (keep && opts.some(function (o) { return o[0] === keep; })) sel.value = keep;
  }
  $('o-date').addEventListener('change', function () { fillSlots($('o-time').value); render(); });
  $('o-time').addEventListener('change', render);


  // Videre til bestilling
  function showStep(s) {
    $('step-cart').hidden = s !== 'cart';
    $('step-sent').hidden = s !== 'sent';
    $('step-done').hidden = s !== 'done';
  }
  $('orderform').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('o-name').value.trim(), phone = $('o-phone').value.trim(), email = $('o-email').value.trim();
    var street = $('o-street').value.trim(), zip = $('o-zip').value.trim();
    var del = isDelivery();
    var err = $('formerror');
    if (!count()) return;
    var problem = null, focus = null;
    if (!name) { problem = 'Skriv dit navn, så vi ved, hvem maden er til.'; focus = 'o-name'; }
    else if (phone.replace(/\D/g, '').length < 8) { problem = 'Skriv et telefonnummer med 8 cifre, så vi kan ringe, hvis der er spørgsmål.'; focus = 'o-phone'; }
    else if (ONLINE && !EMAIL_RE.test(email)) { problem = 'Skriv din mailadresse, fx navn@mail.dk.'; focus = 'o-email'; }
    else if (ONLINE && $('o-code').value.trim() && !disc.pct) { problem = 'Tryk "Brug" for at bruge rabatkoden, eller slet den.'; focus = 'o-code'; }
    else if (disc.pct && email.toLowerCase() !== disc.email) { problem = 'Du har skiftet mailadresse. Tryk "Brug" ved rabatkoden igen.'; focus = 'o-code'; }
    else if (del && subtotal() < (DEL.minOrder || 0)) { problem = 'Levering kræver køb for mindst ' + kr(DEL.minOrder) + '. Køb for ' + kr(DEL.minOrder - subtotal()) + ' mere, eller vælg afhentning.'; }
    else if (del && street.length < 4) { problem = 'Skriv vejnavn og husnummer, så vi kan finde dig.'; focus = 'o-street'; }
    else if (del && !/^\d{4}/.test(zip)) { problem = 'Skriv postnummer og by, fx 8850 Bjerringbro.'; focus = 'o-zip'; }
    else if (del && dist.state === 'busy') { problem = 'Vent et øjeblik, vi beregner afstanden til din adresse.'; }
    else if (del && dist.state === 'far') { problem = 'Vi leverer desværre kun op til ' + DEL.km + ' km fra butikken. Ring på ' + CFG.phone + '.'; }
    else if (del && dist.state === 'fail') { problem = 'Vi kunne ikke finde adressen. Tjek vejnavn, husnummer og postnummer, eller ring på ' + CFG.phone + '.'; focus = 'o-street'; }
    else if (del && !(document.querySelector('input[name=pay]:checked') || {}).value) { problem = 'Vælg, om du vil betale med MobilePay eller kontant ved levering.'; focus = null; }
    else if (!$('o-time').value) {
      problem = hasLunch() ? 'Frokosttilbud kan kun bestilles mandag–fredag kl. 10–16. Fjern dem fra kurven, eller bestil til en hverdag i frokosttiden.'
              : del ? 'Der er ingen ledige leveringstider lige nu. Ring til os på ' + CFG.phone + '.'
                    : 'Der er ingen ledige tider lige nu. Ring til os på ' + CFG.phone + '.';
    }
    if (problem) {
      err.textContent = problem; err.hidden = false;
      if (focus) $(focus).focus();
      return;
    }
    err.hidden = true;
    var sel = $('o-time'), day = chosenDay();
    var when = (del ? 'Levering ' : 'Afhentning ') + (day ? day.label + ' ' : '') + sel.options[sel.selectedIndex].text.replace(/^./, function (s) { return s.toLowerCase(); });
    var note = $('o-note').value.trim();
    var address = del ? street + ', ' + zip : '';
    var pay = del ? (document.querySelector('input[name=pay]:checked') || {}).value : '';
    if (ONLINE) { sendOrder(name, phone, email, when, address, note, pay); return; }
    var lines = cart.map(function (l) {
      var it = byKey[l.key];
      return l.qty + ' × ' + label(it) + '   ' + kr(it.price * l.qty);
    });
    if (fee()) lines.push('Levering   ' + kr(fee()));
    $('summary').textContent =
      'Bestilling hos Chicken World\n' +
      'Navn: ' + name + '\nTelefon: ' + phone + '\n' + when + (address ? '\nAdresse: ' + address + '\nBetaling: ' + pay : '') + '\n\n' +
      lines.join('\n') + '\n\nI alt: ' + kr(total()) + (note ? '\n\nBemærkning: ' + note : '');
    showStep('done');
    cartEl.scrollTop = 0;
  });
  $('back').addEventListener('click', function () { showStep('cart'); });

  // Gammel "anon"-nøgle (JWT) sendes også som Bearer; ny "publishable"-nøgle kun som apikey
  function apiHeaders() {
    var h = { 'Content-Type': 'application/json', apikey: CFG.supabaseKey };
    if (/^eyJ/.test(CFG.supabaseKey)) h.Authorization = 'Bearer ' + CFG.supabaseKey;
    return h;
  }
  // ---------- Rabatkode ----------
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  function codeHint(text, ok) { var h = $('codehint'); h.textContent = text; h.dataset.ok = ok ? '1' : '0'; h.hidden = !text; }
  function applyCode() {
    var code = $('o-code').value.trim(), email = $('o-email').value.trim();
    disc = { code: '', pct: 0, email: '' }; render();
    if (!code) { codeHint('', true); return; }
    if (!ONLINE) { codeHint('Rabatkoder kan kun bruges, når du bestiller online.', false); return; }
    if (!EMAIL_RE.test(email)) { codeHint('Skriv din mailadresse ovenfor først. Koden gælder én gang pr. mailadresse.', false); $('o-email').focus(); return; }
    var btn = $('o-code-btn'); btn.disabled = true; btn.textContent = '…';
    fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/check_discount', {
      method: 'POST', headers: apiHeaders(), body: JSON.stringify({ p_email: email, p_code: code })
    }).then(function (r) {
      return r.json().then(function (b) {
        if (r.status === 404) throw new Error('Rabatkoder virker ikke lige nu. Ring til os, hvis du har en kode.');
        if (!r.ok) throw new Error(b && b.message ? b.message : 'Koden kunne ikke tjekkes');
        return b;
      });
    }).then(function (pct) {
      disc = { code: code.toLowerCase(), pct: Number(pct) || 0, email: email.toLowerCase() };
      render();
    }).catch(function (e) {
      codeHint(e.message === 'Failed to fetch' ? 'Koden kunne ikke tjekkes. Prøv igen.' : e.message, false);
    }).then(function () { btn.disabled = false; btn.textContent = 'Brug'; });
  }
  $('o-code-btn').addEventListener('click', applyCode);
  $('o-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } });
  $('o-code').addEventListener('input', function () { if (disc.pct) { disc = { code: '', pct: 0, email: '' }; render(); } codeHint('', true); });

  // ---------- Send bestillingen til butikken ----------
  // Levering sendes med i "pickup" (fx "Levering i dag kl. 17.30"), og adressen står øverst i bemærkningen,
  // så ordresiden i butikken kan vise den tydeligt.
  function sendOrder(name, phone, email, when, address, note, pay) {
    var btn = $('orderform').querySelector('button[type=submit]');
    var err = $('formerror');
    var items = cart.map(function (l) {
      var it = byKey[l.key];
      return { qty: l.qty, nr: it.nr, name: it.name, desc: it.desc, size: it.size, section: it.section, price: it.price };
    });
    if (baseFee()) items.push({ qty: 1, nr: '', name: 'Levering', desc: '', size: '', section: '', price: baseFee() });
    if (kmFee()) items.push({ qty: 1, nr: '', name: 'Kørselstillæg', desc: 'ca. ' + dist.km.toFixed(1).replace('.', ',') + ' km fra butikken · ' + extraKm() + ' km × ' + DEL.perKm + ' kr', size: '', section: '', price: kmFee() });
    var off = discount();
    if (off) items.push({ qty: 1, nr: '', name: 'Rabat ' + disc.code.toUpperCase() + ' (' + disc.pct + ' %)', desc: '', size: '', section: '', price: -off });
    var sum = total();
    if (address && dist.state === 'unknown') note = 'OBS: Afstanden kunne ikke beregnes – tjek adresse og kørselstillæg' + (note ? '\n' + note : '');
    var fullNote = (address ? 'Adresse: ' + address + '\nBetaling: ' + pay + (note ? '\n' : '') : '') + note;
    var payload = { p_name: name, p_phone: phone, p_pickup: when.slice(0, 60), p_note: fullNote.slice(0, 500), p_items: items, p_total: sum };
    if (EMAIL_RE.test(email)) payload.p_email = email;
    if (off) { payload.p_code = disc.code; payload.p_discount = off; }
    btn.disabled = true; btn.textContent = 'Sender bestilling …';
    fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/place_order', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok) throw new Error(body && body.message ? body.message : 'Fejl');
        return body;
      });
    }).catch(function (e) {
      // Databasen er ikke opdateret endnu (ingen mail/rabat): send uden mail, hvis der ikke er rabat
      if (off || !/p_email|function|schema|Could not find/i.test(e.message || '')) throw e;
      delete payload.p_email;
      return fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/place_order', { method: 'POST', headers: apiHeaders(), body: JSON.stringify(payload) })
        .then(function (r) { return r.json().then(function (b) { if (!r.ok) throw new Error(b && b.message ? b.message : 'Fejl'); return b; }); });
    }).then(function (id) {
      $('sent-name').textContent = name.split(' ')[0];
      $('sent-id').textContent = id;
      $('sent-time').textContent = when;
      $('sent-where-label').textContent = address ? 'Leveres til' : 'Hentes på';
      $('sent-where').textContent = address || CFG.address;
      $('sent-pay').textContent = (address ? pay + ' ved levering, ' : 'Når du henter, ') + kr(sum);
      cart = []; disc = { code: '', pct: 0, email: '' }; $('o-code').value = ''; $('codehint').hidden = true; render();
      $('o-note').value = '';
      showStep('sent');
      saveOrder({ id: id, phone: phone, first: name.split(' ')[0], when: when, address: address, pay: $('sent-pay').textContent, at: Date.now() });
      watchOrder(id, phone, !!address);
      cartEl.scrollTop = 0;
    }).catch(function (e) {
      err.textContent = 'Bestillingen kunne ikke sendes' + (e.message && e.message !== 'Fejl' && e.message !== 'Failed to fetch' ? ': ' + e.message : '') +
        '. Prøv igen, eller ring på ' + CFG.phone + '.';
      err.hidden = false;
    }).then(function () {
      btn.textContent = 'Send bestilling'; btn.disabled = count() === 0;
    });
  }
  // ---------- Følg ordren: afventer bekræftelse → bekræftet (med tid) / afvist ----------
  // Ordren gemmes i browseren, så status står der stadig, hvis kunden genindlæser siden.
  var watchTimer = null, ORDER_KEY = 'cw-ordre';
  function saveOrder(o) { try { localStorage.setItem(ORDER_KEY, JSON.stringify(o)); } catch (e) {} }
  function forgetOrder() { try { localStorage.removeItem(ORDER_KEY); } catch (e) {} }
  function clockOf(d) { return fmt(d.getHours() * 60 + d.getMinutes()); }
  function watchOrder(id, phone, delivery) {
    clearTimeout(watchTimer);
    var box = $('sent-status'), started = Date.now();
    box.hidden = false;
    function set(state, title, text) {
      box.dataset.state = state;
      $('sent-status-title').textContent = title;
      $('sent-status-text').textContent = text;
      $('sent-badge').textContent = state === 'no' ? '✕' : state === 'wait' ? '…' : '✓';
      $('sent-badge').dataset.state = state;
    }
    set('wait', 'Afventer bekræftelse', 'Butikken har modtaget din bestilling og bekræfter den om et øjeblik. Siden opdaterer sig selv.');
    function poll() {
      fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/order_status', {
        method: 'POST', headers: apiHeaders(), body: JSON.stringify({ p_id: id, p_phone: phone })
      }).then(function (r) {
        if (!r.ok) throw new Error('mangler');
        return r.json();
      }).then(function (rows) {
        var o = rows && rows[0];
        if (!o) throw new Error('mangler');
        var done = false, where = delivery ? 'leveret ved din adresse' : 'klar til afhentning';
        if (o.status === 'ny') {
          set('wait', 'Afventer bekræftelse', 'Butikken har modtaget din bestilling og bekræfter den om et øjeblik. Siden opdaterer sig selv.');
        } else if (o.status === 'afvist' || o.status === 'annulleret') {
          set('no', 'Bestillingen er afvist', 'Desværre kan vi ikke tage imod bestillingen lige nu. Ring på ' + CFG.phone + ', hvis du har spørgsmål.');
          done = true;
        } else if (o.status === 'klar') {
          set('ok', delivery ? 'Din mad er på vej' : 'Din mad er klar', delivery ? 'Chaufføren er på vej til din adresse.' : 'Du kan hente den nu på ' + CFG.address + '.');
          done = true;
        } else if (o.status === 'afhentet') {
          set('ok', 'Tak for din bestilling', 'Velbekomme!'); done = true;
        } else if (o.eta_minutes && o.accepted_at) {
          var at = new Date(new Date(o.accepted_at).getTime() + o.eta_minutes * 60000);
          set('ok', 'Bekræftet · kl. ' + clockOf(at), 'Din mad er ' + where + ' ca. kl. ' + clockOf(at) + ' (' + o.eta_minutes + ' min efter bekræftelsen).');
        } else {
          set('ok', 'Bekræftet', 'Din mad er ' + where + ' ' + $('sent-time').textContent.replace(/^(Levering|Afhentning)\s*/i, '') + '.');
        }
        if (done) setTimeout(forgetOrder, 30 * 60000);
        if (!done && Date.now() - started < 3 * 3600000) watchTimer = setTimeout(poll, 5000);
      }).catch(function (e) {
        if (e.message === 'mangler') { box.hidden = true; forgetOrder(); return; }
        watchTimer = setTimeout(poll, 10000); // netværksfejl: prøv igen
      });
    }
    poll();
  }
  // Vis status igen efter genindlæsning (op til 4 timer efter bestillingen)
  (function resume() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null'); } catch (e) {}
    if (!o || !o.id || Date.now() - o.at > 4 * 3600000) { forgetOrder(); return; }
    $('sent-name').textContent = o.first; $('sent-id').textContent = o.id; $('sent-time').textContent = o.when;
    $('sent-where-label').textContent = o.address ? 'Leveres til' : 'Hentes på';
    $('sent-where').textContent = o.address || CFG.address; $('sent-pay').textContent = o.pay;
    showStep('sent'); openCart();
    watchOrder(o.id, o.phone, !!o.address);
  })();

  $('sent-new').addEventListener('click', function () { clearTimeout(watchTimer); forgetOrder(); closeCart(); showStep('cart'); });
  $('copy').addEventListener('click', function () {
    var text = $('summary').textContent;
    var done = function () { toast('Bestillingen er kopieret'); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(done, selectSummary);
    } else selectSummary();
  });
  function selectSummary() {
    var r = document.createRange(); r.selectNodeContents($('summary'));
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    toast('Teksten er markeret, så du kan kopiere den');
  }
  $('clear').addEventListener('click', function () {
    cart = []; render(); closeCart(); toast('Kurven er tømt');
  });

  if (ONLINE) $('orderform').querySelector('button[type=submit]').textContent = 'Send bestilling';
  render();

  // Hop direkte til en kategori fra et link, fx menu.html#pizza
  if (location.hash && document.querySelector(location.hash)) {
    setTimeout(function () { document.querySelector(location.hash).scrollIntoView(); }, 50);
  }
})();
