const {init}=require('./i18n');
init();
const menu=document.querySelector('[data-menu]');const nav=document.querySelector('#navigation');
const header=document.querySelector('.header');
let headerHeight=0;
const updateOffset=()=>{
 if(!header||menu?.getAttribute('aria-expanded')==='true')return;
 const zoom=Number.parseFloat(getComputedStyle(document.documentElement).zoom)||1;
 headerHeight=Math.ceil(header.getBoundingClientRect().height/zoom);
 document.documentElement.style.setProperty('--header-offset',(headerHeight+16)+'px');
};
const revealHash=()=>{if(!location.hash)return;let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{return;}if(target)target.scrollIntoView({block:'start',behavior:'instant'});};
const closeMenu=()=>{menu?.setAttribute('aria-expanded','false');nav?.classList.remove('open');updateOffset();};
if(header){new ResizeObserver(()=>{if(menu?.getAttribute('aria-expanded')==='true')return;updateOffset();if(location.hash)revealHash();}).observe(header);}
document.addEventListener('languagechange',()=>{updateOffset();revealHash();});
window.addEventListener('load',()=>{updateOffset();revealHash();});
window.addEventListener('hashchange',()=>{updateOffset();});
updateOffset();
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
for(const link of document.querySelectorAll('nav a'))link.addEventListener('click',closeMenu);
if(document.querySelector('#home')){
 const links=[...document.querySelectorAll('nav a')];
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const link of links){if(new URL(link.href).hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}},{rootMargin:'-15% 0px -65% 0px'});
 for(const section of document.querySelectorAll('main>section[id]'))observer.observe(section);
}
require('./forms').initForms();
require('./checkout').initCheckout();
require('./support').initSupport();
require('./account').initAccount();
require('./portal-sdk-bridge').initPortalSdkBridge();
require('./support-widget').initSupportWidget({brandSlug:'kuni'});
