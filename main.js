import './site.js';
import { getSettings, saveSettings, saveVideo, validUrl } from './content-store.js';
const dialog=document.querySelector('#admin-dialog'),login=document.querySelector('#admin-login'),shell=document.querySelector('.admin-shell');
const local=['localhost','127.0.0.1'].includes(location.hostname);
let role='OWNER';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showLogin(){login.hidden=false;shell.hidden=true;login.reset();login.querySelector('.login-error').textContent='';}
document.querySelectorAll('[data-open-admin]').forEach(b=>b.addEventListener('click',()=>{showLogin();dialog.showModal();}));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
login.addEventListener('submit',e=>{e.preventDefault();if(local){login.hidden=true;shell.hidden=false;renderAdmin('overview');}else login.querySelector('.login-error').textContent='운영 관리자 로그인은 Supabase Auth 연결 후 이용할 수 있습니다.';});
if(local){const note=document.createElement('p');note.className='local-admin-note';note.textContent='로컬 미리보기입니다. 아무 아이디와 비밀번호로 관리자 기능을 확인할 수 있습니다.';login.querySelector('.login-error').before(note);}
document.querySelector('.signout').addEventListener('click',showLogin);
const views=[['overview','현황'],['reservations','예약 문의'],['trial','체험수업 신청'],['qna','Q&A 답변현황'],['content','안내 콘텐츠']];
const permissions={OWNER:views.map(v=>v[0]),MANAGER:['overview','reservations','trial','qna'],EDITOR:['overview','qna','content']};
document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>{role=b.dataset.role;document.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('selected',x===b));renderAdmin('overview');}));
const nav=[...shell.querySelectorAll('aside nav a')];nav.forEach((a,i)=>a.addEventListener('click',e=>{e.preventDefault();renderAdmin(views[i][0]);}));
function submissions(){try{return JSON.parse(localStorage.getItem('icare_submissions')||'[]');}catch{return [];}}
function rows(items){return items.length?`<div class="admin-rows">${items.map(item=>`<article><span>${item.type==='trial'?'체험수업':'예약 문의'}</span><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.program)} · ${escapeHtml(item.phone)}<br>${escapeHtml(item.message)}</p><small>${new Date(item.createdAt).toLocaleString('ko-KR')}</small></article>`).join('')}</div>`:'<div class="admin-empty"><strong>접수된 문의가 없습니다.</strong><p>이 브라우저에서 접수한 문의가 표시됩니다.</p></div>';}
function renderAdmin(view){
 if(!permissions[role].includes(view))return;
 nav.forEach((a,i)=>{a.hidden=!permissions[role].includes(views[i][0]);a.classList.toggle('active',views[i][0]===view);});
 const all=submissions(),reservations=all.filter(x=>x.type==='reservation'),trials=all.filter(x=>x.type==='trial');let body='';
 if(view==='overview')body=`<div class="stat-grid"><div><span>예약 문의</span><strong>${reservations.length}</strong><small>일반 상담 접수</small></div><div><span>체험수업 신청</span><strong>${trials.length}</strong><small>체험 상담 접수</small></div><div><span>공개 후기</span><strong>${getSettings().reviews.length}</strong><small>직접 등록한 후기</small></div></div><div class="schedule"><h3>최근 문의</h3>${rows(all.slice(-3).reverse())}</div>`;
 if(view==='reservations')body=rows([...reservations].reverse());if(view==='trial')body=rows([...trials].reverse());
 if(view==='qna')body='<div class="admin-empty"><strong>공개 Q&A는 아직 없습니다.</strong><p>현재 사이트에는 자주 묻는 질문이 안내되어 있습니다. 고객 질문 접수·답변 기능은 Supabase 연결 후 이용할 수 있습니다.</p></div>';
 if(view==='content'){
 const s=getSettings();body=`<form class="media-settings"><p class="admin-local-notice">설정과 파일은 현재 브라우저에 저장됩니다. 다른 기기와 운영 사이트 방문자에게 공개하려면 Supabase Auth·Storage 연결이 필요합니다.</p>${[['video1','홍정기 교수 오픈 축하 영상'],['video2','김우성 대표 오픈 축하 영상']].map(([key,label])=>`<fieldset><legend>${label}</legend><label>영상 링크 · YouTube 또는 MP4<input name="${key}" type="url" placeholder="https://" value="${s[key]==='local'?'':escapeHtml(s[key])}"></label><label>또는 영상 파일 · MP4 / WebM, 최대 100MB<input name="${key}File" type="file" accept="video/mp4,video/webm"></label>${s[key]==='local'?'<p>현재 등록: 로컬 동영상 파일</p>':''}<label class="check-label"><input name="${key}Remove" type="checkbox">등록된 영상 지우기</label></fieldset>`).join('')}<label>카카오톡 오픈채팅 링크<input name="kakao" type="url" value="${escapeHtml(s.kakao)}" placeholder="추후 링크를 등록해주세요"></label><button type="submit">설정 저장</button><p class="settings-result" role="status"></p></form><form class="review-settings"><h3>실제 레슨 후기 등록</h3><label>표시 이름<input name="name" required maxlength="60" placeholder="박○○ 회원"></label><label>레슨명<input name="lesson" required maxlength="80" placeholder="1:1 Private"></label><label>회원 동의를 받은 후기<textarea name="text" required maxlength="1500"></textarea></label><button type="submit">후기 등록</button></form><div class="registered-reviews">${s.reviews.map((r,i)=>`<article><p>${escapeHtml(r.text)}</p><span>${escapeHtml(r.name)} · ${escapeHtml(r.lesson)}</span><button type="button" data-remove-review="${i}">삭제</button></article>`).join('')}</div>`;
 }
 shell.querySelector('.dashboard').innerHTML=`<h2>${views.find(v=>v[0]===view)[1]}</h2><p class="admin-lead">${role} 권한으로 확인하고 있습니다.</p>${body}<p class="permission">이 화면의 집계는 현재 브라우저에 저장된 실제 접수와 등록 콘텐츠를 기준으로 합니다.</p>`;
 if(view==='content')bindContent();
}
function bindContent(){
 document.querySelector('.media-settings').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,status=f.querySelector('.settings-result'),button=f.querySelector('[type=submit]');button.disabled=true;status.textContent='저장 중입니다…';try{const s=getSettings();const planned={};for(const k of ['video1','video2']){const url=f.elements[k].value.trim(),file=f.elements[`${k}File`].files[0];planned[k]=f.elements[`${k}Remove`].checked?'':file?'local':url?validUrl(url):s[k];if(file&&!f.elements[`${k}Remove`].checked){if(!['video/mp4','video/webm'].includes(file.type)||file.size>100*1024*1024)throw new Error('MP4·WebM 동영상을 100MB 이하로 등록해주세요.');}}const kakao=validUrl(f.elements.kakao.value.trim());for(const k of ['video1','video2']){if(planned[k]==='local'&&f.elements[`${k}File`].files[0])await saveVideo(k,f.elements[`${k}File`].files[0]);s[k]=planned[k];}s.kakao=kakao;saveSettings(s);status.textContent='저장했습니다. 메인 화면에서 확인할 수 있습니다.';}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});
 document.querySelector('.review-settings').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));const s=getSettings();s.reviews.push({name:d.name.trim(),lesson:d.lesson.trim(),text:d.text.trim()});saveSettings(s);renderAdmin('content');});
 document.querySelectorAll('[data-remove-review]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('이 후기를 삭제하시겠습니까?'))return;const s=getSettings();s.reviews.splice(Number(b.dataset.removeReview),1);saveSettings(s);renderAdmin('content');}));
}
