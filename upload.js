// upload.js - Cloudinary video upload for Signix
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dvtlbpkly/video/upload";
const UPLOAD_PRESET = "signix_unsigned"; // create unsigned preset in Cloudinary dashboard

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
const urlBox = document.getElementById('urlBox');
const cloudinaryUrl = document.getElementById('cloudinaryUrl');
const cloudinaryLink = document.getElementById('cloudinaryLink');
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
  progressWrap.classList.add('d-none'); urlBox.classList.add('d-none');
  successBox.classList.add('d-none'); errorBox.classList.add('d-none');
}

dropzone.addEventListener('click',()=>fileInput.click());
dropzone.addEventListener('dragover',e=>{e.preventDefault();dropzone.classList.add('dragover')});
dropzone.addEventListener('dragleave',()=>dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop',e=>{e.preventDefault();dropzone.classList.remove('dragover'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])});
fileInput.addEventListener('change',()=>{if(fileInput.files[0]) handleFile(fileInput.files[0])});
removeBtn.addEventListener('click',e=>{e.stopPropagation();clearFile()});

async function uploadToCloudinary(file){
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'signix');

  return new Promise((resolve, reject)=>{
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_URL);
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
  const word = document.getElementById('sign-word').value.trim(); if(!word){ document.getElementById('sign-word').focus(); return; }

  submitBtn.disabled=true; submitBtn.textContent='Uploading...';
  progressWrap.classList.remove('d-none');

  try{
    const res = await uploadToCloudinary(selectedFile);
    cloudinaryUrl.textContent = res.secure_url;
    cloudinaryLink.href = res.secure_url;
    urlBox.classList.remove('d-none');
    successBox.classList.remove('d-none');
    uploadStatus.textContent='Complete';
    console.log('Saved URL:', res.secure_url);
  }catch(err){
    errorBox.textContent='Upload failed: '+err;
    errorBox.classList.remove('d-none');
  }finally{
    submitBtn.disabled=false; submitBtn.textContent='Upload to Cloudinary';
  }
});
