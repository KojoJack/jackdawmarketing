/* Prairie Hearing Westwood: shared behaviour for every page.
   Plain JS, no dependencies. Content lives in the HTML itself so search
   engines read it without running any of this. */
(function(){
  "use strict";
  var d = document, root = d.documentElement;
  var header = d.getElementById('header'), burger = d.getElementById('burger');

  /* ---------- header height ----------
     Sticky offsets (anchor jumps, the sticky aside and team photos) follow the
     header's real height, which changes with the text size setting. */
  var wave = d.querySelector('.infobar-wave');
  function syncHeader(){
    // the wavy edge hangs below the header box, so count it too
    var h = header.offsetHeight + (wave ? Math.round(wave.getBoundingClientRect().height) : 0);
    root.style.setProperty('--header-h', h + 'px');
  }
  syncHeader();
  window.addEventListener('resize', syncHeader);
  if(d.fonts && d.fonts.ready) d.fonts.ready.then(syncHeader);

  /* ---------- header state + mobile action bar ----------
     Only a shadow changes on scroll. The header never changes height, so the
     page underneath cannot shift and flicker back and forth near the top. */
  var bar = d.getElementById('actionbar');
  function onScroll(){
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 8);
    if(bar) bar.classList.toggle('show', y > 360);
  }
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
  // tapping anywhere off the header closes the drawer
  d.addEventListener('click', function(e){
    if(header.classList.contains('open') && !header.contains(e.target)) closeMenu();
  });
  d.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && header.classList.contains('open')){ closeMenu(); burger.focus(); }
  });
  // and so does resizing to where the full nav fits again (the menu button
  // hides itself then, via a container query that follows the text size)
  window.addEventListener('resize', function(){
    if(getComputedStyle(burger).display === 'none') closeMenu();
  });

  /* ---------- reveals ---------- */
  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
    }, {rootMargin:'0px 0px -8% 0px', threshold:.06});
    /* Only small, repeated pieces fade in. Long reading blocks (articles, bios,
       the booking form, the map) stay put, and anything already on screen at
       load is never hidden, so nothing flickers on arrival. */
    var fold = window.innerHeight;
    d.querySelectorAll('main .band .band-head, main .band .card, .svc, .svc-row, .quote, .value, .aid, .brand-card, .post-card, main .band .photo')
      .forEach(function(el){
        if(el.closest('.aside')) return;
        if(el.getBoundingClientRect().top < fold) return;
        el.classList.add('reveal'); io.observe(el);
      });
    // stagger siblings inside grids
    d.querySelectorAll('.grid').forEach(function(g){
      Array.prototype.slice.call(g.children).forEach(function(c,i){ c.style.setProperty('--d', Math.min(i,5)*70 + 'ms'); });
    });
  }

  /* ---------- text size control ----------
     The chosen size is remembered between pages. The class itself is set by a
     tiny script in <head> before first paint, so there is no jump on load. */
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
     Service cards on the home page are real links to the full service pages.
     With a normal click they open the matching <dialog> instead; ctrl/cmd or
     middle clicks still open the page. The dialog closes on the X, Esc, or a
     click on the dimmed area around it. */
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
      // a click on the backdrop lands on the dialog element itself
      if(e.target.matches && e.target.matches('dialog.modal[open]')) e.target.close();
    });
  }

  /* ---------- booking form ----------
     The form is a plain iframe rather than JotForm's own embed script, which
     holds up the whole page until JotForm answers. JotForm posts its height
     as the form grows, so the frame is resized to match and never scrolls
     inside itself. If it never arrives, the phone-and-email card takes over. */
  // JotForm posts its height as the form grows; resize whichever frame sent it
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
    /* The frame never scrolls, so it has to be tall enough for the whole form.
       JotForm's height message is unreliable -- often it sends only
       "formSettled" and no height at all -- so the frame is given generous room
       as soon as the form loads rather than waiting on a message that may never
       come and leaving the bottom of the form unreachable. If a height does
       arrive it wins, shrinking the frame to an exact fit. */
    var sized = false;
    frame.addEventListener('phw:sized', function(){ sized = true; });
    frame.addEventListener('load', function(){
      if(!sized && !frame.style.height) frame.style.height = '2400px';
    });
    setTimeout(function(){
      if(wrap && !wrap.classList.contains('loaded')){
        var host = frame.closest('#book') || frame.closest('.modal-book');
        if(host) host.classList.add('no-form');   // falls back to phone + email
      }
    }, 9000);
  }
  var inlineForm = d.getElementById('jotform');
  if(inlineForm) watchForm(inlineForm);

  /* Booking pop-up: "Book a visit" opens the form on the page the visitor is
     already on. Loading starts as soon as someone looks like they are heading
     for it — hover, keyboard focus, touch, or an in-page button coming into
     view — so by the time they click, the form is usually already there.
     Nothing is fetched for visitors who never go near a booking button. */
  var bookLinks = Array.prototype.slice.call(
    d.querySelectorAll('a[data-book], a[href$="contact.html#book"], a[href="#book"]'));
  var bookDlg = d.getElementById('book-dialog');
  if(bookDlg && bookLinks.length){
    var bookFrame = bookDlg.querySelector('iframe.jotform');
    var primed = false;
    /* JotForm only reports its height while the form is actually laid out, and
       a closed dialog is not laid out at all. So the form preloads in a dialog
       that is open but parked off-screen, invisible and inert: JotForm gets a
       real width to measure, sends its height, and the frame is sized to fit.
       With the frame exactly as tall as the form there is nothing to scroll
       inside it, so the wheel always scrolls the pop-up itself. */
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
      if(bookDlg.open) bookDlg.close();   // swap the off-screen dialog for a real one
      bookDlg.showModal();                // same element, so the form is not reloaded
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
    // Buttons sitting in the page count as intent when they scroll into view.
    // The header and the bottom bar are always on screen, so they do not.
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
