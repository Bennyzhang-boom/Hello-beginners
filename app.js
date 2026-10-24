const initialDocs = [];
let docs = [];
let lastResult = null;
const list = document.querySelector('#document-list');
const count = document.querySelector('#doc-count');
const libraryNumber = document.querySelector('#library-number');
const toast = document.querySelector('#toast');
const analyzeButton = document.querySelector('#analyze-btn');
const fileInput = document.querySelector('#file-input');
const API_BASE = String(window.HUIZHI_API_BASE || '').trim().replace(/\/$/, '');

function renderDocs() {
  list.innerHTML = docs.length ? docs.map((doc, index) => `<div class="doc-item"><span class="file-icon ${doc.type}">${doc.label}</span><div><span class="doc-name" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span><span class="doc-meta">${doc.meta}</span></div><button class="remove-doc" data-index="${index}" aria-label="移除文件">×</button></div>`).join('') : '<div class="no-docs">还没有资料，先上传一份文件吧。</div>';
  count.textContent = docs.length;
  libraryNumber.textContent = docs.length;
  document.querySelectorAll('.remove-doc').forEach(btn => btn.addEventListener('click', () => { docs.splice(Number(btn.dataset.index), 1); renderDocs(); }));
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function message(text) { toast.textContent = text; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
function extension(name) { return name.split('.').pop().toLowerCase(); }
function makeDoc(file) {
  const ext = extension(file.name);
  const types = {pdf:['pdf','PDF'],docx:['doc','DOCX'],pptx:['ppt','PPTX'],xlsx:['xls','XLSX'],txt:['doc','TXT'],md:['doc','MD']};
  const data = types[ext] || ['doc',ext.toUpperCase()];
  return { file, name:file.name, meta:`${(file.size / 1024 / 1024).toFixed(2)} MB`, type:data[0], label:data[1] };
}
function addFiles(fileList) {
  const accepted = new Set(['pdf','docx','pptx','xlsx','txt','md']);
  let added = 0, rejected = 0;
  for (const file of [...fileList]) {
    const ext = extension(file.name);
    if (!accepted.has(ext) || file.size > 20 * 1024 * 1024 || file.size === 0) { rejected++; continue; }
    if (docs.some(d => d.name === file.name && d.file.size === file.size)) continue;
    docs.push(makeDoc(file)); added++;
  }
  renderDocs();
  if (added) message(`已添加 ${added} 份文件`);
  if (rejected) message(`有 ${rejected} 个文件格式不支持、为空或超过 20 MB`);
}
fileInput.addEventListener('change', e => { addFiles(e.target.files); fileInput.value = ''; });
const dropzone = document.querySelector('#dropzone');
['dragenter','dragover'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.add('dragging'); }));
['dragleave','drop'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.remove('dragging'); }));
dropzone.addEventListener('drop', e => addFiles(e.dataTransfer.files));
document.querySelector('#demo-btn').addEventListener('click', () => message('当前版本不再载入虚构示例文件，请上传真实文件'));
document.querySelector('#clear-btn').addEventListener('click', () => { docs = []; lastResult = null; renderDocs(); document.querySelector('#result-empty').classList.remove('hidden'); document.querySelector('#result-content').classList.add('hidden'); message('已清空当前页面中的文件'); });

function showResult(result) {
  lastResult = result;
  document.querySelector('#result-empty').classList.add('hidden');
  const panel = document.querySelector('#result-content');
  panel.classList.remove('hidden');
  document.querySelector('#result-title').textContent = result.title || '文档整理结果';
  document.querySelector('#result-status').textContent = '由 OpenAI API 生成 · 请核对原文';
  document.querySelector('#result-overview').textContent = result.overview || '没有生成概述。';
  const points = document.querySelector('#result-key-points');
  points.replaceChildren();
  (result.key_points || []).forEach(item => { const li = document.createElement('li'); li.textContent = item; points.appendChild(li); });
  const keywords = document.querySelector('#result-keywords');
  keywords.replaceChildren();
  (result.keywords || []).forEach(item => { const tag = document.createElement('button'); tag.type = 'button'; tag.textContent = item; keywords.appendChild(tag); });
  document.querySelector('#keyword-count').textContent = (result.keywords || []).length;
  const sources = document.querySelector('#result-sources');
  sources.replaceChildren();
  (result.sources || []).forEach(source => {
    const row = document.createElement('div'); row.className = 'source-item';
    const num = document.createElement('span'); num.className = 'source-num'; num.textContent = String(sources.children.length + 1).padStart(2,'0');
    const body = document.createElement('div');
    const p = document.createElement('p'); p.textContent = [source.file, source.locator].filter(Boolean).join(' · ');
    const evidence = document.createElement('p'); evidence.textContent = source.evidence ? '依据：' + source.evidence : 'AI 未提供可展示的原文依据';
    body.append(p,evidence); row.append(num,body); sources.appendChild(row);
  });
  (result.files || []).forEach(file => {
    const row = document.createElement('div'); row.className = 'source-item';
    const num = document.createElement('span'); num.className = 'source-num'; num.textContent = String(sources.children.length + 1).padStart(2,'0');
    const p = document.createElement('p'); p.textContent = file.name + (file.extracted_chars ? ` · 已提取 ${file.extracted_chars} 个字符` : '');
    row.append(num,p); sources.appendChild(row);
  });
  document.querySelector('#results').scrollIntoView({ behavior:'smooth', block:'center' });
}
function resultAsText() {
  if (!lastResult) return '';
  return [
    lastResult.title || '文档整理结果',
    '',
    '核心概述',
    lastResult.overview || '',
    '',
    '关键结论',
    ...(lastResult.key_points || []).map((x,i) => `${i+1}. ${x}`),
    '',
    '关键词',
    (lastResult.keywords || []).join('、'),
    '',
    '分析文件',
    ...(lastResult.files || []).map(x => `- ${x.name}`),
    '',
    '说明：内容由 AI 生成，请核对原文。'
  ].join('\n');
}
analyzeButton.addEventListener('click', async () => {
  if (!docs.length) return message('请先上传至少一份真实文件');
  if (!API_BASE) return message('还未配置后端地址：请先部署 backend 并填写 config.js');
  const form = new FormData();
  docs.forEach(doc => form.append('files', doc.file, doc.name));
  const originalText = analyzeButton.innerHTML;
  analyzeButton.disabled = true;
  analyzeButton.innerHTML = '<span>…</span> 正在解析并调用 AI <small>请稍候</small>';
  try {
    const response = await fetch(API_BASE + '/api/analyze', { method:'POST', body:form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || `服务请求失败（${response.status}）`);
    showResult(data);
    message('真实 AI 整理完成');
  } catch (err) {
    message(err.message || '请求失败，请检查后端部署和网络');
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.innerHTML = originalText;
  }
});
document.querySelector('#copy-btn').addEventListener('click', async () => {
  if (!lastResult) return message('请先完成一次真实分析');
  try { await navigator.clipboard.writeText(resultAsText()); message('真实分析结果已复制'); }
  catch { message('浏览器未允许复制，请手动选择文字'); }
});
document.querySelector('#export-btn').addEventListener('click', () => {
  if (!lastResult) return message('请先完成一次真实分析');
  const blob = new Blob([resultAsText()], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = '汇知-文档整理结果.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('已导出真实分析结果');
});
const dialog = document.querySelector('#info-dialog');
document.querySelector('#privacy-btn').addEventListener('click', () => dialog.showModal());
document.querySelector('#help-btn').addEventListener('click', () => dialog.showModal());
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-ok').addEventListener('click', () => dialog.close());
renderDocs();
