// ============================================================
// classSelector.js — Class & Subclass selection UI
// ============================================================

import { state, updateChar } from './app.js';

export function initClassSelector() {
  document.addEventListener('data:loaded', renderClasses);
}

function renderClasses() {
  const grid = document.getElementById('class-grid');
  if (!grid) return;
  grid.innerHTML = '';

  state._data.classes.forEach(cls => {
    const card = document.createElement('div');
    card.className = 'class-card';
    card.dataset.classId = cls.id;
    card.innerHTML = `
      <div class="class-card-header" style="border-left: 3px solid ${cls.visualHints.accentColor}">
        <div class="class-card-name">${cls.name}</div>
        <div class="class-card-primary">${cls.primaryAttributes.join(' + ')}</div>
      </div>
      <div class="class-card-desc">${cls.description}</div>
      <div class="class-card-flavor">"${cls.flavor}"</div>
      <div class="class-card-stats">
        <span class="stat-badge">HP d${cls.hitDie}</span>
        ${cls.proficiencies.armor.slice(0, 2).map(a => `<span class="stat-badge">${a}</span>`).join('')}
      </div>
    `;
    card.addEventListener('click', () => selectClass(cls));
    grid.appendChild(card);
  });

  // Re-select if state already has a class
  if (state.class.classId) {
    const existing = grid.querySelector(`[data-class-id="${state.class.classId}"]`);
    if (existing) existing.classList.add('selected');
    const cls = state._data.classes.find(c => c.id === state.class.classId);
    if (cls) renderSubclasses(cls);
  }
}

function selectClass(cls) {
  document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-class-id="${cls.id}"]`)?.classList.add('selected');
  updateChar('class.classId', cls.id);
  updateChar('class.subclassId', null);

  // Apply visual hint to appearance
  if (cls.visualHints.recommendedBuild !== undefined) {
    const slider = document.getElementById('slider-build');
    if (slider) {
      slider.value = cls.visualHints.recommendedBuild;
      updateChar('appearance.build', cls.visualHints.recommendedBuild);
    }
  }

  // Apply starting attribute bonuses
  const scores = { ...state.attributes.scores };
  Object.entries(cls.startingAttributeBonus || {}).forEach(([attr, bonus]) => {
    scores[attr] = Math.min(20, scores[attr] + bonus);
  });
  updateChar('attributes.scores', scores);

  renderSubclasses(cls);

  // Refresh attribute panel display
  document.dispatchEvent(new CustomEvent('class:changed', { detail: cls }));
}

function renderSubclasses(cls) {
  const panel = document.getElementById('subclass-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'subclass-title';
  title.textContent = `Subclasses de ${cls.name}`;
  panel.appendChild(title);
  panel.style.display = 'block';

  cls.subclasses.forEach(sub => {
    const card = document.createElement('div');
    card.className = 'subclass-card';
    card.dataset.subId = sub.id;
    card.innerHTML = `
      <div class="subclass-header">
        <span class="subclass-name">${sub.name}</span>
        <span class="subclass-pick ${state.class.subclassId === sub.id ? 'active' : ''}">
          ${state.class.subclassId === sub.id ? '✓ Selecionado' : 'Escolher'}
        </span>
      </div>
      <p class="subclass-desc">${sub.description}</p>
      <div class="subclass-features">
        ${sub.features.slice(0, 2).map(f => `
          <div class="feature-item">
            <strong>${f.name}</strong>
            <p>${f.description}</p>
          </div>
        `).join('')}
      </div>
    `;
    card.addEventListener('click', () => selectSubclass(sub, card));
    panel.appendChild(card);
  });
}

function selectSubclass(sub, cardEl) {
  document.querySelectorAll('.subclass-card').forEach(c => {
    c.classList.remove('selected');
    const btn = c.querySelector('.subclass-pick');
    if (btn) btn.textContent = 'Escolher';
    if (btn) btn.classList.remove('active');
  });
  cardEl.classList.add('selected');
  const btn = cardEl.querySelector('.subclass-pick');
  if (btn) { btn.textContent = '✓ Selecionado'; btn.classList.add('active'); }
  updateChar('class.subclassId', sub.id);
}
