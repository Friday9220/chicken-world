// Chicken World – menu, kurv og bestilling
(function () {
  var MENU = window.CW_MENU || [];
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
    return p.map(function (v, i) { return { label: (sec.sizes || [])[i] || '', price: v }; })
            .filter(function (x) { return x.price != null; });
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
      pricesOf(sec, item).forEach(function (p) {
        var key = sec.id + '|' + i + '|' + p.label;
        byKey[key] = {
          key: key, nr: nr, name: name, desc: desc, size: p.label, price: p.price, lunch: !!sec.lunch,
          section: sec.lunch ? 'Frokost' : (sec.id === 'pizza' || sec.id === 'kylling' || sec.id === 'burgere' ? '' : sec.title)
        };
        html += '<button class="price" type="button" data-key="' + esc(key) + '" aria-label="Læg ' +
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
  function hoursOn(d) { return HOURS[d.getDay()] || null; }
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
  cart = cart.filter(function (l) { return byKey[l.key]; });

  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (e) {} }
  function subtotal() { return cart.reduce(function (s, l) { return s + byKey[l.key].price * l.qty; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function isDelivery() { var r = document.querySelector('input[name=mode]:checked'); return r && r.value === 'levering'; }
  function fee() { return isDelivery() && subtotal() < DEL.freeFrom ? DEL.fee : 0; }
  function total() { return subtotal() + fee(); }
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
    $('fee').textContent = fee() ? kr(fee()) : 'Gratis';
    var missing = DEL.freeFrom - subtotal();
    $('freehint').hidden = !del || n === 0 || missing <= 0;
    $('freehint').textContent = 'Køb for ' + kr(missing) + ' mere, så er leveringen gratis.';
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
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty++; else cart.push({ key: key, qty: 1 });
    render();
    bump(btn, 'is-added');
    bump($('cartbtn'), 'is-bump');
    toast(byKey[key].name + ' er lagt i kurven');
  });

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
      $('time-label').textContent = del ? 'Levering' : 'Afhentning';
      render(); fillTimes();
    });
  });

  // Tidspunkter i kvarterer inden for åbningstiden (og leveringstiden)
  function fillTimes() {
    var sel = $('o-time'), keep = sel.value;
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var del = isDelivery();
    var lunchOnly = hasLunch();
    var opts = [];
    var day = nextOpenDay(now, 0);

    function windowFor(h) {
      var from = h[0] * 60, to = h[1] * 60 - LAST;
      if (del) { from = Math.max(from, DEL.from * 60); to = Math.min(to, DEL.to * 60); }
      return [from, to];
    }
    // I dag, hvis der stadig kan bestilles
    var today = hoursOn(now), w;
    if (today) {
      w = windowFor(today);
      var lead = del ? (DEL.minutes || 45) : PREP;
      if (mins >= w[0] - lead && mins + lead <= w[1] && mins >= today[0] * 60) {
        var asapLunch = isLunch(now, mins + lead);
        if (!lunchOnly || asapLunch) opts.push(['asap', 'Hurtigst muligt (ca. ' + lead + ' min)']);
      }
      for (var m = Math.max(w[0], Math.ceil((mins + lead + 10) / 15) * 15); m <= w[1]; m += 15) {
        if (lunchOnly && !isLunch(now, m)) continue;
        opts.push([fmt(m), 'I dag kl. ' + fmt(m)]);
      }
    }
    // Ellers næste åbningsdag (fx "i morgen") for afhentning.
    // Levering: altid både resten af i dag og næste åbningsdag (fx "i morgen"), kl. 16–20
    var nextDay = false, next = null;
    if (!opts.length || del) {
      nextDay = !opts.length;
      next = nextOpenDay(now, 1);
      if (next) {
        w = windowFor(next.hours);
        var cap = next.label.charAt(0).toUpperCase() + next.label.slice(1);
        for (var m2 = del ? w[0] : w[0] + 15; m2 <= w[1]; m2 += 15) {
          if (lunchOnly && !isLunch(next.date, m2)) continue;
          opts.push(['n' + fmt(m2), cap + ' kl. ' + fmt(m2)]);
        }
      }
    }
    sel.innerHTML = opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('');
    sel.disabled = !opts.length;
    if (!opts.length) sel.innerHTML = '<option value="">' + 'Ingen ledige tider' + '</option>';
    // Man kan altid bestille levering; selve leveringen sker kun i leveringstiden
    var hint = '';
    if (del && opts.length) {
      if (nextDay && next) hint = (today ? 'Vi kan ikke nå at levere mere i dag' : 'Vi har lukket i dag') + ', men du kan bestille nu til levering ' + next.label + ' kl. ' + DEL.from + '–' + DEL.to + '.';
      else if (next) hint = 'Vælg levering i dag eller ' + next.label + ' mellem kl. ' + DEL.from + ' og ' + DEL.to + '.';
    }
    $('delclosed').hidden = !hint;
    $('delclosed').textContent = hint;
    $('lunchhint').hidden = !lunchOnly;
    if (keep && opts.some(function (o) { return o[0] === keep; })) sel.value = keep;
  }

  // Videre til bestilling
  function showStep(s) {
    $('step-cart').hidden = s !== 'cart';
    $('step-sent').hidden = s !== 'sent';
    $('step-done').hidden = s !== 'done';
  }
  $('orderform').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('o-name').value.trim(), phone = $('o-phone').value.trim();
    var street = $('o-street').value.trim(), zip = $('o-zip').value.trim();
    var del = isDelivery();
    var err = $('formerror');
    if (!count()) return;
    var problem = null, focus = null;
    if (!name) { problem = 'Skriv dit navn, så vi ved, hvem maden er til.'; focus = 'o-name'; }
    else if (phone.replace(/\D/g, '').length < 8) { problem = 'Skriv et telefonnummer med 8 cifre, så vi kan ringe, hvis der er spørgsmål.'; focus = 'o-phone'; }
    else if (del && street.length < 4) { problem = 'Skriv vejnavn og husnummer, så vi kan finde dig.'; focus = 'o-street'; }
    else if (del && !/^\d{4}/.test(zip)) { problem = 'Skriv postnummer og by, fx 8850 Bjerringbro.'; focus = 'o-zip'; }
    else if (del && !(document.querySelector('input[name=pay]:checked') || {}).value) { problem = 'Vælg, om du vil betale med MobilePay eller kontant ved levering.'; focus = null; }
    else if (!$('o-time').value) {
      problem = del ? 'Der er ingen ledige leveringstider lige nu. Ring til os på ' + CFG.phone + '.'
                    : 'Der er ingen ledige tider lige nu. Ring til os på ' + CFG.phone + '.';
    }
    if (problem) {
      err.textContent = problem; err.hidden = false;
      if (focus) $(focus).focus();
      return;
    }
    err.hidden = true;
    var sel = $('o-time');
    var when = (del ? 'Levering ' : 'Afhentning ') + sel.options[sel.selectedIndex].text.replace(/^./, function (s) { return s.toLowerCase(); });
    var note = $('o-note').value.trim();
    var address = del ? street + ', ' + zip : '';
    var pay = del ? (document.querySelector('input[name=pay]:checked') || {}).value : '';
    if (ONLINE) { sendOrder(name, phone, when, address, note, pay); return; }
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
  // ---------- Send bestillingen til butikken ----------
  // Levering sendes med i "pickup" (fx "Levering i dag kl. 17.30"), og adressen står øverst i bemærkningen,
  // så ordresiden i butikken kan vise den tydeligt.
  function sendOrder(name, phone, when, address, note, pay) {
    var btn = $('orderform').querySelector('button[type=submit]');
    var err = $('formerror');
    var items = cart.map(function (l) {
      var it = byKey[l.key];
      return { qty: l.qty, nr: it.nr, name: it.name, desc: it.desc, size: it.size, section: it.section, price: it.price };
    });
    if (fee()) items.push({ qty: 1, nr: '', name: 'Levering', desc: '', size: '', section: '', price: fee() });
    var sum = total();
    var fullNote = (address ? 'Adresse: ' + address + '\nBetaling: ' + pay + (note ? '\n' : '') : '') + note;
    btn.disabled = true; btn.textContent = 'Sender bestilling …';
    fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/place_order', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ p_name: name, p_phone: phone, p_pickup: when.slice(0, 60), p_note: fullNote.slice(0, 500), p_items: items, p_total: sum })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok) throw new Error(body && body.message ? body.message : 'Fejl');
        return body;
      });
    }).then(function (id) {
      $('sent-name').textContent = name.split(' ')[0];
      $('sent-id').textContent = id;
      $('sent-time').textContent = when;
      $('sent-where-label').textContent = address ? 'Leveres til' : 'Hentes på';
      $('sent-where').textContent = address || CFG.address;
      $('sent-pay').textContent = (address ? pay + ' ved levering, ' : 'Når du henter, ') + kr(sum);
      cart = []; render();
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
