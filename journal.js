import './site.js';
import { clientAssets } from './client-data.js';
const articles={
 posture:{title:'아이의 바른 자세, 언제부터 살펴볼까요?',image:'image29.png',lead:'자세는 한 번에 완성되는 모양이 아니라, 매일 몸을 사용하는 방식에서 자연스럽게 만들어집니다.',body:['성장기에는 키가 빠르게 자라고 몸의 비율도 계속 변합니다. 이 시기에는 바르게 앉으라고 반복해서 말하기보다, 아이가 스스로 몸의 중심을 느끼고 편안하게 움직일 기회를 만드는 것이 중요합니다.','아이케어의 키즈 필라테스는 발의 지지, 골반의 균형, 호흡과 시선까지 연결해 아이가 자기 몸의 신호를 알아차리도록 돕습니다.']},
 golf:{title:'골프 스윙을 편안하게 만드는 코어의 힘',image:'image30.png',lead:'스윙의 회전을 편안하게 받쳐주는 중심을 연습합니다.',body:['스윙은 한 번의 강한 동작처럼 보이지만 발에서 시작한 힘이 몸통을 거쳐 팔로 전달되는 연결입니다. 몸통을 지지하는 방법을 익히고 각 관절의 움직임을 함께 살피는 것이 중요합니다.','필라테스는 회전 자체보다 회전할 때 몸을 지지하는 방법을 다룹니다. 흉추와 고관절의 가동성을 살피고, 골반과 갈비뼈의 연결을 확인하며 움직임을 연습합니다.']},
 postpartum:{title:'산후 회복, 내 몸의 속도를 찾는 시간',image:'image31.png',lead:'달라진 몸의 반응을 살피며, 작은 움직임부터 시작합니다.',body:['출산 후의 몸은 많은 변화를 겪습니다. 회복의 속도는 모두 다르기 때문에, 남과 비교하기보다 호흡과 작은 움직임으로 내 몸의 반응을 확인하는 시간이 필요합니다.','아이케어는 호흡과 복부의 연결, 척추의 편안한 움직임을 차분하게 살펴봅니다. 현재의 컨디션과 운동 경험에 맞춰 무리 없는 움직임을 함께 찾습니다.']},
};
const item=articles[new URLSearchParams(location.search).get('article')]||articles.posture;document.title=`${item.title} | I CARE PILATES`;
document.querySelector('#article').innerHTML=`<nav class="page-tabs"><a href="index.html#journal">← 움직임 이야기</a></nav><h1>${item.title}</h1><img src="${clientAssets[item.image]}" alt="아이케어 필라테스의 움직임을 위한 공간"><div class="body-copy"><p>${item.lead}</p>${item.body.map(p=>`<p>${p}</p>`).join('')}</div><nav class="related">${Object.entries(articles).map(([key,a])=>`<a href="journal.html?article=${key}">${a.title} ↗</a>`).join('')}</nav>`;
