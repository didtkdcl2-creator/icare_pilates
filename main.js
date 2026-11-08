import { backend, checked, demo } from './backend.js';
import { defaultFaq, getSettings, refreshContent, saveSettings, saveVideo, validUrl } from './content-store.js';

const loginView = document.querySelector('#login-view');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');
const demoLogin = document.querySelector('#demo-login');
const shell = document.querySelector('#admin-shell');
const panel = document.querySelector('#admin-panel');
const status = document.querySelector('#admin-status');
const removeDialog = document.querySelector('#remove-dialog');
const menu = [...shell.querySelectorAll('[data-view]')];
const roleNames = { owner: '운영 책임자', manager: '운영 담당자', editor: '콘텐츠 담당자' };
const videoLabels = { video1: '홍정기 교수', video2: '김우성 대표' };
const bucketName = 'icare-opening';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let profile;
let view = 'overview';
let busy = false;

function enter(staff) {
  profile = staff;
  loginForm.reset();
  loginView.hidden = true;
  shell.hidden = false;
  document.querySelector('#staff-name').textContent = staff.full_name || '아이케어 관리자';
  document.querySelector('#staff-role').textContent = roleNames[staff.role];
  render('overview');
  panel.querySelector('h1').focus();
}

function leave(message = '') {
  profile = null;
  panel.replaceChildren();
  shell.hidden = true;
  loginView.hidden = false;
  loginStatus.textContent = message;
  (demo ? demoLogin.querySelector('button') : loginForm.elements.email).focus();
}

loginForm.hidden = !backend;
demoLogin.hidden = !demo;
if (!backend && !demo) loginStatus.textContent = '운영 관리자 계정이 아직 연결되지 않았습니다.';
demoLogin.querySelector('button').addEventListener('click', () => enter({ full_name: '로컬 미리보기', role: 'owner' }));

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!backend || busy) return;
  const button = loginForm.querySelector('button');
  busy = button.disabled = true;
  loginStatus.textContent = '계정을 확인하는 중입니다.';
  try {
    const { user } = checked(await backend.auth.signInWithPassword({
      email: loginForm.elements.email.value.trim(), password: loginForm.elements.password.value,
    }));
    const staff = checked(await backend.from('profiles').select('id,full_name,role').eq('id', user.id).maybeSingle());
    if (!staff || !Object.hasOwn(roleNames, staff.role)) {
      await backend.auth.signOut({ scope: 'local' });
      loginStatus.textContent = '이 계정에 관리자 권한이 없습니다.';
      return;
    }
    await refreshContent();
    enter(staff);
  } catch {
    await backend.auth.signOut({ scope: 'local' });
    loginStatus.textContent = '로그인하지 못했습니다. 계정 정보와 연결 상태를 확인하세요.';
  } finally {
    busy = button.disabled = false;
    loginForm.elements.password.value = '';
  }
});

backend?.auth.onAuthStateChange(event => {
  if (event === 'SIGNED_OUT' && profile) leave('세션이 종료되었습니다. 다시 로그인하세요.');
});

document.querySelector('#signout').addEventListener('click', async () => {
  if (busy) return;
  if (!backend) { leave('로그아웃했습니다.'); return; }
  busy = true;
  try {
    checked(await backend.auth.signOut({ scope: 'local' }));
    leave('로그아웃했습니다.');
  } catch { status.textContent = '로그아웃하지 못했습니다. 다시 시도하세요.'; }
  finally { busy = false; }
});

function allowed(target) {
  return profile && (profile.role !== 'manager' || ['overview', 'faq'].includes(target));
}

menu.forEach(button => button.addEventListener('click', () => {
  if (busy || view === button.dataset.view) return;
  render(button.dataset.view);
  panel.querySelector('h1')?.focus();
}));

function page(title, intro, content) {
  return `<header class="panel-head"><h1 tabindex="-1">${title}</h1><p>${intro}</p></header>${content}`;
}

