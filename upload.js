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

function handleFile(f){
  if(!f ||!f.type.startsWith('video/')) return;
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
  videoEl.pause(); videoEl.removeAttribute('src');
  preview.style.display = 'none';
  dropContent.style.opacity = '1'; dropContent.style.pointerEvents = 'auto';
  dropzone.classList.remove('has-file','dragover');
  removeBtn.classList.add('d-none');
  fileInput.value=''; fileMeta.textContent='';
  progressWrap.classList.add('d-none');
  successBox.classList.add('d-none'); errorBox.classList.add('d-none');
}

dropzone.addEventListener('click',()=>fileInput.click());
dropzone.addEventListener('dragover',e=>{e.preventDefault();dropzone.classList.add('dragover')});
dropzone.addEventListener('dragleave',()=>dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop',e=>{e.preventDefault();dropzone.classList.remove('dragover'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])});
fileInput.addEventListener('change',()=>{if(fileInput.files[0]) handleFile(fileInput.files[0])});
removeBtn.addEventListener('click',e=>{e.stopPropagation();clearFile()});

async function uploadToSignix(file){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'signix');
  const signer = document.getElementById('signer-username').value.trim();
  const lang = document.getElementById('language-name').value.trim();
  const word = document.getElementById('sign-word').value.trim();
  fd.append('context', `signer=${signer}|language=${lang}|word=${word}`);

  return new Promise((resolve, reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_ENDPOINT);
    xhr.upload.onprogress = (e)=>{
      if(e.lengthComputable){
        const pct = Math.round((e.loaded/e.total)*100);
        progressBar.style.width = pct+'%';
        progressText.textContent = pct+'%';
        uploadStatus.textContent = `${(e.loaded/1024/1024).toFixed(1)} / ${(e.total/1024/1024).toFixed(1)} MB`;
      }
    };
    xhr.onload = ()=> xhr.status>=200 && xhr.status<300? resolve(JSON.parse(xhr.responseText)) : reject(xhr.responseText);
    xhr.onerror = ()=> reject('Network error');
    xhr.send(fd);
  });
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  errorBox.classList.add('d-none'); successBox.classList.add('d-none');
  if(!selectedFile){ fileMeta.textContent='Choose a video first'; return; }

  submitBtn.disabled=true; submitBtn.textContent='Uploading to Signix...';
  progressWrap.classList.remove('d-none');

  try{
    const res = await uploadToSignix(selectedFile);
    successBox.classList.remove('d-none');
    uploadStatus.textContent='Complete';
    console.log('Stored:', res.secure_url);
  }catch(err){
    errorBox.textContent='Upload failed, try again.';
    errorBox.classList.remove('d-none');
    uploadStatus.textContent='Failed';
  }finally{
    submitBtn.disabled=false; submitBtn.textContent='Upload to Signix';
  }
});
