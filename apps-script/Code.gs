/**
 * Page Studio AI backend for Google Apps Script.
 * Script Properties:
 * - OPENAI_API_KEY (required)
 * - APP_TOKEN (required; random private token shared only with your browser)
 * - OPENAI_TEXT_MODEL (optional, default gpt-5.6-luna)
 * - OPENAI_IMAGE_CALLER_MODEL (optional, default gpt-5.6-luna)
 * - DRIVE_ROOT_FOLDER (optional, default 상세페이지)
 */

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const SECTION_IDS = [
  '01_hero','02_pain','03_problem','04_story','05_solution','06_how_it_works','07_social_proof',
  '08_authority','09_benefits','10_risk_removal','11_comparison','12_target_filter','13_final_cta'
];

function doGet() {
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><title>Page Studio AI Backend</title><body style="font-family:sans-serif;padding:32px"><h2>Page Studio AI Backend</h2><p>정상 실행 중입니다. Page Studio 웹앱에서 이 배포 URL을 연결하세요.</p></body>');
}

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    requireToken_(request.token);
    let result;
    switch (request.action) {
      case 'health': result = health_(); break;
      case 'generateCopy': result = generateCopy_(request); break;
      case 'generateImage': result = generateImage_(request); break;
      case 'saveProject': result = saveProject_(request); break;
      default: throw new Error('지원하지 않는 action입니다.');
    }
    return json_({ok:true, ...result});
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ok:false, error:String(err && err.message ? err.message : err)});
  }
}

function setupPageStudio() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('APP_TOKEN')) props.setProperty('APP_TOKEN', Utilities.getUuid() + Utilities.getUuid().replace(/-/g,''));
  const folder = ensureRootFolder_();
  console.log('APP_TOKEN=' + props.getProperty('APP_TOKEN'));
  console.log('DRIVE_FOLDER=' + folder.getUrl());
  return {appToken:props.getProperty('APP_TOKEN'), folderUrl:folder.getUrl()};
}

function health_() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('OPENAI_API_KEY')) throw new Error('Script Properties에 OPENAI_API_KEY를 설정해 주세요.');
  const folder = ensureRootFolder_();
  return {
    textModel:p.getProperty('OPENAI_TEXT_MODEL') || 'gpt-5.6-luna',
    imageModel:'Responses image_generation tool',
    driveFolder:folder.getName()
  };
}

function requireToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('APP_TOKEN');
  if (!expected) throw new Error('APP_TOKEN이 설정되지 않았습니다. setupPageStudio()를 한 번 실행하세요.');
  if (!token || token !== expected) throw new Error('앱 토큰이 올바르지 않습니다.');
}

function generateCopy_(request) {
  const brief = sanitizeBrief_(request.brief);
  const schema = {
    type:'object',
    properties:{
      sections:{
        type:'array', minItems:13, maxItems:13,
        items:{
          type:'object',
          properties:{
            id:{type:'string',enum:SECTION_IDS},
            label:{type:'string'},
            title:{type:'string'},
            body:{type:'string'},
            enabled:{type:'boolean'},
            image_prompt:{type:'string'}
          },
          required:['id','label','title','body','enabled','image_prompt'],
          additionalProperties:false
        }
      }
    },
    required:['sections'], additionalProperties:false
  };
  const instructions = [
    '당신은 한국 이커머스 상세페이지의 기획자이자 전환 카피라이터다.',
    '반드시 13개 섹션을 다음 순서로 작성한다: '+SECTION_IDS.join(', ')+'.',
    '입력된 사실만 사용한다. 후기, 인증, 성능 수치, 할인, 재고, 한정판매, 환불 보장, 판매 실적을 창작하지 않는다.',
    '근거가 없는 Social Proof/Authority/Risk Removal 섹션은 허위 주장을 만들지 말고 확인 가능한 제품 정보, 선택 기준, 입력된 브랜드/정책을 활용한다.',
    '카피는 한국 소비자용으로 간결하고 구체적으로 작성하며 과장 광고를 피한다.',
    '각 image_prompt는 상세페이지에 사용할 상업용 비주얼 지시다. 이미지 안에 한글/영문 문구, 로고, 가격, 배지를 그리지 말고 비주얼만 지시한다.',
    '참조 상품 사진이 있으면 제품의 실제 형태, 비율, 구멍/캡/표면 구조, 색상 특징을 임의로 바꾸지 않는다.',
    'Hero→Pain→Problem→Story→Solution→How→Proof→Authority→Benefits→Risk→Comparison→Target→CTA의 설득 흐름을 유지한다.'
  ].join('\n');
  const content = [{type:'input_text', text:JSON.stringify(brief)}];
  const reference = validImageDataUrl_(request.referenceImage);
  if (reference) content.push({type:'input_image', image_url:reference, detail:'high'});

  const body = {
    model:prop_('OPENAI_TEXT_MODEL','gpt-5.6-luna'),
    instructions:instructions,
    input:[{role:'user',content:content}],
    reasoning:{effort:'low'},
    max_output_tokens:7000,
    store:false,
    text:{format:{type:'json_schema',name:'detail_page_sections',strict:true,schema:schema}}
  };
  const response = openAI_(body);
  const text = extractOutputText_(response);
  const parsed = JSON.parse(text);
  validateSectionPayload_(parsed);
  return {sections:parsed.sections};
}

