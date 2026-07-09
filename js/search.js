// search.js - fixed for Learn page
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn') || document.querySelector('.search-wrap button');
  if (!input) return;

  const cards = () => document.querySelectorAll('[data-search], .sign-card');

  function filter() {
    const q = input.value.toLowerCase().trim();
    let visible = 0;

    cards().forEach(card => {
      const hay = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
      const match = !q || hay.includes(q);
      const col = card.closest('.col-12, .col-sm-6, .col-lg-4, [class*="col-"]') || card;
      col.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    let no = document.getElementById('noResults');
    if (!no && document.querySelector('.row.g-3, #learnGrid')) {
      no = document.createElement('div');
      no.id = 'noResults';
      no.className = 'col-12 text-center py-5';
      no.innerHTML = `<span class="logo-circle lg mx-auto mb-3"><img src="image/SIGNIX.png"></span><h6>No results for "${q}"</h6>`;
      (document.querySelector('.row.g-3') || document.body).appendChild(no);
    }
    if (no) {
      no.style.display = (q && visible === 0) ? '' : 'none';
      if (q) no.querySelector('h6').textContent = `No results for "${q}"`;
    }
  }

  input.addEventListener('input', filter);
  btn?.addEventListener('click', (e) => { e.preventDefault(); filter(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); filter(); } });
});
