/* Prairie Hearing Westwood ("Westwood" style): shared behaviour for every page.
   Plain JS, no dependencies. Content lives in the HTML itself so search
   engines read it without running any of this. The menu, text size, pop-ups
   and booking form work exactly as in the main build; the motion layer
   (photo fades, word reveals, slider, count-up) is new. */
(function(){
  "use strict";
  var d = document, root = d.documentElement;
  var header = d.getElementById('header'), burger = d.getElementById('burger');
  var motion = root.classList.contains('motion');

  /* ---------- header height ----------
     Sticky offsets (anchor jumps, the sticky aside and team photos) follow the
     header's real height, which changes with the text size setting. */
  function syncHeader(){ root.style.setProperty('--header-h', header.offsetHeight + 'px'); }
  syncHeader();
  window.addEventListener('resize', syncHeader);
  if(d.fonts && d.fonts.ready) d.fonts.ready.then(syncHeader);

  /* ---------- header state + mobile action bar ----------
     Only a shadow changes on scroll. The header never changes height, so the
     page underneath cannot shift and flicker back and forth near the top. */
  var bar = d.getElementById('actionbar');
  var smallScreen = window.matchMedia('(max-width:1040px)');
  function onScroll(){
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 8);
    if(bar) bar.classList.toggle('show', smallScreen.matches || y > 360);
  }
  if(smallScreen.addEventListener) smallScreen.addEventListener('change', onScroll);
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- menu ---------- */
  function closeMenu(){
    if(!header.classList.contains('open')) return;
    header.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
  }
  burger.addEventListener('click', function(e){
    e.stopPropagation();
    var open = header.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  d.addEventListener('click', function(e){
    if(header.classList.contains('open') && !header.contains(e.target)) closeMenu();
  });
  d.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && header.classList.contains('open')){ closeMenu(); burger.focus(); }
  });
  window.addEventListener('resize', function(){
    if(getComputedStyle(burger).display === 'none') closeMenu();
  });

  /* ---------- scroll motion ----------
     Only pieces that start below the fold are hidden and revealed, so nothing
     on screen at load ever blinks out. Long reading blocks (articles, bios,
     the booking form, the map) never move. */
  if(motion && 'IntersectionObserver' in window){
    var fold = window.innerHeight;
    var below = function(el){ return el.getBoundingClientRect().top > fold * 0.92; };
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        e.target.classList.remove('is-pending');
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, {rootMargin:'0px 0px -10% 0px', threshold:.08});
    var watch = function(el, cls){ if(below(el)){ if(cls) el.classList.add(cls); io.observe(el); } };

    // photos fade gently in
    d.querySelectorAll('main .fade').forEach(function(el){ watch(el, 'is-pending'); });

    // section headings rise word by word (text nodes are split; <em> etc. kept)
    d.querySelectorAll('main .band h2, main .band-head h2').forEach(function(h){
      if(h.closest('.prose, .card, .modal, .post-card, .person')) return;
      if(!below(h)) return;
      var n = 0;
      (function walk(node){
        Array.prototype.slice.call(node.childNodes).forEach(function(c){
          if(c.nodeType === 3){
            var frag = d.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function(part){
              if(!part) return;
              if(/^\s+$/.test(part)){ frag.appendChild(d.createTextNode(part)); return; }
              var w = d.createElement('span'); w.className = 'w';
              var i = d.createElement('span'); i.textContent = part; i.style.setProperty('--wi', n++);
              w.appendChild(i); frag.appendChild(w);
            });
            node.replaceChild(frag, c);
          } else if(c.nodeType === 1){ walk(c); }
        });
      })(h);
      h.setAttribute('aria-label', h.textContent.replace(/\s+/g,' ').trim());
      h.classList.add('split-words'); io.observe(h);
    });

    // rules that draw in
    d.querySelectorAll('main .eyebrow, main .tick, .fv-steps li').forEach(function(el){
      if(el.closest('.hero, .page-hero')) return;
      watch(el, 'draw');
    });

    // smaller repeated pieces fade up, staggered inside their row
    d.querySelectorAll('.svc-body, .fv-steps li, .value, .aid, .brand-card, .post-card, .card, .cred, .checks li, .gallery figcaption, .section-head p, .split .lede, .split .btn-row, .slider')
      .forEach(function(el){
        if(el.closest('.aside, .modal, .hero, .page-hero')) return;
        watch(el, 'reveal');
      });
    d.querySelectorAll('.grid, .values, .fv-steps, .checks, .svc-grid').forEach(function(g){
      Array.prototype.slice.call(g.children).forEach(function(c, i){ c.style.setProperty('--d', Math.min(i, 5) * 90 + 'ms'); });
    });

    // numbers count up once when they come into view
    var counts = d.querySelectorAll('[data-count]');
    if(counts.length){
      var cio = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(!e.isIntersecting) return;
          cio.unobserve(e.target);
          var el = e.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = null;
          var step = function(t){
            if(t0 === null) t0 = t;
            var k = Math.min((t - t0) / 1400, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
            if(k < 1) requestAnimationFrame(step);
          };
          el.textContent = '0';
          requestAnimationFrame(step);
        });
      }, {threshold:.6});
      counts.forEach(function(c){ cio.observe(c); });
    }
  }

  /* ---------- review slider ----------
     All reviews are in the HTML. With JavaScript they stack into one
     crossfading slot with arrows, dots and swipe. It never advances on its
     own, so nobody is rushed mid-sentence. */
  d.querySelectorAll('[data-slider]').forEach(function(sl){
    var slides = Array.prototype.slice.call(sl.querySelectorAll('.slide'));
    var dots = sl.querySelector('.dots');
    if(slides.length < 2 || !dots) return;
    sl.classList.add('js-slider');
    var cur = 0;
    slides.forEach(function(_, n){
      var b = d.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show review ' + (n + 1) + ' of ' + slides.length);
      b.addEventListener('click', function(){ show(n); });
      dots.appendChild(b);
    });
    function show(n){
      cur = (n + slides.length) % slides.length;
      slides.forEach(function(s, k){
        var on = k === cur;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      Array.prototype.forEach.call(dots.children, function(b, k){ b.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
    }
    sl.querySelector('.prev').addEventListener('click', function(){ show(cur - 1); });
    sl.querySelector('.next').addEventListener('click', function(){ show(cur + 1); });
    sl.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ show(cur - 1); } else if(e.key === 'ArrowRight'){ show(cur + 1); }
    });
    var x0 = null;
    sl.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
    sl.addEventListener('touchend', function(e){
      if(x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if(Math.abs(dx) > 45) show(cur + (dx < 0 ? 1 : -1));
    });
    show(0);
  });

  /* ---------- text size control ----------
     The chosen size is remembered between pages (and shared with the main
     build). The class itself is set in <head> before first paint. */
  var KEY = 'phw-text-size';
  var tsClasses = ['', 'ts-2', 'ts-3'];
  var tsNames   = ['Normal', 'Large', 'Largest'];
  var tsOpts = Array.prototype.slice.call(d.querySelectorAll('.ts-opt'));
  var tsWrap = d.getElementById('ts-opts');
  var tsLive = d.getElementById('ts-live');
  var tsCurrent = root.classList.contains('ts-3') ? 2 : root.classList.contains('ts-2') ? 1 : 0;

  function setTextSize(i, moveFocus, announce){
    tsCurrent = i;
    root.classList.remove('ts-2','ts-3');
    if(tsClasses[i]) root.classList.add(tsClasses[i]);
    tsWrap.setAttribute('data-active', i);
    tsOpts.forEach(function(b, n){
      b.setAttribute('aria-checked', n === i ? 'true' : 'false');
      b.tabIndex = n === i ? 0 : -1;
    });
    try{ localStorage.setItem(KEY, String(i)); }catch(err){}
    syncHeader();
    if(announce) tsLive.textContent = 'Text size: ' + tsNames[i];
    if(moveFocus) tsOpts[i].focus();
  }
  if(tsWrap){
    setTextSize(tsCurrent, false, false);
    tsOpts.forEach(function(btn, i){
      btn.addEventListener('click', function(){ setTextSize(i, false, true); });
    });
    tsWrap.addEventListener('keydown', function(e){
      var k = e.key, next = null;
      if(k === 'ArrowRight' || k === 'ArrowDown') next = Math.min(tsCurrent + 1, 2);
      else if(k === 'ArrowLeft' || k === 'ArrowUp') next = Math.max(tsCurrent - 1, 0);
      else if(k === 'Home') next = 0;
      else if(k === 'End') next = 2;
      if(next !== null){ e.preventDefault(); setTextSize(next, true, true); }
    });
  }

  /* ---------- service pop-ups ----------
     Service cards are real links to the full service pages. A normal click
     opens the matching <dialog> instead; ctrl/cmd or middle clicks still open
     the page. Closes on the X, Esc, or a click on the dimmed backdrop. */
  if(typeof HTMLDialogElement === 'function'){
    d.addEventListener('click', function(e){
      var trigger = e.target.closest('[data-modal]');
      if(trigger){
        if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var dlg = d.getElementById(trigger.getAttribute('data-modal'));
        if(dlg && typeof dlg.showModal === 'function'){
          e.preventDefault();
          dlg.showModal();
          dlg.scrollTop = 0;
        }
        return;
      }
      if(e.target.closest('[data-close]')){ e.target.closest('dialog').close(); return; }
      if(e.target.matches && e.target.matches('dialog.modal[open]')) e.target.close();
    });
  }

  /* ---------- booking form ----------
     A plain iframe rather than JotForm's embed script (which holds up the
     whole page). JotForm posts its height; the frame is resized to match and
     never scrolls inside itself. If it never loads, phone + email take over. */
  window.addEventListener('message', function(e){
    var host = '';
    try{ host = new URL(e.origin).hostname; }catch(err){ return; }
    if(host !== 'jotform.com' && host.slice(-12) !== '.jotform.com') return;
    if(typeof e.data !== 'string' || e.data.indexOf('setHeight') !== 0) return;
    var h = parseInt(e.data.split(':')[1], 10);
    if(!(h > 0)) return;
    Array.prototype.forEach.call(d.querySelectorAll('iframe.jotform'), function(f){
      if(f.contentWindow !== e.source) return;
      f.style.height = h + 'px';
      f.dispatchEvent(new CustomEvent('phw:sized'));
    });
  });

  function watchForm(frame){
    var wrap = frame.closest('.jotform-wrap');
    frame.addEventListener('load', function(){ if(wrap) wrap.classList.add('loaded'); });
    // JotForm's height message is unreliable, so give generous room on load;
    // a reported height always wins and shrinks the frame to an exact fit
    var sized = false;
    frame.addEventListener('phw:sized', function(){ sized = true; });
    frame.addEventListener('load', function(){
      if(!sized && !frame.style.height) frame.style.height = '2400px';
    });
    setTimeout(function(){
      if(wrap && !wrap.classList.contains('loaded')){
        var host = frame.closest('#book') || frame.closest('.modal-book');
        if(host) host.classList.add('no-form');
      }
    }, 9000);
  }
  var inlineForm = d.getElementById('jotform');
  if(inlineForm) watchForm(inlineForm);

  /* Booking pop-up: "Book a visit" opens the form on the current page.
     Loading starts only on intent (hover, focus, touch, or an in-page button
     scrolling into view), so her JotForm view counts stay honest. */
  var bookLinks = Array.prototype.slice.call(d.querySelectorAll('a[data-book]'));
  var bookDlg = d.getElementById('book-dialog');
  if(bookDlg && bookLinks.length){
    var bookFrame = bookDlg.querySelector('iframe.jotform');
    var primed = false;
    /* JotForm only reports its height while laid out ON SCREEN, so the form
       preloads in a dialog that is open but invisible and inert. */
    var primeBooking = function(){
      if(primed) return;
      primed = true;
      bookDlg.classList.add('preloading');
      bookDlg.setAttribute('inert', '');
      bookDlg.setAttribute('aria-hidden', 'true');
      if(!bookDlg.open && typeof bookDlg.show === 'function') bookDlg.show();
      bookFrame.src = bookFrame.getAttribute('data-src');
      watchForm(bookFrame);
    };
    var openBooking = function(){
      primeBooking();
      bookDlg.removeAttribute('inert');
      bookDlg.removeAttribute('aria-hidden');
      bookDlg.classList.remove('preloading');
      if(bookDlg.open) bookDlg.close();
      bookDlg.showModal();
    };
    bookLinks.forEach(function(link){
      link.addEventListener('pointerenter', primeBooking);
      link.addEventListener('focus', primeBooking);
      link.addEventListener('touchstart', primeBooking, {passive:true});
      link.addEventListener('click', function(e){
        if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        openBooking();
      });
    });
    if('IntersectionObserver' in window){
      var nearBook = new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ primeBooking(); nearBook.disconnect(); } });
      }, {rootMargin:'200px'});
      bookLinks.forEach(function(l){
        if(!l.closest('.header') && !l.closest('.actionbar')) nearBook.observe(l);
      });
    }
  } else if(bookLinks.length && d.getElementById('book')){
    // on the contact page the form is already here, so scroll to it
    bookLinks.forEach(function(link){
      link.addEventListener('click', function(e){
        if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        d.getElementById('book').scrollIntoView({behavior:'smooth', block:'start'});
        try{ history.replaceState(null, '', '#book'); }catch(err){}
      });
    });
  }

  /* ---------- opening hours: mark today ---------- */
  var today = new Date().getDay(); // 0 = Sunday
  d.querySelectorAll('.hours li[data-day="' + today + '"]').forEach(function(li){ li.classList.add('today'); });

  /* ---------- footer year ---------- */
  d.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });
})();
