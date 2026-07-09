// upload.js - Signix upload handler
const UPLOAD_ENDPOINT = "https://api.cloudinary.com/v1_1/dvtlbpkly/video/upload";
const UPLOAD_PRESET = "signix_uploads";

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('video-file');
const preview = document.getElementById('preview');
const videoEl = document.getElementById('videoPreview');
const dropContent = document.getElementById('dropContent');
const fileMeta = document.getElementById('fileMeta');
const removeBtn = document.getElementById('removeFile');
const form = document.getElementById('upload-form');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const uploadStatus = document.getElementById('uploadStatus');
const successBox = document.getElementById('successBox');
const errorBox = document.getElementById('errorBox');
const submitBtn = document.getElementById('submitBtn');

let selectedFile = null;
const MAX_MB = 100;

function handleFile(f){
  if(!f ||!f.type.startsWith('video/')) return;
  if(f.size > MAX_MB * 1024){
    fileMeta.textContent = `File too big. Max ${MAX_MB}MB`;
    fileMeta.classList.add('text-danger');
    return;
  }
  fileMeta.classList.remove('text-danger');
  selectedFile = f;
  const url = URL.createObjectURL(f);
  videoEl.src = url;
  preview.style.display = 'block';
  dropContent.style.opacity = '0';
  dropContent.style.pointerEvents = 'none';
  dropzone.classList.add('has-file');
  removeBtn.classList.remove('d-none');
  fileMeta.textContent = `${f.name} • ${(f.size/1024/1024).toFixed(1)} MB`;
}

function clearFile(){
  selectedFile = null;
  if(videoEl.src) URL.revokeObjectURL(videoEl.src);
  videoEl.pause(); videoEl.removeAttribute('src');
  preview.style.display = 'none';
  dropContent.style.opacity = '1'; dropContent.style.pointerEvents = 'auto';
  dropzone.classList.remove('has-file','dragover');
  removeBtn.classList.add('d-none');
  fileInput.value=''; fileMeta.textContent='';
  progressWrap.classList.add('d-none');
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
  successBox.classList.add('d-none'); errorBox.classList.add('d-none');
}

dropzone?.addEventListener('click',()=>fileInput.click());
dropzone?.addEventListener('dragover',e=>{e.preventDefault();dropzone.classList.add('dragover')});
dropzone?.addEventListener('dragleave',()=>dropzone.classList.remove('dragover'));
dropzone?.addEventListener('drop',e=>{e.preventDefault();dropzone.classList.remove('dragover'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])});
fileInput?.addEventListener('change',()=>{if(fileInput.files[0]) handleFile(fileInput.files[0])});
removeBtn?.addEventListener('click',e=>{e.stopPropagation();clearFile()});

async function uploadToSignix(file){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'signix');

  const signer = document.getElementById('signer-username')?.value.trim() || 'unknown';
  const lang = document.getElementById('language-name')?.value.trim() || 'KSL';
  const word = document.getElementById('sign-word')?.value.trim() || 'untitled';
  const category = document.getElementById('category')?.value || '';
  const description = document.getElementById('description')?.value.trim() || '';

  fd.append('context', `signer=${signer}|language=${lang}|word=${word}|category=${category}`);
  fd.append('tags', `${lang},${category},signix`);
  if(description) fd.append('context', `caption=${description}`);

  return new Promise((resolve, reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_ENDPOINT);
    xhr.upload.onprogress = (e)=>{
      if(e.lengthComputable){
        const pct = Math.round((e.loaded/e.total)*100);
        progressBar.style.width = pct+'%';
        progressText.textContent = pct+'%';
        uploadStatus.textContent = `${(e.loaded/1024/1024).toFixed(1)} / ${(e.total/1024/1024).toFixed(1)} MB • ${pct}%`;
      }
    };
    xhr.onload = ()=> {
      try{
        const res = JSON.parse(xhr.responseText);
        if(xhr.status>=200 && xhr.status<300) resolve(res);
        else reject(res?.error?.message || xhr.responseText);
      }catch{ reject(xhr.responseText); }
    };
    xhr.onerror = ()=> reject('Network error');
    xhr.send(fd);
  });
}

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  errorBox.classList.add('d-none'); successBox.classList.add('d-none');

  const signerEl = document.getElementById('signer-username');
  const wordEl = document.getElementById('sign-word');
  const langEl = document.getElementById('language-name');

  if(!selectedFile){ fileMeta.textContent='Choose a video first'; fileMeta.classList.add('text-danger'); return; }
  if(!signerEl.value.trim()){ signerEl.focus(); return; }
  if(!wordEl.value.trim()){ wordEl.focus(); return; }
  if(!langEl.value.trim()){ langEl.focus(); return; }

  submitBtn.disabled=true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading to Signix...';
  progressWrap.classList.remove('d-none');
  uploadStatus.textContent = 'Starting...';

  try{
    const res = await uploadToSignix(selectedFile);
    successBox.classList.remove('d-none');
    uploadStatus.textContent='Complete and queued for review';
    // res.secure_url is available here if you want to save to your DB
    console.log('Stored:', res.secure_url);
    setTimeout(clearFile, 1500);
  }catch(err){
    errorBox.textContent = typeof err === 'string'? err : 'Upload failed, check preset name is signix_uploads and is Unsigned.';
    errorBox.classList.remove('d-none');
    uploadStatus.textContent='Failed';
  }finally{
    submitBtn.disabled=false;
    submitBtn.textContent='Upload to Signix';
  }
});
