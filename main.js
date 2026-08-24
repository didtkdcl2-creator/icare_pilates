const dialog = document.querySelector('#admin-dialog');
const loginForm = document.querySelector('#admin-login');
const adminShell = document.querySelector('.admin-shell');
const showLogin = () => { loginForm.hidden = false; adminShell.hidden = true; loginForm.reset(); loginForm.querySelector('.login-error').textContent = ''; };
document.querySelector('[data-open-admin]').addEventListener('click', () => { showLogin(); dialog.showModal(); });
document.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
loginForm.addEventListener('submit', event => {
  event.preventDefault();
  loginForm.querySelector('.login-error').textContent = '관리자 로그인은 Supabase Auth 연결 후 이용할 수 있습니다.';
});
document.querySelector('.signout').addEventListener('click', showLogin);
document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-role]').forEach(b => b.classList.remove('selected'));
  button.classList.add('selected');
  const role = button.dataset.role; document.querySelector('[data-permission]').textContent = role;
  const notes = { OWNER:'회원·예약·콘텐츠·Q&A 및 권한 관리를 모두 수행할 수 있습니다.', MANAGER:'예약·회원·Q&A를 관리하고 운영 콘텐츠를 검토할 수 있습니다.', EDITOR:'포트폴리오·저널·교육 콘텐츠와 Q&A 답변 초안을 관리할 수 있습니다.' };
  document.querySelector('.permission').innerHTML = `권한 안내: <b data-permission>${role}</b>는 ${notes[role]}`;
}));
document.querySelector('.menu-button').addEventListener('click', () => document.querySelector('.header nav').classList.toggle('open'));
const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); }), {threshold:.15});
document.querySelectorAll('section').forEach(el => observer.observe(el));
