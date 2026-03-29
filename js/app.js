// ============================================================
// app.js — State manager, tab routing, data loader
// ============================================================

export const state = {
  meta: { version: '1.0' },
  identity: {
    name: '',
    gender: 'male',
    pronouns: ''
  },
  class: {
    classId: null,
    subclassId: null,
    level: 1
  },
  attributes: {
    pointsRemaining: 27,
    scores: { STR: 10, DEX: 10, INT: 10, WIS: 10, CON: 10, CHA: 10 }
  },
  appearance: {
    height: 0.5,
    build: 0.5,
    skinTone: '#c68642',
    hairColor: '#3d2b1f',
    hairStyle: 0,
    eyeColor: '#5b8dd9',
    facePreset: 0
  },
  equipment: {
    mainHand: null,
    offHand: null
  },
  _data: {
    classes: [],
    weapons: []
  }
};

// Point-buy cost table: index = score - 8 (scores 8-15)
export const POINT_BUY_COST = [0, 1, 2, 3, 4, 5, 7, 9];

export function getModifier(score) {
  return Math.floor((score - 10) / 2);
}

export function getDerivedStats() {
  const { scores } = state.attributes;
  const cls = state._data.classes.find(c => c.id === state.class.classId);
  const hitDie = cls ? cls.hitDie : 8;
  return {
    maxHP: hitDie + getModifier(scores.CON),
    initiative: getModifier(scores.DEX),
    armorClass: 10 + getModifier(scores.DEX),
    speed: 9,
    proficiencyBonus: 2,
    carryCapacity: scores.STR * 15
  };
}

// Update a nested path in state and dispatch event
export function updateChar(path, value) {
  const parts = path.split('.');
  let obj = state;
  for (let i = 0; i < parts.length - 1; i++) {
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  document.dispatchEvent(new CustomEvent('char:updated', { detail: { path, value } }));
}

// Tab routing
export function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${target}`).classList.add('active');
    });
  });
}

// Load JSON data
export async function loadData() {
  try {
    const [classesRes, weaponsRes] = await Promise.all([
      fetch('data/classes.json'),
      fetch('data/weapons.json')
    ]);
    const classesData = await classesRes.json();
    const weaponsData = await weaponsRes.json();
    state._data.classes = classesData.classes;
    state._data.weapons = weaponsData.weapons;
    state._data.weaponCategories = weaponsData.categories;
    document.dispatchEvent(new CustomEvent('data:loaded'));
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// Restore state from URL hash (share link)
export function loadFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return false;
  try {
    const decoded = JSON.parse(atob(hash));
    if (decoded.identity) Object.assign(state.identity, decoded.identity);
    if (decoded.class) Object.assign(state.class, decoded.class);
    if (decoded.attributes) Object.assign(state.attributes, decoded.attributes);
    if (decoded.appearance) Object.assign(state.appearance, decoded.appearance);
    if (decoded.equipment) Object.assign(state.equipment, decoded.equipment);
    return true;
  } catch {
    return false;
  }
}

// Encode state to URL hash
export function encodeStateToHash() {
  const payload = {
    identity: state.identity,
    class: state.class,
    attributes: state.attributes,
    appearance: state.appearance,
    equipment: state.equipment
  };
  return btoa(JSON.stringify(payload));
}
