const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const dictionaries = require('../src/data/locales.json');
assert.deepEqual(Object.keys(dictionaries).sort(), ['en', 'ru']);
assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.ru).sort());
for (const value of Object.values(dictionaries.en)) assert.ok(value && !/[А-Яа-яЁё]/.test(value));
for (const page of require('../webpack/pages')) {
 const html = fs.readFileSync('build/prod/' + page.name + '.html', 'utf8');
 assert.match(html, /<html lang=(?:"en"|en)[ >]/);
 const withoutKeys = html.replace(/data-i18n(?:-[a-z-]+)?=(?:"[^"]*"|'[^']*'|[^\s>]+)/g, '');
 assert.ok(!/[А-Яа-яЁё]/.test(withoutKeys), 'Non-English rendered content: ' + page.name);
 assert.match(html, /data-language-select/);
}
const source = fs.readFileSync(require.resolve('../src/modules/i18n'), 'utf8');
for (const saved of [null, 'ru', 'en', 'unknown', 'blocked']) {
 const attributes = {'data-i18n':'Тарифы','data-i18n-aria-label':'Язык','data-i18n-placeholder':'Поиск по вопросам','data-i18n-content':'Главная · kuniVPN'};
 const element = {getAttribute:key=>attributes[key] ?? null,setAttribute:(key,value)=>{attributes[key]=value;}};
 const handlers = {};
 const select = {value:'en',addEventListener:(name,handler)=>{handlers[name]=handler;}};
 const events = [];
 let stored = saved;
 const document = {documentElement:{lang:''},querySelectorAll:selector=>selector==='[data-language-select]'?[select]:[element],dispatchEvent:event=>events.push(event)};
 const localStorage = {getItem:()=>{if(saved==='blocked')throw Error('blocked');return stored;},setItem:(key,value)=>{assert.equal(key,'kunivpn-language');if(saved==='blocked')throw Error('blocked');stored=value;}};
 const module = {exports:{}};
 vm.runInNewContext(source,{require:()=>dictionaries,module,document,localStorage,window:{CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}}});
 module.exports.init();
 assert.equal(document.documentElement.lang,saved==='ru'?'ru':'en');
 for (const language of ['ru','en']) {
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
console.log('i18n: dictionary parity, English HTML, EN/RU switching, attributes, persistence and storage fallback passed.');
