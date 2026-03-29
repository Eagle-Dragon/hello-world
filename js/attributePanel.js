// ============================================================
// attributePanel.js — Attribute point-buy UI
// ============================================================

import { state, updateChar, getModifier, getDerivedStats, POINT_BUY_COST } from './app.js';

const ATTRIBUTES = [
  { id: 'STR', name: 'Força',        nameEn: 'STR', desc: 'Poder físico, capacidade de carga e combate corpo-a-corpo.' },
  { id: 'DEX', name: 'Destreza',     nameEn: 'DEX', desc: 'Agilidade, reflexos, furtividade e ataques à distância.' },
  { id: 'CON', name: 'Constituição', nameEn: 'CON', desc: 'Resistência, pontos de vida e tolerância ao dano.' },
  { id: 'INT', name: 'Inteligência', nameEn: 'INT', desc: 'Memória, raciocínio e poder mágico arcano.' },
  { id: 'WIS', name: 'Sabedoria',    nameEn: 'WIS', desc: 'Percepção, intuição e conexão com o mundo espiritual.' },
  { id: 'CHA', name: 'Carisma',      nameEn: 'CHA', desc: 'Personalidade, liderança e influência sobre outros.' }
];

export function initAttributePanel() {
  renderAttributes();
  document.addEventListener('class:changed', updateAttributeDisplay);
}

function renderAttributes() {
  const container = document.getElementById('attr-container');
  if (!container) return;
  container.innerHTML = '';

  ATTRIBUTES.forEach(attr => {
    const score = state.attributes.scores[attr.id];
    const mod = getModifier(score);
    const row = document.createElement('div');
    row.className = 'attr-row';
    row.dataset.attr = attr.id;
    row.innerHTML = `
      <div class="attr-info">
        <span class="attr-abbr">${attr.nameEn}</span>
        <span class="attr-name">${attr.name}</span>
      </div>
      <div class="attr-controls">
        <button class="attr-btn attr-minus" data-attr="${attr.id}">−</button>
        <div class="attr-score-wrap">
          <span class="attr-score" id="score-${attr.id}">${score}</span>
          <span class="attr-mod ${mod >= 0 ? 'pos' : 'neg'}" id="mod-${attr.id}">${mod >= 0 ? '+' : ''}${mod}</span>
        </div>
        <button class="attr-btn attr-plus" data-attr="${attr.id}">+</button>
      </div>
      <div class="attr-desc">${attr.desc}</div>
    `;
    container.appendChild(row);
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.attr-btn');
    if (!btn) return;
    const attrId = btn.dataset.attr;
    if (btn.classList.contains('attr-plus')) adjustScore(attrId, 1);
    else if (btn.classList.contains('attr-minus')) adjustScore(attrId, -1);
  });

  updatePointsDisplay();
  renderDerivedStats();
}

function adjustScore(attrId, delta) {
  const current = state.attributes.scores[attrId];
  const newScore = current + delta;
  if (newScore < 8 || newScore > 15) return;

  const oldCost = POINT_BUY_COST[current - 8];
  const newCost = POINT_BUY_COST[newScore - 8];
  const costDelta = newCost - oldCost;

  if (costDelta > state.attributes.pointsRemaining) return;

  const newScores = { ...state.attributes.scores, [attrId]: newScore };
  updateChar('attributes.scores', newScores);
  updateChar('attributes.pointsRemaining', state.attributes.pointsRemaining - costDelta);

  updateScoreDisplay(attrId, newScore);
  updatePointsDisplay();
  renderDerivedStats();
}

function updateScoreDisplay(attrId, score) {
  const scoreEl = document.getElementById(`score-${attrId}`);
  const modEl = document.getElementById(`mod-${attrId}`);
  if (!scoreEl || !modEl) return;
  const mod = getModifier(score);
  scoreEl.textContent = score;
  modEl.textContent = (mod >= 0 ? '+' : '') + mod;
  modEl.className = `attr-mod ${mod >= 0 ? 'pos' : 'neg'}`;
}

function updateAttributeDisplay() {
  ATTRIBUTES.forEach(attr => {
    updateScoreDisplay(attr.id, state.attributes.scores[attr.id]);
  });
  updatePointsDisplay();
  renderDerivedStats();
}

function updatePointsDisplay() {
  const el = document.getElementById('points-remaining');
  if (el) {
    el.textContent = state.attributes.pointsRemaining;
    el.className = state.attributes.pointsRemaining <= 0 ? 'points-zero' : '';
  }
}

function renderDerivedStats() {
  const stats = getDerivedStats();
  const map = {
    'derived-hp': stats.maxHP,
    'derived-ac': stats.armorClass,
    'derived-init': (stats.initiative >= 0 ? '+' : '') + stats.initiative,
    'derived-speed': stats.speed + 'm',
    'derived-carry': stats.carryCapacity + ' kg',
    'derived-prof': '+' + stats.proficiencyBonus
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}
