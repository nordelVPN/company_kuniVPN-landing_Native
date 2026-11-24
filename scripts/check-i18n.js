const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const dictionaries = require('../src/data/locales.json');
const expectedLanguages = ['bg', 'de', 'en', 'hr', 'hu', 'lt', 'pl', 'ro', 'ru', 'sk', 'sr', 'tr', 'uk'];
assert.deepEqual(Object.keys(dictionaries).sort(), expectedLanguages);
const enKeys = Object.keys(dictionaries.en).sort();
for (const lang of expectedLanguages) {
 assert.deepEqual(Object.keys(dictionaries[lang]).sort(), enKeys, 'Key mismatch for ' + lang);
 for (const [key, value] of Object.entries(dictionaries[lang])) {
  assert.ok(typeof value === 'string' && value.trim().length > 0, 'Empty translation: ' + lang + '.' + key);
 }
}
for (const value of Object.values(dictionaries.en)) assert.ok(value && !/[А-Яа-яЁё]/.test(value));
for (const page of require('../webpack/pages')) {
 const html = fs.readFileSync('build/prod/' + page.name + '.html', 'utf8');
 assert.match(html, /<html lang=(?:"en"|en)[ >]/);
 const withoutKeys = html.replace(/data-i18n(?:-[a-z-]+)?=(?:"[^"]*"|'[^']*'|[^\s>]+)/g, '');
 assert.ok(!/[А-Яа-яЁё]/.test(withoutKeys), 'Non-English rendered content: ' + page.name);
 assert.match(html, /data-language-select/);
}
const source = fs.readFileSync(require.resolve('../src/modules/i18n'), 'utf8');
for (const saved of [null, 'ru', 'pl', 'de', 'uk', 'en', 'unknown', 'blocked']) {
 const attributes = {'data-i18n':'Тарифы','data-i18n-aria-label':'Язык','data-i18n-placeholder':'Поиск по вопросам','data-i18n-content':'Главная · kuniVPN'};
 const element = {getAttribute:key=>attributes[key] ?? null,setAttribute:(key,value)=>{attributes[key]=value;}};
 const handlers = {};
 const options = [];
 const select = {value:'en',replaceChildren:()=>{options.length=0;},appendChild:node=>{options.push(node);},addEventListener:(name,handler)=>{handlers[name]=handler;}};
 const events = [];
 let stored = saved;
 const document = {documentElement:{lang:''},createElement:tag=>({tag}),querySelectorAll:selector=>selector==='[data-language-select]'?[select]:[element],dispatchEvent:event=>events.push(event)};
 const localStorage = {getItem:()=>{if(saved==='blocked')throw Error('blocked');return stored;},setItem:(key,value)=>{assert.equal(key,'kunivpn-language');if(saved==='blocked')throw Error('blocked');stored=value;}};
 const module = {exports:{}};
 vm.runInNewContext(source,{require:()=>dictionaries,module,document,localStorage,window:{CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}}});
 module.exports.init();
 assert.equal(options.length, expectedLanguages.length);
 assert.deepEqual(options.map(o=>o.value).sort(), expectedLanguages);
 const expectedInitial = expectedLanguages.includes(saved) ? saved : 'en';
 assert.equal(document.documentElement.lang, expectedInitial);
 for (const language of Object.keys(dictionaries)) {
  select.value=language;handlers.change();
  assert.equal(document.documentElement.lang,language);
  assert.equal(element.textContent,dictionaries[language]['Тарифы']);
  assert.equal(attributes['aria-label'],dictionaries[language]['Язык']);
  assert.equal(attributes.placeholder,dictionaries[language]['Поиск по вопросам']);
  assert.equal(attributes.content,dictionaries[language]['Главная · kuniVPN']);
  if(saved!=='blocked')assert.equal(stored,language);
  assert.equal(events.at(-1).detail.language,language);
 }
 module.exports.setLanguage('invalid');
 assert.equal(document.documentElement.lang,'en');
 assert.equal(module.exports.t('Windows'),'Windows');
}
console.log('i18n: dictionary parity (13 languages), English HTML, switching, attributes, persistence and storage fallback passed.');
