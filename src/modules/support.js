const {t}=require('./i18n');
function initSupport(){
 const input=document.querySelector('[data-search]');if(!input)return;
 const cards=[...document.querySelectorAll('[data-topic-card]')],result=document.querySelector('[data-results]'),help=document.querySelector('[data-topic-help]');let category='all',selected='';
 const answers={start:'Официальные ссылки на приложения появятся после выпуска. Сейчас загрузка недоступна.',billing:'Тарифы опубликованы в разделе «Тарифы». Валюта и часть условий пока не заданы; этот сайт не принимает платежи.',trouble:'Вход появится после подключения сервиса авторизации. Сейчас доступен прототип интерфейса.',contact:'A support contact has not been published yet. Please check this section for updates.'};
 const update=()=>{const term=input.value.trim().toLocaleLowerCase(document.documentElement.lang);let count=0;
 for(const card of cards){card.hidden=!(category==='all'||card.dataset.topicCard===category)||!card.textContent.toLocaleLowerCase(document.documentElement.lang).includes(term);if(!card.hidden)count++;}
 result.textContent=category==='all'&&!term?'':count?t('Help topics found: ')+count:t('Ничего не найдено. Попробуй другой запрос.');
 for(const chip of document.querySelectorAll('[data-topic]'))chip.setAttribute('aria-pressed',String(chip.dataset.topic===category));
 help.hidden=!selected;help.textContent=selected?t(answers[selected]):'';
 };
 input.addEventListener('input',()=>{category='all';selected='';update();});
 document.querySelector('[data-search-form]').addEventListener('submit',event=>{event.preventDefault();update();});
 for(const chip of document.querySelectorAll('[data-topic]'))chip.addEventListener('click',()=>{category=chip.dataset.topic;selected='';input.value='';update();});
 for(const card of cards)card.addEventListener('click',()=>{selected=card.dataset.topicCard;update();});
 document.addEventListener('languagechange',update);update();
}
module.exports={initSupport};
