const {test}=require('node:test');
const assert=require('node:assert/strict');
const {CANONICAL_SECTIONS,createSections,normalizeAISections,renderPage,safeURL}=require('../studio.js');

const brief={name:'테스트 상품',tagline:'상품 소개',features:'특징 하나\n특징 둘',theme:'ocean',url:'https://example.com/product',price:'10,000원',problem:'불편',audience:'고객',steps:'사용법',proof:'실제 근거',brand:'소개',policy:'정책'};

test('template creates the canonical thirteen sections',()=>{
  const s=createSections(brief);
  assert.equal(s.length,13);
  assert.deepEqual(s.map(x=>x.id),CANONICAL_SECTIONS.map(x=>x[0]));
});

test('all thirteen sections and edited text are exported',()=>{
  const s=createSections(brief);s[2].title='수정한 제목';s[2].body='고친 내용';
  const html=renderPage(brief,s,'');
  assert.equal((html.match(/<section /g)||[]).length,13);
  assert.ok(html.includes('수정한 제목'));assert.ok(html.includes('고친 내용'));assert.ok(html.includes('href="https://example.com/product"'));
});

test('hidden sections and unavailable evidence stay out of template export',()=>{
  const s=createSections({...brief,proof:'',brand:'',policy:''});
  assert.equal(s.filter(x=>x.enabled).length,10);s[0].enabled=false;
  assert.equal((renderPage(brief,s,'').match(/<section /g)||[]).length,9);
});

test('AI structured output is normalized in canonical order',()=>{
  const raw={sections:CANONICAL_SECTIONS.map(([id,label])=>({id,label,title:id+' title',body:id+' body',enabled:true,image_prompt:'visual '+id}))};
  const s=normalizeAISections(raw,brief);
  assert.equal(s.length,13);assert.equal(s[0].imagePrompt,'visual 01_hero');assert.equal(s[12].id,'13_final_cta');
});

test('AI payload missing a canonical section is rejected',()=>{
  const raw={sections:CANONICAL_SECTIONS.slice(0,12).map(([id,label])=>({id,label,title:'t',body:'b',enabled:true,image_prompt:''}))};
  assert.throws(()=>normalizeAISections(raw,brief),/13_final_cta/);
});

test('section AI images and product photo are embedded safely',()=>{
  const s=createSections(brief);s[1].image='data:image/png;base64,YQ==';
  const html=renderPage(brief,s,'data:image/webp;base64,Yg==');
  assert.ok(html.includes('data:image/png;base64,YQ=='));assert.ok(html.includes('data:image/webp;base64,Yg=='));
  s[1].image='https://tracking.invalid/pixel';
  assert.ok(!renderPage(brief,s,'').includes('tracking.invalid'));
});

test('untrusted copy is escaped and active URLs are rejected',()=>{
  const b={...brief,name:'</title><script>alert(1)</script>',url:'javascript:alert(1)'};
  const html=renderPage(b,createSections(b),'');
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));assert.equal(safeURL('data:text/html,test'),'');assert.ok(html.includes('&lt;script&gt;'));
});

test('unknown theme falls back to safe colors',()=>{
  assert.ok(renderPage({...brief,theme:'</style>'},createSections(brief),'').includes('#2056e8'));
});
