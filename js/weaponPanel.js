// ============================================================
// weaponPanel.js — Weapon list, filter and equip
// ============================================================

import { state, updateChar } from './app.js';

let activeFilter = 'all';
let activeCategoryFilter = null;

export function initWeaponPanel() {
  document.addEventListener('data:loaded', renderWeaponPanel);
  document.addEventListener('char:updated', e => {
    if (e.detail.path === 'class.classId') {
      if (activeFilter === 'class') renderWeaponList();
    }
  });
}

function renderWeaponPanel() {
  renderFilterBar();
  renderWeaponList();
  renderEquipmentSlots();
}

function renderFilterBar() {
  const bar = document.getElementById('weapon-filter-bar');
  if (!bar) return;
  const categories = state._data.weaponCategories || [];

  bar.innerHTML = `
    <button class="filter-btn active" data-filter="all">Todas</button>
    <button class="filter-btn" data-filter="class">Compatíveis</button>
    <div class="filter-sep"></div>
    ${categories.map(cat => `
      <button class="filter-btn cat-btn" data-cat="${cat.id}" title="${cat.label}">
        ${cat.icon}
      </button>
    `).join('')}
  `;

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    if (btn.dataset.filter) {
      activeFilter = btn.dataset.filter;
      activeCategoryFilter = null;
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else if (btn.dataset.cat) {
      activeFilter = 'category';
      activeCategoryFilter = btn.dataset.cat;
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    renderWeaponList();
  });
}

function getFilteredWeapons() {
  let weapons = state._data.weapons || [];
  if (activeFilter === 'class' && state.class.classId) {
    const cls = state._data.classes.find(c => c.id === state.class.classId);
    const allowed = cls?.compatibleWeaponCategories || [];
    weapons = weapons.filter(w => allowed.includes(w.category));
  } else if (activeFilter === 'category' && activeCategoryFilter) {
    weapons = weapons.filter(w => w.category === activeCategoryFilter);
  }
  return weapons;
}

function renderWeaponList() {
  const list = document.getElementById('weapon-list');
  if (!list) return;
  const weapons = getFilteredWeapons();

  if (weapons.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhuma arma encontrada para este filtro.</div>';
    return;
  }

  list.innerHTML = '';
  weapons.forEach(w => {
    const isEquipped = state.equipment.mainHand === w.id || state.equipment.offHand === w.id;
    const rarityClass = w.rarity === 'rara' ? 'rarity-rare' : w.rarity === 'incomum' ? 'rarity-uncommon' : 'rarity-common';
    const cat = state._data.weaponCategories?.find(c => c.id === w.category);
    const card = document.createElement('div');
    card.className = `weapon-card ${isEquipped ? 'equipped' : ''} ${rarityClass}`;
    card.innerHTML = `
      <div class="weapon-header">
        <span class="weapon-icon">${cat?.icon || '⚔️'}</span>
        <span class="weapon-name">${w.name}</span>
        <span class="weapon-damage">${w.damage} ${w.damageType}</span>
      </div>
      <div class="weapon-props">
        ${w.properties.map(p => `<span class="prop-tag">${p}</span>`).join('')}
        ${w.twoHanded ? '<span class="prop-tag two-hand">2 mãos</span>' : ''}
      </div>
      <p class="weapon-desc">${w.description}</p>
      <div class="weapon-footer">
        <span class="weapon-cost">${w.cost}</span>
        <span class="weapon-weight">${w.weight} kg</span>
        <div class="equip-btns">
          <button class="equip-btn ${state.equipment.mainHand === w.id ? 'active' : ''}"
            data-slot="mainHand" data-wid="${w.id}">
            ${state.equipment.mainHand === w.id ? '✓ Mão Principal' : 'Equipar'}
          </button>
          ${!w.twoHanded ? `
          <button class="equip-btn secondary ${state.equipment.offHand === w.id ? 'active' : ''}"
            data-slot="offHand" data-wid="${w.id}">
            ${state.equipment.offHand === w.id ? '✓ Mão Secundária' : 'Secundária'}
          </button>` : ''}
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  list.addEventListener('click', e => {
    const btn = e.target.closest('.equip-btn');
    if (!btn) return;
    const { slot, wid } = btn.dataset;
    const current = state.equipment[slot];
    updateChar(`equipment.${slot}`, current === wid ? null : wid);
    renderWeaponList();
    renderEquipmentSlots();
  });
}

function renderEquipmentSlots() {
  const mainEl = document.getElementById('equip-main');
  const offEl = document.getElementById('equip-off');

  if (mainEl) {
    const w = state._data.weapons?.find(w => w.id === state.equipment.mainHand);
    mainEl.innerHTML = w
      ? `<span class="equip-slot-name">${w.name}</span><small>${w.damage} ${w.damageType}</small>`
      : '<span class="equip-slot-empty">Vazio</span>';
  }

  if (offEl) {
    const w = state._data.weapons?.find(w => w.id === state.equipment.offHand);
    offEl.innerHTML = w
      ? `<span class="equip-slot-name">${w.name}</span><small>${w.damage} ${w.damageType}</small>`
      : '<span class="equip-slot-empty">Vazio</span>';
  }
}
