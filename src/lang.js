// Language choice shared by every page (portfolio, /card/, /project/): ?lang=tr|en first,
// then what the visitor picked before on this device, otherwise English.
export const LANGS = ['en', 'tr'];

export function initialLang() {
  const asked = new URLSearchParams(window.location.search).get('lang');
  if (LANGS.includes(asked)) return asked;
  try {
    const saved = window.localStorage.getItem('lang');
    if (LANGS.includes(saved)) return saved;
  } catch { /* storage blocked */ }
  return 'en'; // first visit always opens in English
}

export function saveLang(lang) {
  try { window.localStorage.setItem('lang', lang); } catch { /* storage blocked */ }
  document.documentElement.lang = lang;
}


/** Plain-page helper: fills [data-t] (text), [data-t-html] (markup), [data-t-placeholder] and
 *  [data-t-aria] from `dict[lang]`, and draws the EN / TR switch into every [data-lang-switch]. */
export function translatePage(dict, onChange) {
  let lang = initialLang();
  const apply = () => {
    const words = dict[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach((el) => { if (words[el.dataset.t] != null) el.textContent = words[el.dataset.t]; });
    document.querySelectorAll('[data-t-html]').forEach((el) => { if (words[el.dataset.tHtml] != null) el.innerHTML = words[el.dataset.tHtml]; });
    document.querySelectorAll('[data-t-placeholder]').forEach((el) => { if (words[el.dataset.tPlaceholder] != null) el.placeholder = words[el.dataset.tPlaceholder]; });
    document.querySelectorAll('[data-t-aria]').forEach((el) => { if (words[el.dataset.tAria] != null) el.setAttribute('aria-label', words[el.dataset.tAria]); });
    if (words.title) document.title = words.title;
    document.querySelectorAll('[data-lang-switch] button').forEach((button) => button.setAttribute('aria-pressed', String(button.lang === lang)));
    onChange?.(lang, words);
  };
  document.querySelectorAll('[data-lang-switch]').forEach((holder) => {
    holder.setAttribute('role', 'group');
    holder.setAttribute('aria-label', 'Language / Dil');
    holder.innerHTML = LANGS.map((code) => `<button type="button" lang="${code}">${code.toUpperCase()}</button>`).join('<i aria-hidden="true">/</i>');
    holder.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || button.lang === lang) return;
      lang = button.lang;
      saveLang(lang);
      apply();
    });
  });
  apply();
  return () => dict[lang];
}
