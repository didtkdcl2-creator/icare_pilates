const key = 'icare_content_settings_v1';
export function getSettings() {
  try { return { video1: '', video2: '', kakao: '', reviews: [], ...JSON.parse(localStorage.getItem(key) || '{}') }; }
  catch { return { video1: '', video2: '', kakao: '', reviews: [] }; }
}
export function validUrl(value) {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('https://로 시작하는 링크를 입력해주세요.');
  return url.href;
}
export function saveSettings(settings) {
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
