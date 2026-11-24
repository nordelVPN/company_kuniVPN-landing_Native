const dictionaries = require('../data/locales.json');
const fallback = 'en';
const storageKey = 'kunivpn-language';
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
let language = fallback;
function t(key) {
 if (owns(dictionaries[language], key)) return dictionaries[language][key];
 return owns(dictionaries[fallback], key) ? dictionaries[fallback][key] : key;
}
function translate(root = document) {
 const attributes = ['aria-label', 'placeholder', 'title', 'content'];
 const selector = ['[data-i18n]', ...attributes.map(name => '[data-i18n-' + name + ']')].join(',');
 const elements = [...root.querySelectorAll(selector)];
 if (root.matches?.(selector)) elements.unshift(root);
 for (const element of elements) {
  const key = element.getAttribute('data-i18n');
  if (key !== null) element.textContent = t(key);
  for (const attribute of attributes) {
   const attributeKey = element.getAttribute('data-i18n-' + attribute);
   if (attributeKey !== null) element.setAttribute(attribute, t(attributeKey));
  }
 }
}
function setLanguage(value) {
 language = owns(dictionaries, value) ? value : fallback;
 document.documentElement.lang = language;
 translate();
 for (const select of document.querySelectorAll('[data-language-select]')) select.value = language;
 try { localStorage.setItem(storageKey, language); } catch { /* Storage is optional. */ }
 document.dispatchEvent(new window.CustomEvent('languagechange', { detail: { language } }));
}
function init() {
 for (const select of document.querySelectorAll('[data-language-select]')) {
  if (typeof select.replaceChildren === 'function' && typeof document.createElement === 'function') {
   select.replaceChildren();
   for (const code of Object.keys(dictionaries)) {
    const option = document.createElement('option');
    option.value = code;
    option.lang = code;
    option.textContent = code.toUpperCase();
    select.appendChild(option);
   }
  }
  select.addEventListener('change', () => setLanguage(select.value));
 }
 let saved = fallback;
 try { saved = localStorage.getItem(storageKey) || fallback; } catch { /* Use English. */ }
 setLanguage(saved);
}
module.exports = { t, translate, setLanguage, init };
