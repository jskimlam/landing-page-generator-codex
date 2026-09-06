'use strict';

const CANONICAL_SECTIONS = [
  ['01_hero','Hero'],['02_pain','Pain'],['03_problem','Problem'],['04_story','Story'],['05_solution','Solution'],
  ['06_how_it_works','How It Works'],['07_social_proof','Social Proof'],['08_authority','Authority'],['09_benefits','Benefits'],
  ['10_risk_removal','Risk Removal'],['11_comparison','Comparison'],['12_target_filter','Target Filter'],['13_final_cta','Final CTA']
];

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(value) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
function safeImageSrc(value) {
  const v=String(value||'');
  if(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
  try{const u=new URL(v);if(u.protocol==='https:'&&u.hostname==='drive.google.com'&&u.pathname==='/uc'&&u.searchParams.get('export')==='view'&&u.searchParams.get('id'))return u.href;}catch{}
  return '';
}
const palettes = { ocean:['#2056e8','#eef3ff'], ink:['#20262f','#f0f2f4'], berry:['#aa275d','#fff0f5'] };

function section(id,label,title,body,enabled=true,imagePrompt='') {
  return {id,label,title,body,enabled,imagePrompt,image:'',driveUrl:'',driveFileId:''};
}

function createSections(b) {
  const features=b.features?.trim() || '상품의 주요 특징을 입력해 주세요.';
  return [
    section('01_hero','Hero',b.name,b.tagline),
    section('02_pain','고객의 고민','혹시 이런 불편함이 있으셨나요?',b.problem || '고객이 겪는 실제 불편함을 입력해 주세요.'),
    section('03_problem','문제의 원인','좋은 선택은 기준이 분명해야 합니다',features),
    section('04_story','일상의 변화','사용 전과 후, 달라지는 경험',b.tagline),
    section('05_solution','솔루션',b.name+'을 소개합니다',b.tagline),
    section('06_how_it_works','사용 방법','이렇게 사용해 보세요',b.steps || '실제 사용 방법을 단계별로 입력해 주세요.'),
    section('07_social_proof','후기와 근거','확인 가능한 근거로 살펴보세요',b.proof || '확인된 후기나 시험·인증 자료가 있다면 입력해 주세요.',Boolean(b.proof)),
    section('08_authority','브랜드 소개','이 제품을 만든 이유',b.brand || '브랜드가 중요하게 생각하는 가치와 제작 배경을 입력해 주세요.',Boolean(b.brand)),
    section('09_benefits','핵심 혜택','꼼꼼하게 살펴볼 포인트',features),
    section('10_risk_removal','구매 안심','구매 전에 확인해 주세요',b.policy || '배송, 교환, 환불 정책을 입력해 주세요.',Boolean(b.policy)),
    section('11_comparison','비교','선택 전, 이 차이를 확인하세요',features),
    section('12_target_filter','추천 대상','이런 분께 추천합니다',b.audience || '이 상품이 필요한 고객을 입력해 주세요.'),
    section('13_final_cta','마지막 제안','이제, '+b.name+'과 함께',b.price ? b.price+'\n'+b.tagline : b.tagline)
  ];
}

function normalizeAISections(raw, brief={}) {
  if (!raw || !Array.isArray(raw.sections)) throw new Error('AI 응답에 sections 배열이 없습니다.');
  const byId = new Map(raw.sections.map(s => [s.id, s]));
  return CANONICAL_SECTIONS.map(([id, fallbackLabel]) => {
    const src = byId.get(id);
    if (!src || typeof src !== 'object') throw new Error('AI 응답에 '+id+' 섹션이 없습니다.');
    const title = String(src.title || '').trim();
    const body = String(src.body || '').trim();
    if (!title || !body) throw new Error(id+' 섹션의 제목 또는 내용이 비어 있습니다.');
    return section(
      id,
      String(src.label || fallbackLabel).trim() || fallbackLabel,
      title,
      body,
      src.enabled !== false,
      String(src.image_prompt || src.imagePrompt || '').trim()
    );
  });
}

function renderPage(b,sections,photo) {
  const [accent,tint]=palettes[b.theme] || palettes.ocean;
  const url=safeURL(b.url);
  const primary=safeImageSrc(photo);
  const content=sections.map((s,i)=>{
    if(!s.enabled) return '';
    const image=safeImageSrc(s.image) || (i===0 ? primary : '');
    const media=image?`<div class="media"><img src="${image}" alt="${escapeHTML(b.name)} ${escapeHTML(s.label)}"></div>`:'';
    const cta=(i===0||i===12)?`${b.price&&i===0?`<div class="price">${escapeHTML(b.price)}</div>`:''}${url?`<a class="cta" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">상품 자세히 보기 ↗</a>`:''}`:'';
    return `<section class="s s${i} ${image?'hasMedia':''}"><div class="inner"><div class="copy"><div class="eyebrow">${String(i+1).padStart(2,'0')} / ${escapeHTML(s.label)}</div><h${i===0?'1':'2'}>${escapeHTML(s.title)}</h${i===0?'1':'2'}><p>${escapeHTML(s.body).replace(/\n/g,'<br>')}</p>${cta}</div>${media}</div></section>`;
  }).join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(b.name)} · 상세페이지</title><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#19283b;font-family:'Segoe UI','Malgun Gothic',sans-serif;line-height:1.8;word-break:keep-all;overflow-wrap:anywhere}.s{padding:78px 8%}.s:nth-child(even){background:${tint}}.inner{max-width:1120px;margin:auto}.hasMedia .inner{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,46%);gap:56px;align-items:center}.s:nth-child(even).hasMedia .copy{order:2}.s:nth-child(even).hasMedia .media{order:1}.copy{min-width:0}.eyebrow{color:${accent};font-size:12px;letter-spacing:2px;font-weight:800;margin-bottom:20px}h1{font-size:50px;line-height:1.25;letter-spacing:-2.4px;margin:0 0 24px}h2{font-size:32px;line-height:1.35;letter-spacing:-1.2px;margin:0 0 20px}p{font-size:17px;color:#4b5c71;margin:0}.media img{width:100%;display:block;max-height:560px;object-fit:cover;border-radius:22px;background:#fff;box-shadow:0 18px 55px #1d315018}.s0{padding-top:92px;padding-bottom:92px;background:${tint}}.s0 .media img{object-fit:contain}.price{font-size:25px;font-weight:800;margin-top:24px}.cta{display:inline-block;background:${accent};color:#fff;border-radius:9px;text-decoration:none;padding:14px 26px;margin-top:24px;font-size:15px;font-weight:700}.s12{text-align:center;background:${accent}!important;color:#fff}.s12 .inner{display:block}.s12 .eyebrow,.s12 p{color:#fff}.s12 .cta{background:#fff;color:${accent}}footer{text-align:center;padding:30px;font-size:13px;color:#75849a}@media(max-width:700px){.s{padding:50px 24px}.hasMedia .inner{display:flex;flex-direction:column;gap:30px}.s:nth-child(even).hasMedia .copy,.s:nth-child(even).hasMedia .media{order:initial}.media{width:100%}.media img{max-height:430px}h1{font-size:36px}h2{font-size:27px}p{font-size:16px}}@media print{.s{break-inside:avoid}.cta{display:none}}</style></head><body>${content}<footer>${escapeHTML(b.name)}</footer></body></html>`;
}

