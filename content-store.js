import { backend, checked, demo } from './backend.js';

const key = 'icare_content_settings_v1';
const empty = { video1: '', video2: '', kakao: '', reviews: [], faq: null };
let published = empty;
export const defaultFaq = [
  { id: 'age', question: '어린이 필라테스는 몇 살부터 가능한가요?', answer: '키즈 필라테스는 7–18세를 대상으로 합니다. 성장 단계와 수업 참여도를 고려해 상담 후 레슨을 안내합니다.' },
  { id: 'trial', question: '체험수업은 어떻게 예약하나요?', answer: '상담 페이지에서 이메일이나 카카오톡으로 희망 요일과 시간을 알려주세요. 일정을 확인한 뒤 안내합니다.' },
  { id: 'parking', question: '주차는 어떻게 하나요?', answer: '벨포레스퀘어 건물에 1시간 주차할 수 있습니다. 4층까지 엘리베이터를 이용하세요.' },
];

export function getSettings() {
  if (!demo) return published;
  try { return { ...empty, ...JSON.parse(localStorage.getItem(key) || '{}') }; }
  catch { return { ...empty }; }
}

export async function refreshContent() {
  if (!backend) return getSettings();
  const [settings, reviews, faq] = await Promise.all([
    backend.from('icare_content').select('key,value'),
    backend.from('icare_reviews').select('id,name,lesson,text').order('created_at', { ascending: false }).order('id'),
    backend.from('icare_faq').select('id,question,answer').order('created_at').order('id'),
  ]);
  published = { ...empty, ...Object.fromEntries(checked(settings).map(row => [row.key, row.value])),
    reviews: checked(reviews), faq: checked(faq) };
  window.dispatchEvent(new Event('icare-content-updated'));
  return published;
}

export function validUrl(value, kind) {
  let url;
  try { url = new URL(value); } catch { throw new Error('올바른 HTTPS 주소를 입력하세요.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.href.length > 2048) {
    throw new Error('올바른 HTTPS 주소를 입력하세요.');
  }
  if (kind === 'kakao' && (url.hostname !== 'open.kakao.com' || !/^\/o\/[\w-]+\/?$/.test(url.pathname))) {
    throw new Error('카카오톡 오픈채팅 주소를 입력하세요.');
  }
  if (kind === 'video' && !videoEmbed(url.href) && !/\.(mp4|webm)$/i.test(url.pathname)) {
    throw new Error('YouTube 또는 MP4·WebM 주소를 입력하세요.');
  }
  return url.href;
}

export function videoEmbed(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const id = url.hostname === 'youtu.be' ? url.pathname.split('/')[1]
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)
        ? url.searchParams.get('v') || url.pathname.split('/').at(-1) : '';
    if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch { /* Invalid URL */ }
  return null;
}
export function saveSettings(settings) {
  if (!demo) throw new Error('관리자 권한이 필요합니다.');
  localStorage.setItem(key, JSON.stringify(settings));
  window.dispatchEvent(new Event('icare-content-updated'));
}
async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('icare_media', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('브라우저 미디어 저장소를 열지 못했습니다.'));
  });
}
export async function saveVideo(key, file) {
  if (!demo) throw new Error('관리자 권한이 필요합니다.');
  if (!['video/mp4', 'video/webm'].includes(file.type)) throw new Error('MP4 또는 WebM 동영상을 선택해주세요.');
  if (file.size > 100 * 1024 * 1024) throw new Error('동영상은 100MB 이하로 등록해주세요.');
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('files', 'readwrite');
    transaction.objectStore('files').put(file, key);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(new Error('저장 공간을 확인해주세요.')); };
  });
}
export async function loadVideo(key) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').get(key);
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
