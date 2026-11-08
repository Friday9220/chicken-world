// Chicken World – åbent/lukket og scroll-animationer
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  // "Åbent nu til kl. 20.00" / "Lukket nu · åbner i morgen kl. 10.00"
  var CFG = window.CW_CONFIG || {}, HOURS = CFG.hours || {}, SPECIAL = CFG.specialHours || {};
  var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var hoursOn = function (d) { var k = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); return k in SPECIAL ? SPECIAL[k] : (HOURS[d.getDay()] || null); };
  var st = document.getElementById('openstatus');
  if (st) {
    var DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    var now = new Date(), mins = now.getHours() * 60 + now.getMinutes(), h = hoursOn(now);
    var t = function (hr) { return (hr < 10 ? '0' : '') + hr + '.00'; };
    if (h && mins >= h[0] * 60 && mins < h[1] * 60) {
      st.innerHTML = '<span class="dot"></span> Åbent nu til kl. ' + t(h[1]);
    } else {
      for (var i = (h && mins < h[0] * 60) ? 0 : 1; i < 8; i++) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), n = hoursOn(d);
        if (n) {
          st.innerHTML = '<span class="dot is-closed"></span> Lukket nu · åbner ' + (i === 0 ? 'i dag' : i === 1 ? 'i morgen' : DAYS[d.getDay()]) + ' kl. ' + t(n[0]);
          break;
        }
      }
    }
  }

  // Elementer glider ind, når de kommer i syne
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  if (reduce) return;

  var rows = document.querySelectorAll('.marquee__row');
  var spinners = document.querySelectorAll('[data-spin]');
  var parallax = document.querySelectorAll('[data-parallax]');
  var box = document.querySelector('[data-float]');
  var t0 = performance.now();

  function frame(now) {
    var y = window.scrollY;
    var t = (now - t0) / 1000;

    // Tekstbånd kører af sig selv og skubbes ekstra af scroll
    rows.forEach(function (row) {
      var dir = Number(row.dataset.dir);
      var half = row.scrollWidth / 2;
      var x = ((t * 60 + y * 0.6) % half);
      row.style.transform = 'translateX(' + (dir < 0 ? -x : x - half) + 'px)';
    });

    // Kyllingelåret drejer, når man scroller
    spinners.forEach(function (el) {
      el.style.rotate = (y * 0.25) + 'deg';
    });

    parallax.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var c = r.top + r.height / 2 - window.innerHeight / 2;
      var max = r.height * 0.06; // billedet er skaleret 1.15, så det kan flytte sig lidt uden at kanten ses
      var off = Math.max(-max, Math.min(max, c * Number(el.dataset.parallax)));
      el.style.transform = 'translateY(' + off + 'px) scale(1.15)';
    });

    // Æsken svæver og vipper
    if (box) {
      var bob = Math.sin(t * 1.4) * 14;
      var tilt = Math.sin(t * 0.9) * 8;
      box.style.transform = 'translateY(' + bob + 'px) rotateX(52deg) rotateZ(' + (-18 + tilt + y * 0.02) + 'deg)';
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