if(typeof module!=='undefined') module.exports={CANONICAL_SECTIONS,escapeHTML,safeURL,safeImageSrc,createSections,normalizeAISections,renderPage};

if(typeof document!=='undefined') {
  const $=id=>document.getElementById(id), form=$('briefForm');
  let brief=null, sections=[], photo='', timer, photoTask=Promise.resolve(), projectFolderId='', projectFolderUrl='';
  const notify=msg=>{ $('toast').textContent=msg; $('toast').style.display='block'; clearTimeout(timer);timer=setTimeout(()=>$('toast').style.display='none',4500); };
  const readBrief=()=>Object.fromEntries(new FormData(form).entries());
  const update=()=>{ if(!brief)return; $('preview').srcdoc=renderPage(brief,sections,photo); $('sectionCount').textContent=sections.filter(s=>s.enabled).length+' / 13 섹션 표시'; };
  const tab=edit=>{form.hidden=edit; $('editor').hidden=!edit; $('inputTab').classList.toggle('active',!edit);$('editTab').classList.toggle('active',edit);$('inputTab').setAttribute('aria-selected',String(!edit));$('editTab').setAttribute('aria-selected',String(edit));};
  const setBusy=(button,busy,text)=>{ if(!button)return; if(busy){button.dataset.label=button.textContent;button.disabled=true;button.textContent=text||'처리 중…';}else{button.disabled=false;button.textContent=button.dataset.label||button.textContent;} };

  function connection() {
    return {url:$('backendUrl').value.trim(), token:$('appToken').value.trim()};
  }
  function loadConnection() {
    $('backendUrl').value=localStorage.getItem('pageStudioBackendUrl')||'';
    $('appToken').value=localStorage.getItem('pageStudioAppToken')||'';
    paintConnection(false);
  }
  function paintConnection(ok,message='') {
    $('backendBadge').className='statusBadge '+(ok?'on':'off');
    $('backendBadge').textContent=ok?'AI 연결됨':'AI 미연결';
    if(message) $('connectionMessage').textContent=message;
  }
  function resetProduct() {
    form.reset();
    brief=null;
    sections=[];
    photo='';
    photoTask=Promise.resolve();
    projectFolderId='';
    projectFolderUrl='';
    $('photo').value='';
    $('photoRow').hidden=true;
    $('photoThumb').removeAttribute('src');
    $('sections').innerHTML='';
    $('imageProgress').textContent='';
    $('empty').hidden=false;
    $('preview').hidden=true;
    $('preview').removeAttribute('srcdoc');
    $('download').disabled=true;
    $('saveDrive').disabled=true;
    $('editTab').disabled=true;
    $('sectionCount').textContent='아직 생성되지 않음';
    device(false);
    tab(false);
    notify('새 상품 입력을 시작합니다. AI·Drive 연결 정보는 그대로 유지됩니다.');
  }
  async function backendCall(action,payload={}) {
    const cfg=connection();
    if(!cfg.url || !/^https:\/\/script\.google\.com\//.test(cfg.url)) throw new Error('Apps Script 웹앱 URL을 먼저 연결해 주세요.');
    if(!cfg.token) throw new Error('앱 토큰을 입력해 주세요.');
    const response=await fetch(cfg.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,token:cfg.token,...payload}),redirect:'follow'});
    if(!response.ok) throw new Error('백엔드 요청 실패: HTTP '+response.status);
    const text=await response.text();
    let data; try{data=JSON.parse(text);}catch{throw new Error('백엔드 응답을 읽지 못했습니다. Apps Script 배포 권한을 확인해 주세요.');}
    if(!data.ok) throw new Error(data.error||'백엔드 처리에 실패했습니다.');
    return data;
  }

  $('saveConnection').onclick=()=>{
    const cfg=connection(); localStorage.setItem('pageStudioBackendUrl',cfg.url); localStorage.setItem('pageStudioAppToken',cfg.token);
    paintConnection(false,'연결 정보를 이 브라우저에 저장했습니다. 연결 확인을 눌러 테스트하세요.'); notify('연결 정보를 저장했습니다.');
  };
  $('testConnection').onclick=async()=>{
    const btn=$('testConnection'); setBusy(btn,true,'확인 중…');
    try{const data=await backendCall('health');paintConnection(true,`AI ${data.textModel} · 이미지 ${data.imageModel} · Drive /${data.driveFolder}`);notify('AI와 Google Drive 백엔드 연결이 정상입니다.');}
    catch(err){paintConnection(false,err.message);notify(err.message);}finally{setBusy(btn,false);}
  };
  $('newProduct').onclick=()=>{
    const fields=['name','tagline','audience','problem','features','price','url','steps','proof','brand','policy','constraints'];
    const hasWork=sections.length>0 || Boolean(photo) || fields.some(name=>String(form.elements[name]?.value||'').trim());
    if(hasWork&&!confirm('현재 상품 입력과 생성 결과를 초기화하고 새 상품을 시작할까요?\nDrive에 이미 저장한 파일은 삭제되지 않습니다.'))return;
    resetProduct();
  };

  function editFields(){
    $('sections').innerHTML='';
    sections.forEach((s,i)=>{
      const d=document.createElement('details'); d.className='sectionEditor'; d.open=i===0;
      d.innerHTML=`<summary>${String(i+1).padStart(2,'0')} ${escapeHTML(s.label)}</summary>
        <label class="toggle"><input class="enabled" type="checkbox" ${s.enabled?'checked':''}>이 섹션 표시</label>
        <label>제목<input class="title" maxlength="300" value="${escapeHTML(s.title)}"></label>
        <label>내용<textarea class="body" maxlength="6000" rows="5">${escapeHTML(s.body)}</textarea></label>
        <label>AI 이미지 지시<textarea class="imagePrompt" maxlength="2500" rows="3" placeholder="제품 원형을 유지하면서 어떤 장면을 만들지 설명">${escapeHTML(s.imagePrompt||'')}</textarea></label>
        <div class="sectionTools"><button type="button" class="generateImage">AI 이미지 생성</button><button type="button" class="removeImage" ${s.image?'':'disabled'}>이미지 제거</button>${s.driveUrl?`<a class="driveLink" href="${escapeHTML(s.driveUrl)}" target="_blank" rel="noopener">Drive에서 보기 ↗</a>`:''}</div>
        ${s.image?`<img class="aiImagePreview" src="${s.image}" alt="${escapeHTML(s.label)} AI 이미지">`:''}`;
      const enabled=d.querySelector('.enabled'), title=d.querySelector('.title'), body=d.querySelector('.body'), prompt=d.querySelector('.imagePrompt');
      enabled.onchange=()=>{s.enabled=enabled.checked;update();}; title.oninput=()=>{s.title=title.value;update();}; body.oninput=()=>{s.body=body.value;update();}; prompt.oninput=()=>{s.imagePrompt=prompt.value;};
      d.querySelector('.generateImage').onclick=()=>generateSectionImage(i,d.querySelector('.generateImage'));
      d.querySelector('.removeImage').onclick=()=>{s.image='';s.driveUrl='';s.driveFileId='';editFields();update();};
      $('sections').append(d);
    });
  }

  async function generateSectionImage(index,button) {
    if(!brief) return;
    const s=sections[index];
    setBusy(button,true,'이미지 생성 중…');
    try{
      const data=await backendCall('generateImage',{brief,section:{id:s.id,label:s.label,title:s.title,body:s.body,imagePrompt:s.imagePrompt},referenceImage:photo||'',projectFolderId});
      projectFolderId=data.projectFolderId||projectFolderId; projectFolderUrl=data.projectFolderUrl||projectFolderUrl;
      s.image='data:image/png;base64,'+data.imageBase64; s.driveUrl=data.driveUrl||''; s.driveFileId=data.driveFileId||'';
      editFields(); update(); notify(`${s.label} 이미지를 생성하고 Drive에 저장했습니다.`);
    }catch(err){notify(err.message);}finally{setBusy(button,false);}
  }

  form.onsubmit=async e=>{
    e.preventDefault(); await photoTask;
    if(sections.length&&!confirm('AI 새 초안으로 바꾸면 편집한 섹션 문구가 교체됩니다. 계속할까요?'))return;
    brief=readBrief(); if(brief.url&&!safeURL(brief.url)){notify('http 또는 https로 시작하는 링크를 입력해 주세요.');return;}
    const btn=$('aiGenerate'); setBusy(btn,true,'AI가 상세페이지 기획 중…');
    try{
      const data=await backendCall('generateCopy',{brief,referenceImage:photo||''});
      sections=normalizeAISections(data,brief); projectFolderId='';projectFolderUrl='';
      editFields(); $('empty').hidden=true;$('preview').hidden=false;$('download').disabled=false;$('saveDrive').disabled=false;$('editTab').disabled=false;update();tab(true);paintConnection(true);
      notify('AI 13개 섹션 초안이 준비됐습니다.');
    }catch(err){notify(err.message);}finally{setBusy(btn,false);}
  };

  $('templateGenerate').onclick=async()=>{
    await photoTask; if(!form.reportValidity())return;
    if(sections.length&&!confirm('템플릿 초안으로 바꾸면 편집한 섹션 문구가 교체됩니다. 계속할까요?'))return;
    brief=readBrief(); if(brief.url&&!safeURL(brief.url)){notify('http 또는 https로 시작하는 링크를 입력해 주세요.');return;}
    sections=createSections(brief); projectFolderId='';projectFolderUrl=''; editFields();$('empty').hidden=true;$('preview').hidden=false;$('download').disabled=false;$('saveDrive').disabled=false;$('editTab').disabled=false;update();tab(true);notify('AI 없이 템플릿 초안을 만들었습니다.');
  };

  $('generateAllImages').onclick=async()=>{
    const targets=sections.map((s,i)=>({s,i})).filter(x=>x.s.enabled);
    if(!targets.length)return;
    if(!confirm(`활성 섹션 ${targets.length}개의 AI 이미지를 순서대로 생성합니다. 이미지 생성 API 비용이 발생할 수 있습니다. 계속할까요?`))return;
    const btn=$('generateAllImages'); setBusy(btn,true,'전체 이미지 생성 중…');
    try{
      for(let n=0;n<targets.length;n++){
        $('imageProgress').textContent=`${n+1}/${targets.length} ${targets[n].s.label}`;
        await generateSectionImage(targets[n].i,null);
      }
      $('imageProgress').textContent='완료'; notify('활성 섹션 이미지 생성을 완료했습니다.');
    }finally{setBusy(btn,false);}
  };

  $('inputTab').onclick=()=>tab(false);$('editTab').onclick=()=>tab(true);$('back').onclick=()=>tab(false);
  form.addEventListener('input',()=>{if(brief){brief=readBrief();update();}});

  $('download').onclick=()=>{
    const blob=new Blob([renderPage(brief,sections,photo)],{type:'text/html;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(brief.name.replace(/[\\/:*?"<>|]/g,'_')||'상세페이지')+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);notify('현재 편집본 HTML을 저장했습니다.');
  };

  $('saveDrive').onclick=async()=>{
    if(!brief)return; const btn=$('saveDrive');setBusy(btn,true,'Drive 저장 중…');
    try{
      const safeSections=sections.map(s=>({id:s.id,label:s.label,title:s.title,body:s.body,enabled:s.enabled,imagePrompt:s.imagePrompt,driveUrl:s.driveUrl,driveFileId:s.driveFileId}));
      const driveSections=sections.map(s=>({...s,image:s.driveFileId?`https://drive.google.com/uc?export=view&id=${encodeURIComponent(s.driveFileId)}`:''}));
      const data=await backendCall('saveProject',{brief,sections:safeSections,html:renderPage(brief,driveSections,''),referenceImage:photo||'',projectFolderId});
      projectFolderId=data.projectFolderId||projectFolderId; projectFolderUrl=data.projectFolderUrl||projectFolderUrl;
      notify('상세페이지 프로젝트를 Google Drive에 저장했습니다.');
      if(data.projectFolderUrl && confirm('Drive 저장이 완료됐습니다. 프로젝트 폴더를 열까요?')) window.open(data.projectFolderUrl,'_blank','noopener');
    }catch(err){notify(err.message);}finally{setBusy(btn,false);}
  };

  function device(mobile){$('preview').classList.toggle('mobile',mobile);for(const [id,pressed] of [['mobile',mobile],['desktop',!mobile]]){$(id).classList.toggle('selected',pressed);$(id).setAttribute('aria-pressed',String(pressed));}}
  $('mobile').onclick=()=>device(true);$('desktop').onclick=()=>device(false);

  $('photo').onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    photoTask=(async()=>{try{
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('8MB 이하의 JPG·PNG·WebP 파일을 선택해 주세요.');
      const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('사진을 읽지 못했습니다.'));r.readAsDataURL(file);});
      const img=new Image();img.src=data;await img.decode();if(img.width*img.height>40000000)throw Error('사진 크기가 너무 큽니다. 4천만 화소 이하로 줄여주세요.');
      photo=data;$('photoThumb').src=photo;$('photoRow').hidden=false;update();notify('상품 사진을 추가했습니다. AI 이미지 생성 시 제품 참고 이미지로 사용합니다.');
    }catch(err){notify(err.message);$('photo').value='';}})();
  };
  $('removePhoto').onclick=()=>{photo='';$('photo').value='';$('photoRow').hidden=true;$('photoThumb').removeAttribute('src');update();};

  $('example').onclick=()=>{
    if(sections.length&&!confirm('현재 내용을 예시로 바꿀까요?'))return;
    const sample={name:'데일리 텀블러',tagline:'가볍게 챙기는 나만의 커피 시간',audience:'출근길과 산책 중에도 음료를 간편하게 즐기고 싶은 분',problem:'무거운 가방에 컵까지 챙기기 부담스럽고, 일회용 컵 사용을 줄이고 싶은 상황',features:'매일 쓰기 좋은 심플한 디자인\n손에 편하게 잡히는 형태\n세척하기 쉬운 구조',price:'29,000원',tone:'clean',theme:'ocean',visualStyle:'studio',url:'',steps:'사용 전 깨끗이 세척해 주세요.\n음료를 담고 뚜껑을 닫아 주세요.\n사용 후 세척하여 충분히 건조해 주세요.',proof:'',brand:'매일 손이 가는 물건을 단순하고 오래 쓰기 좋게 만드는 생활용품 브랜드입니다.',policy:'상품 수령 후 실제 판매 정책에 따라 교환·반품을 진행합니다.',constraints:'확인되지 않은 보온 시간이나 소재 성능 수치를 만들지 말 것.'};
    for(const [k,v] of Object.entries(sample))if(form.elements[k])form.elements[k].value=v;photo='';$('photo').value='';$('photoRow').hidden=true;brief=sample;sections=[];projectFolderId='';projectFolderUrl='';$('empty').hidden=false;$('preview').hidden=true;$('download').disabled=true;$('saveDrive').disabled=true;$('editTab').disabled=true;tab(false);notify('기능 체험용 가상 상품 예시를 불러왔습니다.');
  };

  window.addEventListener('beforeunload',e=>{if(sections.length){e.preventDefault();e.returnValue='';}});
  loadConnection();
}
