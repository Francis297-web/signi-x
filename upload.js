// upload.js - phone + desktop + real feed
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('video-file');
  const camInput = document.getElementById('video-camera');
  const dropzone = document.getElementById('dropzone');
  const preview = document.getElementById('preview');
  const videoPreview = document.getElementById('videoPreview');
  const fileMeta = document.getElementById('fileMeta');
  const removeBtn = document.getElementById('removeFile');
  const progressWrap = document.getElementById('progressWrap');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const form = document.getElementById('upload-form');
  let selectedFile = null;

  const CLOUD_NAME = "dvtlbpkly";
  const UPLOAD_PRESET = "signix_uploads";

  function handleFile(file){
    if(!file) return;
    if(file.size > 100 * 1024 * 1024){ alert("Max 100MB"); return; }
    selectedFile = file;
    fileMeta.textContent = `${file.name} • ${(file.size/1024/1024).toFixed(1)} MB`;
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    preview.style.display = "block";
    dropzone.classList.add("has-file");
    removeBtn.classList.remove("d-none");
  }

  fileInput?.addEventListener('change', e => handleFile(e.target.files[0]));
  camInput?.addEventListener('change', e => {
    if(e.target.files[0]){
      const dt = new DataTransfer(); dt.items.add(e.target.files[0]);
      fileInput.files = dt.files; handleFile(e.target.files[0]);
    }
  });
  dropzone?.addEventListener('click', e => { if(!e.target.closest('button')) fileInput.click(); });
  dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone?.addEventListener('drop', e => { e.preventDefault(); dropzone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
  removeBtn?.addEventListener('click', e => { e.stopPropagation(); selectedFile=null; fileInput.value=""; if(camInput) camInput.value=""; preview.style.display="none"; videoPreview.src=""; fileMeta.textContent=""; dropzone.classList.remove("has-file"); removeBtn.classList.add("d-none"); });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if(!selectedFile){ alert("Choose a video first"); return; }
    const signer = document.getElementById('signer-username').value.trim();
    const word = document.getElementById('sign-word').value.trim();
    if(!signer ||!word){ alert("Fill required fields"); return; }

    progressWrap.classList.remove('d-none'); progressBar.style.width="0%"; progressText.textContent="0%";
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("tags", "signix"); // <-- critical for listing
    fd.append("context", `signer=${signer}|word=${word}`);

    try{
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
      xhr.upload.onprogress = ev => { if(ev.lengthComputable){ const p=Math.round(ev.loaded/ev.total*100); progressBar.style.width=p+"%"; progressText.textContent=p+"%"; } };
      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        if(res.secure_url){
          // Save to localStorage so it shows instantly on creators page
          const list = JSON.parse(localStorage.getItem('signix_videos')||'[]');
          list.unshift({
            url: res.secure_url,
            word: word,
            signer: signer,
            language: document.getElementById('language-name').value,
            category: document.getElementById('category').value,
            createdAt: Date.now()
          });
          localStorage.setItem('signix_videos', JSON.stringify(list));
          document.getElementById('successBox').classList.remove('d-none');
          setTimeout(()=> window.location.href='creators.html', 1200);
        } else { throw new Error(res.error?.message || 'Upload failed'); }
      };
      xhr.onerror = () => { throw new Error('Network error'); };
      xhr.send(fd);
    }catch(err){ document.getElementById('errorBox').textContent=err.message; document.getElementById('errorBox').classList.remove('d-none'); }
  });
});
