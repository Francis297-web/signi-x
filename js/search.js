// search.js - Signix live search
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  if (!input) return;

  const cards = document.querySelectorAll('[data-search]');
  if (!cards.length) return;

  const grid = cards[0].parentElement;

  // Create no-results element
  let noResults = document.getElementById('noResults');
  if (!noResults) {
    noResults = document.createElement('div');
    noResults.id = 'noResults';
    noResults.className = 'col-12 text-center py-5 d-none';
    noResults.innerHTML = `
      <span class="logo-circle mx-auto mb-3" style="width:56px;height:56px"><img src="image/SIGNIX.png" alt=""></span>
      <h6 class="fw-bold">No results for "<span id="qText"></span>"</h6>
      <p class="small text-secondary mb-0">Try "Karibu", "Asante" or a creator name</p>`;
    grid.appendChild(noResults);
  }
  const qText = document.getElementById('qText');

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = input.value.toLowerCase().trim();
      let visible = 0;

      cards.forEach(card => {
        const hay = (card.getAttribute('data-search') || card.textContent).toLowerCase();
        const match =!q || hay.includes(q);
        card.style.display = match? '' : 'none';
        if (match) visible++;
      });

      const showEmpty = q && visible === 0;
      noResults.classList.toggle('d-none',!showEmpty);
      if (qText) qText.textContent = q;
    }, 120);
  });

  // ESC to clear
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.blur();
    }
  });
});
