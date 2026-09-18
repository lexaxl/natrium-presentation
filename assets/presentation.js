/*
 * Сценарии прототипа: кнопки слева ведут сайт в телефоне к нужному месту.
 * Прототип лежит на том же адресе, поэтому страница внутри рамки доступна скрипту.
 */
(function () {
  var frame = document.getElementById('phone-frame');
  var buttons = document.querySelectorAll('[data-scenario]');
  if (!frame || !buttons.length) return;

  var smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  var landing = frame.getAttribute('src');

  function doc() {
    try { return frame.contentDocument; } catch (e) { return null; }
  }

  function closeSheet(d) {
    var sheet = d.querySelector('dialog[open]');
    if (sheet) sheet.close();
  }

  function reveal(d, selector, offset) {
    var el = d.querySelector(selector);
    if (!el) return;
    var top = el.getBoundingClientRect().top + d.defaultView.scrollY - (offset || 0);
    d.defaultView.scrollTo({ top: top, behavior: smooth });
  }

  var scenarios = {
    top: function (d) { d.defaultView.scrollTo({ top: 0, behavior: smooth }); },
    gallery: function (d) { reveal(d, '[data-gallery-rail]', 120); },
    pricing: function (d) { reveal(d, '[data-pricing]', 64); },
    form: function (d) {
      reveal(d, '[data-pricing]', 64);
      var cta = d.querySelector('.card-price__cta');
      setTimeout(function () { if (cta) cta.click(); }, smooth === 'smooth' ? 500 : 0);
    },
    inline: function (d) { reveal(d, '#lead-form', 64); },
    // Нажатие на пустой встроенной форме: ошибки под полями, как их увидит человек.
    errors: function (d) {
      reveal(d, '#lead-form', 64);
      var submit = d.querySelector('#lead-form .lead-form__submit');
      setTimeout(function () { if (submit) submit.click(); }, smooth === 'smooth' ? 500 : 0);
    },
    footer: function (d) { reveal(d, '[data-footer]', 0); },
    policy: null
  };

  function run(name) {
    var d = doc();
    if (name === 'policy') {
      return;
    }
    var onLanding = d && d.querySelector('[data-hero]');
    if (!onLanding) {
      frame.addEventListener('load', function once() {
        frame.removeEventListener('load', once);
        run(name);
      });
      frame.setAttribute('src', landing);
      return;
    }
    closeSheet(d);
    scenarios[name](d);
  }

  buttons.forEach(function (button) {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', function () {
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
      run(button.getAttribute('data-scenario'));
    });
  });
})();