function generateImage_(request) {
  const brief = sanitizeBrief_(request.brief);
  const s = request.section || {};
  if (!SECTION_IDS.includes(s.id)) throw new Error('올바르지 않은 섹션 ID입니다.');
  const folder = ensureProjectFolder_(brief, request.projectFolderId);
  const visualStyle = brief.visualStyle || 'studio';
  const prompt = [
    'Create one polished ecommerce product-detail visual for section '+s.id+' ('+(s.label||'')+').',
    'Product: '+brief.name+'.',
    'Section headline context: '+String(s.title||'')+'.',
    'Section message context: '+String(s.body||'')+'.',
    'Requested visual direction: '+String(s.imagePrompt||'')+'.',
    'Visual style: '+visualStyle+'. Tone: '+String(brief.tone||'premium')+'.',
    'CRITICAL: if a reference product image is supplied, preserve the real product geometry, proportions, openings, caps, surface pattern and identity. Do not redesign the product.',
    'No text, letters, numbers, price tags, logos, watermarks, UI, frames or typography inside the generated image.',
    'Commercial studio quality, realistic lighting, clean composition, enough negative space for web copy, no floating product unless physically plausible.',
    String(brief.constraints||'')
  ].join('\n');
  const content = [{type:'input_text',text:prompt}];
  const reference = validImageDataUrl_(request.referenceImage);
  if (reference) content.push({type:'input_image',image_url:reference,detail:'high'});

  const body = {
    model:prop_('OPENAI_IMAGE_CALLER_MODEL','gpt-5.6-luna'),
    input:[{role:'user',content:content}],
    tools:[{type:'image_generation'}],
    tool_choice:'required',
    max_tool_calls:1,
    store:false
  };
  const response = openAI_(body);
  const base64 = extractGeneratedImage_(response);
  const blob = Utilities.newBlob(Utilities.base64Decode(base64),'image/png',s.id+'_'+timestamp_()+'.png');
  const file = folder.createFile(blob);
  return {
    imageBase64:base64,
    driveUrl:file.getUrl(),
    driveFileId:file.getId(),
    projectFolderId:folder.getId(),
    projectFolderUrl:folder.getUrl()
  };
}

function saveProject_(request) {
  const brief = sanitizeBrief_(request.brief);
  const folder = ensureProjectFolder_(brief, request.projectFolderId);
  const sections = Array.isArray(request.sections) ? request.sections : [];
  const html = String(request.html || '');
  if (!html.startsWith('<!doctype html>')) throw new Error('저장할 상세페이지 HTML이 올바르지 않습니다.');

  const project = {savedAt:new Date().toISOString(),brief:brief,sections:sections};
  replaceFile_(folder,'project.json',Utilities.newBlob(JSON.stringify(project,null,2),'application/json','project.json'));
  replaceFile_(folder,'detail-page.html',Utilities.newBlob(html,'text/html','detail-page.html'));

  const reference = parseImageDataUrl_(request.referenceImage);
  if (reference) {
    replaceFile_(folder,'original-product.'+reference.ext,Utilities.newBlob(reference.bytes,reference.mime,'original-product.'+reference.ext));
  }
  return {projectFolderId:folder.getId(),projectFolderUrl:folder.getUrl()};
}

