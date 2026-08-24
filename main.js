const dialog = document.querySelector('#admin-dialog');
const loginForm = document.querySelector('#admin-login');
const adminShell = document.querySelector('.admin-shell');
const showLogin = () => { loginForm.hidden = false; adminShell.hidden = true; loginForm.reset(); loginForm.querySelector('.login-error').textContent = ''; };
document.querySelector('[data-open-admin]').addEventListener('click', () => { showLogin(); dialog.showModal(); });
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
loginForm.addEventListener('submit', event => {
  event.preventDefault();
  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (isLocalPreview) {
    loginForm.hidden = true;
    adminShell.hidden = false;
    renderAdmin('overview');
    return;
  }
  loginForm.querySelector('.login-error').textContent = '관리자 로그인은 Supabase Auth 연결 후 이용할 수 있습니다.';
});
if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  const note = document.createElement('p');
  note.className = 'local-admin-note';
  note.textContent = '로컬 미리보기 모드입니다. 아무 아이디와 비밀번호를 입력하면 관리자 화면을 확인할 수 있습니다.';
  loginForm.querySelector('.login-error').before(note);
}
document.querySelector('.signout').addEventListener('click', showLogin);
document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-role]').forEach(b => b.classList.remove('selected'));
  button.classList.add('selected');
  const role = button.dataset.role; const permissionElement = document.querySelector('[data-permission]'); if (permissionElement) permissionElement.textContent = role;
  const notes = { OWNER:'회원·예약·콘텐츠·Q&A 및 권한 관리를 모두 수행할 수 있습니다.', MANAGER:'예약·회원·Q&A를 관리하고 운영 콘텐츠를 검토할 수 있습니다.', EDITOR:'포트폴리오·저널·교육 콘텐츠와 Q&A 답변 초안을 관리할 수 있습니다.' };
  const permission = document.querySelector('.permission'); if (permission) permission.innerHTML = `권한 안내: <b data-permission>${role}</b>는 ${notes[role]}`;
}));
const menuButton = document.querySelector('.menu-button');
const siteNav = document.querySelector('.header nav');
menuButton.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuButton.textContent = isOpen ? 'CLOSE' : 'MENU';
  menuButton.setAttribute('aria-expanded', String(isOpen));
});
siteNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  siteNav.classList.remove('open');
  menuButton.textContent = 'MENU';
  menuButton.setAttribute('aria-expanded', 'false');
}));
const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); }), {threshold:.15});
document.querySelectorAll('section').forEach(el => observer.observe(el));

const adminNav = [...document.querySelectorAll('.admin-shell aside nav a')];
const adminViews = [
  ['overview', '현황'], ['reservations', '예약 문의'], ['trial', '체험수업 신청'], ['qna', 'Q&A 답변현황'], ['content', '안내 콘텐츠']
];
const getSubmissions = () => JSON.parse(localStorage.getItem('icare_submissions') || '[]');
const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const submissionRows = (items, emptyMessage) => items.length ? `<div class="admin-rows">${items.map(item => `<article><span>${item.type === 'trial' ? '체험수업' : '예약 문의'}</span><b>${escapeHtml(item.name || '이름 미입력')}</b><p>${escapeHtml(item.program || '')} · ${escapeHtml(item.phone || '')}<br>${escapeHtml(item.message || '문의 내용 없음')}</p><small>${new Date(item.createdAt).toLocaleString('ko-KR')}</small></article>`).join('')}</div>` : `<div class="admin-empty"><strong>아직 접수된 항목이 없습니다.</strong><p>${emptyMessage}</p></div>`;
function renderAdmin(view) {
  const submissions = getSubmissions();
  const reservations = submissions.filter(item => item.type === 'reservation');
  const trials = submissions.filter(item => item.type === 'trial');
  const viewInfo = { overview:['운영 현황','접수된 문의를 한눈에 확인하세요.'],reservations:['예약 문의','일반 예약 문의만 표시합니다.'],trial:['체험수업 신청','체험 수업을 희망하는 신규 문의입니다.'],qna:['Q&A 답변현황','고객이 남긴 질문과 답변 상태를 관리합니다.'],content:['안내 콘텐츠','저널, FAQ, 프로그램 안내를 관리합니다.'] }[view];
  adminNav.forEach((link,index) => { const [key,label] = adminViews[index]; link.dataset.view = key; link.textContent = label; link.classList.toggle('active', key === view); });
  let body = '';
  if (view === 'overview') body = `<div class="stat-grid"><div><span>예약 문의</span><strong>${reservations.length}</strong><small>접수된 일반 예약</small></div><div><span>체험수업 신청</span><strong>${trials.length}</strong><small>신규 체험 문의</small></div><div><span>답변 대기 Q&A</span><strong>0</strong><small>Supabase 연결 후 집계</small></div></div><div class="schedule"><div class="panel-head"><h3>최근 문의</h3></div>${submissionRows(submissions.slice(-3).reverse(),'예약·체험 신청이 들어오면 이곳에 표시됩니다.')}</div>`;
  if (view === 'reservations') body = submissionRows(reservations.reverse(),'고객이 예약 문의 양식을 제출하면 목록이 표시됩니다.');
  if (view === 'trial') body = submissionRows(trials.reverse(),'상단 “체험 신청” 버튼으로 접수된 문의가 표시됩니다.');
  if (view === 'qna') body = `<div class="admin-empty"><strong>현재 공개 Q&A는 없습니다.</strong><p>Supabase 연결 후 고객 질문을 접수하고 답변 상태를 관리할 수 있습니다.</p></div>`;
  if (view === 'content') body = `<div class="admin-empty"><strong>콘텐츠 편집은 준비 중입니다.</strong><p>현재 사이트의 프로그램·저널·FAQ는 정적 콘텐츠이며, Supabase 연결 후 관리자에서 편집할 수 있습니다.</p></div>`;
  document.querySelector('.dashboard').innerHTML = `<p class="eyebrow">ICARE STUDIO MANAGER</p><h2>${viewInfo[0]}</h2><p class="admin-lead">${viewInfo[1]}</p>${body}<p class="permission">현재 화면은 실제 접수 데이터만 표시합니다. 샘플 예약·회원 데이터는 사용하지 않습니다.</p>`;
}
adminNav.forEach((link, index) => link.addEventListener('click', event => { event.preventDefault(); renderAdmin(adminViews[index][0]); }));
