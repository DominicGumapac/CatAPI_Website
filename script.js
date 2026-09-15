document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const resultsEl = document.getElementById('results');
  const emptyStateEl = document.getElementById('empty-state');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-message');
  const challengeButtons = document.querySelectorAll('.challenge-btn');

  const keyMissing =
    typeof CAT_API_KEY === 'undefined' ||
    !CAT_API_KEY ||
    CAT_API_KEY.indexOf('YOUR_') === 0;

  if (keyMissing) {
    showError(
      'No CatAPI key found. Add CAT_API_KEY to config.js.'
    );
  }

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query || keyMissing) return;
    runSearch(query);
  });

  challengeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (keyMissing) return;
      const query = btn.dataset.query;
      runSearch(query);
    });
  });

  async function runSearch(query) {
    showLoading();
    clearError();
    clearResults();

    try {
      const hits = await fetchFromCatAPI(query);
      renderResults(hits);
    } catch (err) {
      showError(err.message || 'Something went wrong while talking to CatAPI. Please try again.');
    } finally {
      hideLoading();
    }
  }

  // The Cat API doesn't do free-text search over arbitrary image content —
  // instead we look up a breed by name, then fetch images for that breed.
  // If no breed matches the query, we fall back to a general random search.
  async function fetchFromCatAPI(query) {
    const headers = { 'x-api-key': CAT_API_KEY };

    const breedParams = new URLSearchParams({ q: query });
    let breedRes;
    try {
      breedRes = await fetch(
        `https://api.thecatapi.com/v1/breeds/search?${breedParams.toString()}`,
        { headers }
      );
    } catch (networkErr) {
      throw new Error('Network error — check your connection and try again.');
    }
    handleCatApiErrors(breedRes);
    const breeds = await breedRes.json();

    const imageParams = new URLSearchParams({
      limit: '16',
      ...(breeds.length > 0 ? { breed_ids: breeds[0].id } : {})
    });

    let imageRes;
    try {
      imageRes = await fetch(
        `https://api.thecatapi.com/v1/images/search?${imageParams.toString()}`,
        { headers }
      );
    } catch (networkErr) {
      throw new Error('Network error — check your connection and try again.');
    }
    handleCatApiErrors(imageRes);

    const images = await imageRes.json();
    // Attach the matched breed name (if any) to each image for tag display.
    return images.map((img) => ({
      ...img,
      tags: breeds.length > 0 ? breeds[0].name : query
    }));
  }

  function handleCatApiErrors(response) {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('CatAPI key was rejected. Check your key in config.js.');
      }
      if (response.status === 429) {
        throw new Error('CatAPI rate limit reached. Wait a moment and try again.');
      }
      if (response.status === 400) {
        throw new Error('CatAPI could not understand that search. Try a different term.');
      }
      throw new Error(`CatAPI request failed (status ${response.status}).`);
    }
  }

  function renderResults(hits) {
    if (!hits || hits.length === 0) {
      emptyStateEl.textContent = 'No results found. Try a different search term.';
      emptyStateEl.classList.remove('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');

    hits.forEach((hit, index) => {
      const card = document.createElement('div');
      card.className = 'result-card';

      const frameNumber = document.createElement('span');
      frameNumber.className = 'result-frame-number';
      frameNumber.textContent = String(index + 1).padStart(2, '0');
      card.appendChild(frameNumber);

      const img = document.createElement('img');
      img.className = 'result-media';
      img.src = hit.url;
      img.alt = hit.tags || 'CatAPI image result';
      img.loading = 'lazy';
      card.appendChild(img);

      const tags = document.createElement('p');
      tags.className = 'result-tags';
      tags.textContent = hit.tags || '';
      card.appendChild(tags);

      resultsEl.appendChild(card);
    });
  }

  function showLoading() { loadingEl.classList.remove('hidden'); }
  function hideLoading() { loadingEl.classList.add('hidden'); }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  function clearError() {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  function clearResults() {
    resultsEl.innerHTML = '';
    emptyStateEl.classList.add('hidden');
  }
});
