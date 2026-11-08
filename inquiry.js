import { business } from './client-data.js';
import { defaultFaq, getSettings } from './content-store.js';
import { escapeText } from './site.js';

const form = document.querySelector('#form');
const params = new URLSearchParams(location.search);
const trial = params.get('type') === 'trial';
const subject = trial ? '체험수업 문의' : '레슨 상담 문의';
const selected = params.get('program');
const select = form.elements.program;
if ([...select.options].some(option => option.value === selected)) select.value = selected;
if (trial) document.querySelector('h1').textContent = '체험수업 상담';
form.querySelector('button').disabled = false;

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const message = data.get('message').trim().replace(/\r?\n/g, '\r\n');
  const phone = data.get('phone').trim();
  const status = document.querySelector('#mail-status');
  if (!data.get('name').trim() || !message || phone.replace(/\D/g, '').length < 8) {
    status.textContent = '성함, 연락처, 문의 내용을 확인해 주세요.';
    return;
  }
  const body = [
    `성함: ${data.get('name').trim()}`,
    `연락처: ${phone}`,
    `관심 프로그램: ${data.get('program')}`,
    '',
    message,
  ].join('\r\n');
  status.textContent = `메일 앱이 열리지 않으면 ${business.email}로 직접 보내 주세요.`;
  const mail = document.createElement('a');
  mail.href = `mailto:${business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  mail.click();
});

function renderFaq() {
  const faq = getSettings().faq ?? defaultFaq;
  const host = document.querySelector('[data-faq]');
  host.closest('.board').hidden = faq.length === 0;
  host.innerHTML = faq.map(({ question, answer }, i) => `<details class="faq">
    <summary><small aria-hidden="true">${String(i + 1).padStart(2, '0')}</small><span>${escapeText(question)}</span></summary>
    <p class="faq-answer">${escapeText(answer)}</p>
  </details>`).join('');
}
renderFaq();
window.addEventListener('icare-content-updated', renderFaq);
