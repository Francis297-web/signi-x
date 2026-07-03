/* ============================================================
   SIGNIX — shared front-end behavior
   Mobile nav, creator-feed likes, language search/filter,
   and the mock upload form.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initLikeButtons();
  initLanguageFilter();
  initUploadForm();
});

/* ---------- Mobile nav toggle ---------- */
function initNavToggle(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // close the menu after a link is chosen (mobile)
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

/* ---------- Creator feed like buttons ---------- */
function initLikeButtons(){
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const liked = btn.classList.toggle('liked');
      btn.setAttribute('aria-pressed', String(liked));
      btn.textContent = liked ? '♥' : '♡';
    });
  });

  // "Load more" on the creators page just reveals a hidden batch —
  // no backend yet, so this simulates pagination.
  const loadMoreBtn = document.querySelector('[data-load-more]');
  if(loadMoreBtn){
    loadMoreBtn.addEventListener('click', () => {
      document.querySelectorAll('.feed-card[hidden]').forEach((card, i) => {
        if(i < 5) card.removeAttribute('hidden');
      });
      if(!document.querySelector('.feed-card[hidden]')){
        loadMoreBtn.textContent = 'That\u2019s everything for now';
        loadMoreBtn.disabled = true;
      }
    });
  }
}

/* ---------- Language directory: search + status filter ---------- */
function initLanguageFilter(){
  const searchInput = document.querySelector('[data-lang-search]');
  const chips = document.querySelectorAll('[data-lang-filter]');
  const cards = document.querySelectorAll('.lang-card');
  const countEl = document.querySelector('[data-result-count]');
  if(!cards.length) return;

  let activeStatus = 'all';

  function applyFilters(){
    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const code = (card.dataset.code || '').toLowerCase();
      const status = card.dataset.status || 'soon';

      const matchesQuery = !query || name.includes(query) || code.includes(query);
      const matchesStatus = activeStatus === 'all' || status === activeStatus;
      const show = matchesQuery && matchesStatus;

      card.hidden = !show;
      if(show) visible++;
    });

    if(countEl) countEl.textContent = `${visible} language${visible === 1 ? '' : 's'}`;
  }

  if(searchInput) searchInput.addEventListener('input', applyFilters);

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStatus = chip.dataset.langFilter;
      applyFilters();
    });
  });

  applyFilters();
}

/* ---------- Upload form (mock — no backend yet) ---------- */
function initUploadForm(){
  const form = document.querySelector('#upload-form');
  if(!form) return;

  const dropzone = form.querySelector('.dropzone');
  const fileInput = form.querySelector('#video-file');
  const filenameEl = form.querySelector('.filename');
  const successEl = form.querySelector('.form-success');
  const submitBtn = form.querySelector('button[type=submit]');

  if(dropzone && fileInput){
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fileInput.click(); }
    });

    ['dragenter','dragover'].forEach(evt =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag'); })
    );
    ['dragleave','drop'].forEach(evt =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); })
    );
    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if(file){ fileInput.files = e.dataTransfer.files; showFilename(file.name); }
    });
    fileInput.addEventListener('change', () => {
      if(fileInput.files[0]) showFilename(fileInput.files[0].name);
    });
  }

  function showFilename(name){
    if(filenameEl) filenameEl.textContent = name;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // No backend is wired up yet — this only simulates a successful
    // submission so the flow can be reviewed end to end.
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Uploading\u2026'; }
    setTimeout(() => {
      if(successEl) successEl.classList.add('show');
      if(submitBtn){ submitBtn.textContent = 'Uploaded'; }
      form.reset();
      if(filenameEl) filenameEl.textContent = '';
    }, 900);
  });
}
