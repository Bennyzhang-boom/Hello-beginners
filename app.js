
const initialDocs = [
  { name: '用户访谈纪要.pdf', meta: 'PDF · 2.4 MB', type: 'pdf', label: 'PDF' },
  { name: '项目方案 V2.docx', meta: 'Word · 856 KB', type: 'doc', label: 'DOC' },
  { name: '需求讨论会.pptx', meta: 'PPT · 4.1 MB', type: 'ppt', label: 'PPT' },
  { name: '竞品调研.xlsx', meta: 'Excel · 1.2 MB', type: 'xls', label: 'XLS' }
];
let docs = [...initialDocs];
const list = document.querySelector('#document-list');
const count = document.querySelector('#doc-count');
const libraryNumber = document.querySelector('#library-number');
const toast = document.querySelector('#toast');

function renderDocs() {
  list.innerHTML = docs.length ? docs.map((doc, index) => `<div class="doc-item"><span class="file-icon ${doc.type}">${doc.label}</span><div><span class="doc-name" title="${doc.name}">${doc.name}</span><span class="doc-meta">${doc.meta}</span></div><button class="remove-doc" data-index="${index}" aria-label="移除 ${doc.name}">×</button></div>`).join('') : '<div class="no-docs">还没有资料，先上传一份文件吧。</div>';
  count.textContent = docs.length;
  libraryNumber.textContent = docs.length;
  document.querySelectorAll('.remove-doc').forEach(btn => btn.addEventListener('click', () => { docs.splice(Number(btn.dataset.index), 1); renderDocs(); }));
}
function message(text) { toast.textContent = text; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400); }
function extension(name) { return name.split('.').pop().toLowerCase(); }
function makeDoc(file) {
  const ext = extension(file.name); const data = { pdf:['pdf','PDF'], doc:['doc','DOC'], docx:['doc','DOC'], ppt:['ppt','PPT'], pptx:['ppt','PPT'], xls:['xls','XLS'], xlsx:['xls','XLS'], txt:['doc','TXT'], md:['doc','MD'] }[ext] || ['doc','FILE'];
  return { name:file.name, meta:`${data[1]} · ${(file.size / 1024 / 1024).toFixed(file.size > 1024*1024 ? 1 : 0)} ${file.size > 1024*1024 ? 'MB' : 'KB'}`, type:data[0], label:data[1] };
}
function addFiles(files) { const valid = [...files].filter(file => file.size <= 50 * 1024 * 1024); docs.push(...valid.map(makeDoc)); renderDocs(); if (valid.length) message(`已添加 ${valid.length} 份资料（仅保留在当前页面）`); if (valid.length !== files.length) message('超过 50 MB 的文件未添加'); }
document.querySelector('#file-input').addEventListener('change', e => addFiles(e.target.files));
const dropzone = document.querySelector('#dropzone');
['dragenter','dragover'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.add('dragging'); }));
['dragleave','drop'].forEach(event => dropzone.addEventListener(event, e => { e.preventDefault(); dropzone.classList.remove('dragging'); }));
dropzone.addEventListener('drop', e => addFiles(e.dataTransfer.files));
document.querySelector('#demo-btn').addEventListener('click', () => { docs = [...initialDocs]; renderDocs(); message('示例资料已载入'); });
document.querySelector('#clear-btn').addEventListener('click', () => { docs = []; renderDocs(); message('已清空当前页面中的资料'); });
document.querySelector('#analyze-btn').addEventListener('click', () => { if (!docs.length) return message('请先添加至少一份资料'); document.querySelector('#result-empty').classList.add('hidden'); document.querySelector('#result-content').classList.remove('hidden'); document.querySelector('#results').scrollIntoView({ behavior:'smooth', block:'center' }); message('已生成模拟整理结果'); });
document.querySelector('#copy-btn').addEventListener('click', async () => { const text = '项目资料综述\n\n核心概述：这组资料共同描绘了一个以用户需求为起点、分阶段推进的项目框架。\n\n关键词：用户需求、项目规划、效率提升、核心流程、阶段目标、反馈验证、协同、指标'; try { await navigator.clipboard.writeText(text); message('结果已复制到剪贴板'); } catch { message('浏览器未允许复制，请手动选择文字'); } });
document.querySelector('#export-btn').addEventListener('click', () => { const text = '项目资料综述（模拟演示结果）\n\n核心概述\n这组资料共同描绘了一个以用户需求为起点、分阶段推进的项目框架。\n\n关键词\n用户需求、项目规划、效率提升、核心流程、阶段目标、反馈验证、协同、指标\n\n说明：本结果为前端原型的预设演示内容，尚未连接真实 AI 或文件解析服务。'; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'})); a.download = '项目资料综述-模拟结果.txt'; a.click(); URL.revokeObjectURL(a.href); message('已导出文本文件'); });
document.querySelector('#trace-btn').addEventListener('click', () => message('当前展示两条示例溯源，真实溯源需接入文件解析服务'));
document.querySelectorAll('.source-file').forEach(btn => btn.addEventListener('click', () => message('演示原型中无法打开本地原文')));
const dialog = document.querySelector('#info-dialog');
document.querySelector('#privacy-btn').addEventListener('click', () => dialog.showModal()); document.querySelector('#help-btn').addEventListener('click', () => dialog.showModal()); document.querySelector('#dialog-close').addEventListener('click', () => dialog.close()); document.querySelector('#dialog-ok').addEventListener('click', () => dialog.close());
renderDocs();