function sanitizeBrief_(brief) {
  if (!brief || typeof brief !== 'object') throw new Error('상품 정보가 없습니다.');
  const out = {};
  ['name','tagline','audience','problem','features','price','tone','theme','visualStyle','url','steps','proof','brand','policy','constraints'].forEach(k => out[k]=String(brief[k]||'').trim());
  if (!out.name || !out.tagline) throw new Error('상품명과 한 줄 소개는 필수입니다.');
  if (out.url && !/^https?:\/\//i.test(out.url)) throw new Error('구매 링크는 http 또는 https URL이어야 합니다.');
  return out;
}

function validateSectionPayload_(parsed) {
  if (!parsed || !Array.isArray(parsed.sections) || parsed.sections.length !== 13) throw new Error('AI가 13개 섹션을 반환하지 않았습니다.');
  const ids = parsed.sections.map(s=>s.id);
  SECTION_IDS.forEach((id,i)=>{if(ids[i]!==id) throw new Error('AI 섹션 순서가 올바르지 않습니다: '+id);});
}

function openAI_(body) {
  const key = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!key) throw new Error('Script Properties에 OPENAI_API_KEY를 설정해 주세요.');
  const response = UrlFetchApp.fetch(OPENAI_RESPONSES_URL,{
    method:'post',
    contentType:'application/json',
    headers:{Authorization:'Bearer '+key},
    payload:JSON.stringify(body),
    muteHttpExceptions:true
  });
  const status = response.getResponseCode();
  const text = response.getContentText();
  let data; try { data = JSON.parse(text); } catch (e) { throw new Error('OpenAI 응답을 해석하지 못했습니다. HTTP '+status); }
  if (status < 200 || status >= 300) {
    const msg = data && data.error && data.error.message ? data.error.message : ('HTTP '+status);
    throw new Error('OpenAI API 오류: '+msg);
  }
  return data;
}

function extractOutputText_(response) {
  const parts = [];
  (response.output || []).forEach(item => {
    if (item.type !== 'message') return;
    (item.content || []).forEach(c => { if (c.type === 'output_text' && c.text) parts.push(c.text); });
  });
  if (!parts.length) throw new Error('OpenAI가 텍스트 결과를 반환하지 않았습니다.');
  return parts.join('');
}

function extractGeneratedImage_(response) {
  const item = (response.output || []).find(x => x.type === 'image_generation_call' && x.result);
  if (!item) throw new Error('OpenAI가 생성 이미지를 반환하지 않았습니다.');
  return item.result;
}

function validImageDataUrl_(value) {
  const v = String(value || '');
  return /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : '';
}

function parseImageDataUrl_(value) {
  const v = validImageDataUrl_(value);
  if (!v) return null;
  const m = v.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
  const subtype = m[1];
  return {mime:'image/'+subtype,ext:subtype==='jpeg'?'jpg':subtype,bytes:Utilities.base64Decode(m[2])};
}

function ensureRootFolder_() {
  const name = prop_('DRIVE_ROOT_FOLDER','상세페이지');
  const root = DriveApp.getRootFolder();
  const it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

function ensureProjectFolder_(brief, requestedId) {
  if (requestedId) {
    try { return DriveApp.getFolderById(requestedId); } catch (e) { console.warn('기존 프로젝트 폴더를 찾지 못해 새 폴더를 생성합니다.'); }
  }
  const root = ensureRootFolder_();
  const name = safeName_(brief.name) + '_' + timestamp_();
  return root.createFolder(name);
}

function replaceFile_(folder, name, blob) {
  const files = folder.getFilesByName(name);
  while (files.hasNext()) files.next().setTrashed(true);
  return folder.createFile(blob.setName(name));
}

function safeName_(value) {
  return String(value || '상품').replace(/[\\/:*?"<>|#%{}]/g,'_').replace(/\s+/g,' ').trim().slice(0,80) || '상품';
}

function timestamp_() { return Utilities.formatDate(new Date(),'Asia/Seoul','yyyyMMdd_HHmmss'); }
function prop_(name,fallback) { return PropertiesService.getScriptProperties().getProperty(name) || fallback; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
