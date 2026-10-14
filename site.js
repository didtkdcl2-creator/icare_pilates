import { business, studioPhotos, clientAssets } from './client-data.js';
import { getSettings, loadVideo } from './content-store.js';
export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const links = [
  ['아이케어 필라테스','history.html'], ['레슨 프로그램','index.html#classes'],
  ['레슨 후기','index.html#reviews'], ['내부사진','index.html#studio'],
  ['오시는 길','index.html#contact'], ['Family Site','index.html#family'],
];
const logo = '<span class="brand-star" aria-hidden="true"></span><span>I CARE PILATES</span>';
const oldHeader = document.querySelector('header');
const header = document.createElement('header'); header.className='client-header';
header.innerHTML = `<div class="brand-bar"><a class="brand-logo" href="index.html" aria-label="아이케어 필라테스 홈">${logo}</a><p>Growth & Balance in Contrology, Wellness Care</p><a class="consult-link" href="inquiry.html">온라인 상담 신청 <span aria-hidden="true">↗</span></a><button class="menu-button" aria-label="전체 메뉴 열기" aria-controls="site-menu" aria-expanded="false"><span>메뉴</span><i aria-hidden="true"></i></button></div><nav class="desktop-nav" aria-label="주요 메뉴">${links.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}<a class="nav-booking" href="inquiry.html?type=trial">체험·상담 예약</a></nav>`;
if(oldHeader) oldHeader.replaceWith(header); else document.body.prepend(header);
document.querySelector('.site-menu')?.remove(); document.querySelector('.menu-scrim')?.remove();
const scrim=document.createElement('div'); scrim.className='menu-scrim';scrim.hidden=true;
const menu=document.createElement('aside'); menu.className='site-menu client-menu';menu.id='site-menu';menu.setAttribute('aria-hidden','true');menu.inert=true;
menu.innerHTML=`<div class="site-menu-head"><span class="brand-logo">${logo}</span><button class="menu-close" aria-label="메뉴 닫기">닫기 ×</button></div><nav aria-label="전체 메뉴">${links.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}<a href="inquiry.html">온라인 상담 신청</a><a href="inquiry.html?type=trial">체험수업 신청</a></nav><div class="site-menu-foot"><a href="tel:01048692479">${business.phone}</a></div>`;
document.body.append(scrim,menu);
const menuButton=header.querySelector('.menu-button');
const toggleMenu=open=>{
 menu.classList.toggle('is-open',open);menu.setAttribute('aria-hidden',String(!open));menu.inert=!open;
 scrim.hidden=!open;scrim.classList.toggle('is-visible',open);document.body.classList.toggle('menu-open',open);
 menuButton.setAttribute('aria-expanded',String(open));
 if(open) menu.querySelector('.menu-close').focus(); else menuButton.focus();
};
menuButton.addEventListener('click',()=>toggleMenu(!menu.classList.contains('is-open')));
menu.querySelector('.menu-close').addEventListener('click',()=>toggleMenu(false));scrim.addEventListener('click',()=>toggleMenu(false));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('is-open'))toggleMenu(false);if(e.key==='Tab'&&menu.classList.contains('is-open')){const items=[...menu.querySelectorAll('a,button')];if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}}});
const footer=document.createElement('footer');footer.className='client-footer';
footer.innerHTML=`<div class="footer-top"><a class="brand-logo" href="index.html">${logo}</a><p>Growth & Balance in Contrology<br>Wellness Care by I CARE PILATES</p><a href="inquiry.html">상담 신청하기 ↗</a></div><div class="business-info"><span>상호: ${business.name}</span><span>대표: ${business.director}</span><span>사업자등록번호: ${business.registration}</span><a href="tel:01048692479">대표전화: ${business.phone}</a><a href="mailto:${business.email}">${business.email}</a><span>${business.address}</span></div><div class="footer-bottom"><small>© 2026 I CARE PILATES. ALL RIGHTS RESERVED.</small>${document.querySelector('#admin-dialog')?'<button type="button" data-open-admin>관리자 로그인</button>':''}</div>`;
document.querySelector('footer')?.remove();document.body.append(footer);
function applyContact(){const settings=getSettings();document.querySelectorAll('[data-kakao]').forEach(a=>{if(settings.kakao){a.href=settings.kakao;a.target='_blank';a.rel='noreferrer';a.textContent='카카오톡 상담';}else{a.href='tel:01048692479';a.textContent='전화 상담';}});}
applyContact();window.addEventListener('icare-content-updated',applyContact);
let heroIndex=0;
const slides=[...document.querySelectorAll('[data-hero-slide]')],dots=[...document.querySelectorAll('[data-hero-dot]')];
function heroShow(index){heroIndex=(index+slides.length)%slides.length;slides.forEach((s,i)=>{s.hidden=i!==heroIndex;if(i!==heroIndex)s.querySelectorAll('video').forEach(v=>v.pause());});dots.forEach((b,i)=>{b.classList.toggle('active',i===heroIndex);b.setAttribute('aria-selected',String(i===heroIndex));});document.querySelector('[data-hero-count]')?.replaceChildren(document.createTextNode(`${heroIndex+1} / ${slides.length}`));}
if(slides.length){dots.forEach((b,i)=>b.addEventListener('click',()=>heroShow(i)));document.querySelector('[data-hero-prev]').addEventListener('click',()=>heroShow(heroIndex-1));document.querySelector('[data-hero-next]').addEventListener('click',()=>heroShow(heroIndex+1));heroShow(0);}
function videoEmbed(url){try{const u=new URL(url);let id;if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)){id=u.searchParams.get('v')||u.pathname.split('/').at(-1);}else if(u.hostname==='youtu.be'){id=u.pathname.slice(1);}if(id&&/^[\w-]{11}$/.test(id))return `https://www.youtube-nocookie.com/embed/${id}`;}catch{}return null;}
const blobUrls=new Map();
async function renderVideos(){const settings=getSettings();for(const key of ['video1','video2']){const host=document.querySelector(`[data-video="${key}"]`);if(!host)continue;host.replaceChildren();let src=settings[key];if(blobUrls.has(key)){URL.revokeObjectURL(blobUrls.get(key));blobUrls.delete(key);}if(src==='local'){try{const file=await loadVideo(key);if(file){src=URL.createObjectURL(file);blobUrls.set(key,src);}else src='';}catch{src='';}}if(!src){host.innerHTML='<div class="video-empty"><span class="play-symbol" aria-hidden="true">▷</span><p>오픈 축하 영상을 준비하고 있습니다.</p></div>';continue;}const embed=videoEmbed(src);if(embed){const frame=document.createElement('iframe');frame.src=embed;frame.title=key==='video1'?'홍정기 교수 오픈 축하 영상':'김우성 대표 오픈 축하 영상';frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;host.append(frame);}else{const video=document.createElement('video');video.src=src;video.controls=true;video.preload='metadata';host.append(video);}}}
renderVideos();window.addEventListener('icare-content-updated',renderVideos);
const studioTrack=document.querySelector('.studio-track');
if(studioTrack){studioTrack.innerHTML=studioPhotos.map(([src,caption])=>`<button class="studio-photo" type="button" data-full-photo="${clientAssets[src]}" data-caption="${caption}"><img src="${clientAssets[src]}" alt="${caption}" loading="lazy"><span>${caption}</span></button>`).join('');document.querySelectorAll('[data-studio-dir]').forEach(b=>b.addEventListener('click',()=>studioTrack.scrollBy({left:Number(b.dataset.studioDir)*(studioTrack.clientWidth*.7),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})));}
const photoDialog=document.querySelector('#photo-dialog');
if(photoDialog){document.querySelectorAll('[data-full-photo]').forEach(b=>b.addEventListener('click',()=>{photoDialog.querySelector('img').src=b.dataset.fullPhoto;photoDialog.querySelector('img').alt=b.dataset.caption;photoDialog.querySelector('p').textContent=b.dataset.caption;photoDialog.showModal();}));photoDialog.querySelector('button').addEventListener('click',()=>photoDialog.close());photoDialog.addEventListener('click',e=>{if(e.target===photoDialog)photoDialog.close();});}
function renderReviews(){const host=document.querySelector('[data-reviews]');if(!host)return;const reviews=getSettings().reviews||[];host.innerHTML=reviews.length?reviews.map(r=>`<article class="real-review"><p>“${escapeText(r.text)}”</p><span>${escapeText(r.name)} · ${escapeText(r.lesson)}</span></article>`).join(''):'<div class="review-empty"><p>회원님의 운동 이야기를 기다립니다.</p><span>수업 경험은 네이버 플레이스에서도 확인하실 수 있습니다.</span></div>';}
renderReviews();window.addEventListener('icare-content-updated',renderReviews);
