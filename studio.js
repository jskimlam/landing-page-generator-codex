'use strict';
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(value) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
const palettes = { ocean:['#2056e8','#eef3ff'], ink:['#20262f','#f0f2f4'], berry:['#aa275d','#fff0f5'] };
function createSections(b) {
  const features=b.features.trim() || '상품의 주요 특징을 입력해 주세요.';
  return [
    ['첫인상', b.name, b.tagline],
    ['고객의 고민','이런 순간을 위해',b.problem || '어떤 불편함을 해결하고 싶으신가요? 고객의 상황을 적어주세요.'],
    ['선택 기준','좋은 선택의 기준',features],
    ['일상의 변화','당신의 일상에 더하는 변화',b.tagline],
    ['상품 소개',b.name+'을 소개합니다',b.tagline],
    ['사용 방법','이렇게 사용해 보세요',b.steps || '실제 사용 방법을 단계별로 입력해 주세요.'],
    ['후기와 근거','직접 확인하는 상품 이야기',b.proof || '확인된 후기가 아직 없습니다. 실제 후기나 근거 자료를 입력하거나 이 섹션을 숨겨주세요.'],
    ['브랜드 소개','우리가 전하고 싶은 이야기',b.brand || '브랜드가 중요하게 생각하는 가치를 적어주세요.'],
    ['핵심 혜택','꼼꼼하게 살펴볼 포인트',features],
    ['구매 안내','구매 전에 확인해 주세요',b.policy || '배송, 교환, 환불 정책을 입력해 주세요.'],
    ['구매 체크','나에게 맞는 상품일까요?',features],
    ['추천 대상','이런 분께 소개합니다',b.audience || '이 상품이 필요한 고객을 적어주세요.'],
    ['마지막 제안','이제, '+b.name+'과 함께',b.price ? b.price+'\n'+b.tagline : b.tagline]
  ].map(([label,title,body],i)=>({label,title,body,enabled: !([6,7,9].includes(i) && ![b.proof,b.brand,b.policy][[6,7,9].indexOf(i)])}));
}
function renderPage(b,sections,photo) {
 const [accent,tint]=palettes[b.theme] || palettes.ocean;
 const url=safeURL(b.url);
 const image=/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo || '') ? photo : '';
 const content=sections.map((s,i)=>!s.enabled?'':`<section class="s s${i}"><div class="inner"><div class="copy"><div class="eyebrow">${String(i+1).padStart(2,'0')} / ${escapeHTML(s.label)}</div><h${i===0?'1':'2'}>${escapeHTML(s.title)}</h${i===0?'1':'2'}><p>${escapeHTML(s.body).replace(/\n/g,'<br>')}</p>${(i===0||i===12)?`${b.price&&i===0?`<div class="price">${escapeHTML(b.price)}</div>`:''}${url?`<a class="cta" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">상품 자세히 보기 ↗</a>`:''}`:''}</div>${i===0&&image?`<img class="product" src="${image}" alt="${escapeHTML(b.name)}">`:''}</div></section>`).join('');
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(b.name)} · 상세페이지</title><style>*{box-sizing:border-box}body{margin:0;background:white;color:#19283b;font-family:'Segoe UI','Malgun Gothic',sans-serif;line-height:1.8;word-break:keep-all;overflow-wrap:anywhere}.s{padding:70px 8%}.s:nth-child(even){background:${tint}}.inner{max-width:1040px;margin:auto}.s0{padding-top:88px;padding-bottom:88px;background:${tint}}.s0 .inner{display:flex;align-items:center;gap:48px}.copy{flex:1;min-width:0}.eyebrow{color:${accent};font-size:12px;letter-spacing:2px;font-weight:700;margin-bottom:20px}h1{font-size:48px;line-height:1.3;letter-spacing:-2px;margin:0 0 24px}h2{font-size:30px;line-height:1.4;letter-spacing:-1px;margin:0 0 20px}p{font-size:17px;color:#4b5c71;margin:0;white-space:normal}.product{width:42%;max-height:440px;object-fit:contain;border-radius:16px;background:white}.price{font-size:24px;font-weight:700;margin-top:24px}.cta{display:inline-block;background:${accent};color:#fff;border-radius:7px;text-decoration:none;padding:13px 24px;margin-top:24px;font-size:15px}.s12{text-align:center;background:${accent}!important;color:white}.s12 .eyebrow,.s12 p{color:#fff}.s12 .cta{background:white;color:${accent}}footer{text-align:center;padding:30px;font-size:13px;color:#75849a}@media(max-width:600px){.s{padding:44px 24px}.s0 .inner{flex-direction:column;align-items:stretch;gap:28px}.product{width:100%;max-height:350px}h1{font-size:34px}h2{font-size:26px}p{font-size:16px}}@media print{.s{break-inside:avoid}.cta{display:none}}</style></head><body>${content}<footer>${escapeHTML(b.name)}</footer></body></html>`;
}
if(typeof module!=='undefined') module.exports={escapeHTML,safeURL,createSections,renderPage};
if(typeof document!=='undefined') {
 const $=id=>document.getElementById(id), form=$('briefForm'); let brief, sections=[], photo='', timer, photoTask=Promise.resolve();
 const notify=msg=>{ $('toast').textContent=msg; $('toast').style.display='block'; clearTimeout(timer);timer=setTimeout(()=>$('toast').style.display='none',4000); };
 const readBrief=()=>Object.fromEntries(new FormData(form).entries());
 const update=()=>{ if(!brief)return; $('preview').srcdoc=renderPage(brief,sections,photo); $('sectionCount').textContent=sections.filter(s=>s.enabled).length+' / 13 섹션 표시'; };
 const tab=edit=>{form.hidden=edit; $('editor').hidden=!edit; $('inputTab').classList.toggle('active',!edit);$('editTab').classList.toggle('active',edit);$('inputTab').setAttribute('aria-selected',String(!edit));$('editTab').setAttribute('aria-selected',String(edit));};
 function editFields(){ $('sections').innerHTML=''; sections.forEach((s,i)=>{const d=document.createElement('details');d.className='sectionEditor';d.open=i===0;d.innerHTML=`<summary>${String(i+1).padStart(2,'0')} ${escapeHTML(s.label)}</summary><label class="toggle"><input type="checkbox" ${s.enabled?'checked':''}>이 섹션 표시</label><label>제목<input maxlength="300" value="${escapeHTML(s.title)}"></label><label>내용<textarea maxlength="5000" rows="4">${escapeHTML(s.body)}</textarea></label>`;const [enabled,title,body]=d.querySelectorAll('input,textarea');enabled.onchange=()=>{s.enabled=enabled.checked;update();};title.oninput=()=>{s.title=title.value;update();};body.oninput=()=>{s.body=body.value;update();};$('sections').append(d);}); }
 form.onsubmit=async e=>{e.preventDefault();await photoTask;if(sections.length&&!confirm('새 초안으로 바꾸면 편집한 섹션 문구가 교체됩니다. 계속할까요?'))return;brief=readBrief();if(brief.url&&!safeURL(brief.url)){notify('http 또는 https로 시작하는 링크를 입력해 주세요.');return;}sections=createSections(brief);editFields();$('empty').hidden=true;$('preview').hidden=false;$('download').disabled=false;$('editTab').disabled=false;update();tab(true);notify('초안이 준비됐습니다. 안내 문구를 확인하고 수정해 주세요.');};
 $('inputTab').onclick=()=>tab(false);$('editTab').onclick=()=>tab(true);$('back').onclick=()=>tab(false);
 form.addEventListener('input',()=>{if(brief){brief=readBrief();update();}});
 $('download').onclick=()=>{const blob=new Blob([renderPage(brief,sections,photo)],{type:'text/html;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(brief.name.replace(/[\\/:*?"<>|]/g,'_')||'상세페이지')+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);notify('사진이 포함된 HTML을 저장했습니다.');};
 function device(mobile){$('preview').classList.toggle('mobile',mobile);for(const [id,pressed] of [['mobile',mobile],['desktop',!mobile]]){$(id).classList.toggle('selected',pressed);$(id).setAttribute('aria-pressed',String(pressed));}}
 $('mobile').onclick=()=>device(true);$('desktop').onclick=()=>device(false);
 $('photo').onchange=e=>{const file=e.target.files[0];if(!file)return;photoTask=(async()=>{try{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('8MB 이하의 JPG·PNG·WebP 파일을 선택해 주세요.');const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('사진을 읽지 못했습니다.'));r.readAsDataURL(file);});const img=new Image();img.src=data;await img.decode();if(img.width*img.height>40000000)throw Error('사진 크기가 너무 큽니다. 4천만 화소 이하로 줄여주세요.');photo=data;$('photoThumb').src=photo;$('photoRow').hidden=false;update();notify('사진을 추가했습니다.');}catch(err){notify(err.message);$('photo').value='';}})();};
 $('removePhoto').onclick=()=>{photo='';$('photo').value='';$('photoRow').hidden=true;$('photoThumb').removeAttribute('src');update();};
 $('example').onclick=()=>{if(sections.length&&!confirm('현재 내용을 예시로 바꿀까요?'))return;const sample={name:'데일리 텀블러',tagline:'가볍게 챙기는 나만의 커피 시간',audience:'출근길에도, 산책할 때도 커피를 즐기는 분',problem:'무거운 가방에 컵까지 챙기기 부담스러웠다면',features:'매일 쓰기 좋은 심플한 디자인\n손에 편하게 잡히는 형태\n나의 취향에 어울리는 컬러',price:'',theme:'ocean',url:'',steps:'사용 전 깨끗이 세척해 주세요.\n음료를 담고 뚜껑을 닫아 주세요.\n사용 후 세척하여 충분히 건조해 주세요.',proof:'',brand:'',policy:''};for(const [k,v] of Object.entries(sample))form.elements[k].value=v;photo='';$('photo').value='';$('photoRow').hidden=true;brief=sample;sections=createSections(brief);editFields();$('empty').hidden=true;$('preview').hidden=false;$('download').disabled=false;$('editTab').disabled=false;update();tab(false);notify('기능을 체험하기 위한 가상 상품 예시입니다.');};
 window.addEventListener('beforeunload',e=>{if(sections.length){e.preventDefault();e.returnValue='';}});
}