function render(target, message = '') {
  if (!allowed(target)) return;
  view = target;
  menu.forEach(button => {
    button.hidden = !allowed(button.dataset.view);
    if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  status.textContent = message;
  const settings = getSettings();
  const faq = settings.faq ?? defaultFaq;
  if (view === 'overview') {
    panel.innerHTML = page('운영 현황', demo ? '변경 사항은 이 브라우저의 개발 환경에만 반영됩니다.' : '사이트에 공개 중인 콘텐츠입니다.', `
      <dl class="counts"><div><dt>오픈 축하 영상</dt><dd>${Number(Boolean(settings.video1)) + Number(Boolean(settings.video2))} / 2</dd></div>
      <div><dt>레슨 후기</dt><dd>${settings.reviews.length}건</dd></div><div><dt>자주 묻는 질문</dt><dd>${faq.length}건</dd></div></dl>
      <section class="admin-card"><h2>상담 수신</h2><p>상담과 체험수업 문의는 이메일 또는 카카오톡에서 확인합니다.</p>
      <a href="mailto:icarepilates@naver.com">icarepilates@naver.com</a></section>`);
  }
  if (view === 'videos') {
    panel.innerHTML = page('오픈 축하 영상', '홈 첫 화면에 표시할 영상입니다. YouTube 링크 또는 50MB 이하 MP4·WebM 파일을 등록할 수 있습니다.',
      Object.entries(videoLabels).map(([key, title]) => `
        <form class="admin-card" data-action="video" data-id="${key}">
          <h2>${title} <small>${settings[key] ? '공개 중' : '미등록'}</small></h2>
          <label>영상 주소<input name="url" type="url" maxlength="2048" placeholder="https://" value="${settings[key] === 'local' ? '' : escape(settings[key])}"></label>
          <label>영상 파일<input type="file" name="file" accept="video/mp4,video/webm"></label>
          <div class="actions"><button class="primary">저장</button>${settings[key] ? '<button type="button" data-remove>공개 해제</button>' : ''}</div>
        </form>`).join(''));
  }
  if (view === 'reviews') {
    panel.innerHTML = page('레슨 후기', '게시 동의를 받은 후기만 등록하세요.', `
      <form class="admin-card" data-action="review"><h2>후기 등록</h2>
        <div class="field-pair"><label>표시 이름<input name="name" maxlength="60" required></label>
        <label>레슨명<input name="lesson" maxlength="80" required></label></div>
        <label>후기<textarea name="text" maxlength="1500" required></textarea></label><button class="primary">게시</button>
      </form><h2 class="list-title">게시된 후기</h2>
      ${settings.reviews.map((review, index) => `<article class="admin-card list-item" data-action="review" data-id="${escape(review.id ?? index)}">
        <div><h3>${escape(review.name)} · ${escape(review.lesson)}</h3><p>${escape(review.text)}</p></div><button type="button" data-remove>삭제</button>
      </article>`).join('') || '<p class="empty">게시된 후기가 없습니다.</p>'}`);
  }
  if (view === 'faq') {
    const fields = (entry = {}) => `<label>질문<input name="question" maxlength="120" required value="${escape(entry.question)}"></label>
      <label>답변<textarea name="answer" maxlength="900" required>${escape(entry.answer)}</textarea></label>`;
    panel.innerHTML = page('자주 묻는 질문', '상담 페이지에 공개되는 질문과 답변입니다.', `
      <form class="admin-card" data-action="faq"><h2>질문 추가</h2>${fields()}<button class="primary">게시</button></form>
      <h2 class="list-title">게시된 질문</h2>
      ${faq.map(entry => `<details class="admin-card"><summary>${escape(entry.question)}</summary><form data-action="faq" data-id="${escape(entry.id)}">
        ${fields(entry)}<div class="actions"><button class="primary">저장</button><button type="button" data-remove>삭제</button></div>
      </form></details>`).join('') || '<p class="empty">게시된 질문이 없습니다.</p>'}`);
  }
  if (view === 'contact') {
    panel.innerHTML = page('상담 채널', '고객은 선택한 메일 앱이나 카카오톡에서 상담 메시지를 보냅니다.', `
      <section class="admin-card"><h2>수신 이메일</h2><a href="mailto:icarepilates@naver.com">icarepilates@naver.com</a></section>
      <form class="admin-card" data-action="contact"><h2>카카오톡 오픈채팅</h2>
        <label>오픈채팅 주소<input type="url" name="url" maxlength="2048" placeholder="https://open.kakao.com/o/…" value="${escape(settings.kakao)}"></label>
        <p>주소를 비워 저장하면 이메일과 전화만 표시됩니다.</p><button class="primary">저장</button>
      </form>`);
  }
}

async function updateSetting(key, value, previous) {
  const saved = checked(await backend.from('icare_content').update({ value }).eq('key', key)
    .eq('value', previous).select('key').maybeSingle());
  if (!saved) throw new Error('저장 권한이 없거나 다른 관리자가 먼저 변경했습니다. 새로고침 후 확인하세요.');
}

async function updateVideo(key, input, remove, settings) {
  const previous = settings[key];
  const file = input?.get('file');
  const url = String(input?.get('url') ?? '').trim();
  const uploading = !remove && Boolean(file?.size);
  if (!remove && !uploading && !url) throw new Error('영상 주소 또는 파일을 선택하세요.');
  if (uploading && (!['video/mp4', 'video/webm'].includes(file.type) || file.size > 50 * 1024 * 1024)) {
    throw new Error('50MB 이하 MP4·WebM 파일을 선택하세요.');
  }
  let value = remove ? '' : uploading ? 'local' : validUrl(url, 'video');
  if (demo) {
    if (uploading) await saveVideo(key, file);
    saveSettings({ ...getSettings(), [key]: value });
    return;
  }
  const bucket = backend.storage.from(bucketName);
  let path;
  if (uploading) {
    path = `${key}/${crypto.randomUUID()}.${file.type === 'video/mp4' ? 'mp4' : 'webm'}`;
    checked(await bucket.upload(path, file, { contentType: file.type }));
    value = bucket.getPublicUrl(path).data.publicUrl;
  }
  try { await updateSetting(key, value, previous); }
  catch (error) {
    // A lost response is ambiguous. Remove the upload only after checking the committed URL.
    if (path) {
      const current = await backend.from('icare_content').select('value').eq('key', key).maybeSingle();
      if (current.data && current.data.value !== value) await bucket.remove([path]);
      if (current.data?.value === value) return;
    }
    throw error;
  }
  const prefix = bucket.getPublicUrl('').data.publicUrl;
  const oldPath = previous.startsWith(prefix) ? previous.slice(prefix.length) : '';
  if (previous !== value && oldPath.startsWith(`${key}/`)) {
    const current = await backend.from('icare_content').select('value').in('key', ['video1', 'video2']);
    if (current.data && !current.data.some(row => row.value === previous)) await bucket.remove([oldPath]);
  }
}

async function updateEntry(kind, id, input, remove) {
  const faq = kind === 'faq';
  const fields = faq ? ['question', 'answer'] : ['name', 'lesson', 'text'];
  const value = remove ? null : Object.fromEntries(fields.map(field => [field, String(input.get(field)).trim()]));
  if (value && fields.some(field => !value[field])) throw new Error('빈 항목을 입력하세요.');
  if (demo) {
    const settings = getSettings();
    const entries = faq ? settings.faq ?? defaultFaq : settings.reviews;
    const same = (entry, index) => String(entry.id ?? index) === id;
    const updated = remove ? entries.filter((entry, index) => !same(entry, index))
      : id ? entries.map((entry, index) => same(entry, index) ? { ...entry, ...value } : entry)
        : [...entries, { ...value, id: crypto.randomUUID() }];
    saveSettings({ ...settings, [faq ? 'faq' : 'reviews']: updated });
    return;
  }
  const table = backend.from(faq ? 'icare_faq' : 'icare_reviews');
  let request = remove ? table.delete().eq('id', id) : id ? table.update(value).eq('id', id) : table.insert(value);
  if (faq && id) {
    const previous = getSettings().faq.find(entry => entry.id === id);
    if (!previous) throw new Error('이미 삭제된 질문입니다. 새로고침 후 확인하세요.');
    request = request.eq('question', previous.question).eq('answer', previous.answer);
  }
  if (!checked(await request.select('id').maybeSingle())) throw new Error('게시물을 변경할 권한이 없거나 이미 삭제되었습니다.');
}

async function act(form, remove = false) {
  const { action, id } = form.dataset;
  if (busy || !allowed(view)) return;
  const fields = remove ? null : new FormData(form);
  busy = true;
  panel.inert = true;
  panel.setAttribute('aria-busy', 'true');
  status.textContent = '저장 중입니다.';
  try {
    const settings = getSettings();
    if (action === 'video') await updateVideo(id, fields, remove, settings);
    if (action === 'contact') {
      const url = String(fields.get('url')).trim();
      const value = url ? validUrl(url, 'kakao') : '';
      if (demo) saveSettings({ ...settings, kakao: value });
      else await updateSetting('kakao', value, settings.kakao);
    }
    if (action === 'review' || action === 'faq') await updateEntry(action, id, fields, remove);
    if (!profile) return;
    try { await refreshContent(); }
    catch {
      status.textContent = '변경을 저장했습니다. 목록을 확인하려면 다시 로그인하세요.';
      return;
    }
    render(view, remove ? '공개를 해제했습니다.' : '저장했습니다.');
    status.focus({ preventScroll: true });
  } catch (error) {
    if (profile) {
      status.textContent = error instanceof Error ? error.message : '변경하지 못했습니다. 권한과 연결 상태를 확인하세요.';
      status.focus({ preventScroll: true });
    }
  } finally {
    busy = false;
    panel.inert = false;
    panel.removeAttribute('aria-busy');
  }
}

panel.addEventListener('submit', event => {
  if (!event.target.matches('[data-action]')) return;
  event.preventDefault();
  void act(event.target);
});
panel.addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button || busy || removeDialog.open) return;
  const target = button.closest('[data-action]');
  removeDialog.querySelector('h2').textContent = target.dataset.action === 'video'
    ? '이 영상의 공개를 해제하시겠습니까?' : '이 게시물을 삭제하시겠습니까?';
  removeDialog.returnValue = '';
  removeDialog.addEventListener('close', () => {
    if (removeDialog.returnValue === 'remove' && target.isConnected) void act(target, true);
  }, { once: true });
  removeDialog.showModal();
});
