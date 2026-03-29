// ============================================================
// exportShare.js — PNG, JSON export and share link
// ============================================================

import { state, encodeStateToHash } from './app.js';
import { getCanvas } from './characterCreator.js';

export function initExport() {
  document.getElementById('btn-export-png')?.addEventListener('click', exportPNG);
  document.getElementById('btn-export-json')?.addEventListener('click', exportJSON);
  document.getElementById('btn-share')?.addEventListener('click', copyShareLink);
  document.getElementById('btn-sheet')?.addEventListener('click', showCharacterSheet);
}

function exportPNG() {
  const canvas = getCanvas();
  if (!canvas) return;
  const link = document.createElement('a');
  const name = state.identity.name || 'personagem';
  link.download = `${name.toLowerCase().replace(/\s+/g, '-')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function exportJSON() {
  const payload = {
    identity: state.identity,
    class: state.class,
    attributes: state.attributes,
    appearance: state.appearance,
    equipment: state.equipment,
    meta: { version: '1.0', exportedAt: new Date().toISOString() }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = state.identity.name || 'personagem';
  link.download = `${name.toLowerCase().replace(/\s+/g, '-')}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyShareLink() {
  const hash = encodeStateToHash();
  const url = `${window.location.origin}${window.location.pathname}#${hash}`;

  try {
    await navigator.clipboard.writeText(url);
    showToast('🔗 Link copiado! Cole no WhatsApp para compartilhar.');
  } catch {
    prompt('Copie este link para compartilhar:', url);
  }
}

function showCharacterSheet() {
  const cls = state._data.classes.find(c => c.id === state.class.classId);
  const sub = cls?.subclasses?.find(s => s.id === state.class.subclassId);
  const scores = state.attributes.scores;

  const getModStr = (s) => {
    const m = Math.floor((s - 10) / 2);
    return (m >= 0 ? '+' : '') + m;
  };

  const mainWeapon = state._data.weapons?.find(w => w.id === state.equipment.mainHand);
  const offWeapon = state._data.weapons?.find(w => w.id === state.equipment.offHand);

  const modal = document.getElementById('sheet-modal');
  const content = document.getElementById('sheet-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="sheet">
      <div class="sheet-header">
        <h1>${state.identity.name || '— Sem Nome —'}</h1>
        <div class="sheet-subtitle">
          ${cls ? `${cls.name}${sub ? ` · ${sub.name}` : ''}` : 'Sem classe'} · Nível ${state.class.level}
        </div>
        <div class="sheet-identity">
          Gênero: ${genderLabel(state.identity.gender)}
          ${state.identity.pronouns ? ` · Pronomes: ${state.identity.pronouns}` : ''}
        </div>
      </div>

      <div class="sheet-grid">
        <div class="sheet-section">
          <h3>Atributos</h3>
          <table class="attr-table">
            ${Object.entries(scores).map(([k, v]) => `
              <tr>
                <td><strong>${k}</strong></td>
                <td>${v}</td>
                <td class="${Math.floor((v-10)/2) >= 0 ? 'pos' : 'neg'}">${getModStr(v)}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class="sheet-section">
          <h3>Estatísticas</h3>
          <div class="sheet-stats">
            <div class="sheet-stat"><label>PV Máx</label><span>${cls ? cls.hitDie + Math.floor((scores.CON - 10) / 2) : '—'}</span></div>
            <div class="sheet-stat"><label>CA</label><span>${10 + Math.floor((scores.DEX - 10) / 2)}</span></div>
            <div class="sheet-stat"><label>Iniciativa</label><span>${getModStr(scores.DEX)}</span></div>
            <div class="sheet-stat"><label>Velocidade</label><span>9m</span></div>
            <div class="sheet-stat"><label>Bônus Prof.</label><span>+2</span></div>
          </div>
        </div>

        ${cls ? `
        <div class="sheet-section">
          <h3>Salvaguardas</h3>
          <p>${cls.savingThrows.join(', ')}</p>
          <h3 style="margin-top:12px">Proficiências</h3>
          <p>Armadura: ${cls.proficiencies.armor.join(', ')}</p>
          <p>Armas: ${cls.proficiencies.weapons.join(', ')}</p>
        </div>` : ''}

        <div class="sheet-section">
          <h3>Equipamento</h3>
          ${mainWeapon ? `<p><strong>Mão principal:</strong> ${mainWeapon.name} (${mainWeapon.damage} ${mainWeapon.damageType})</p>` : '<p>Mão principal: Vazia</p>'}
          ${offWeapon ? `<p><strong>Mão secundária:</strong> ${offWeapon.name}</p>` : '<p>Mão secundária: Vazia</p>'}
        </div>

        ${sub ? `
        <div class="sheet-section sheet-full">
          <h3>Habilidades — ${sub.name}</h3>
          ${sub.features.map(f => `
            <div class="feature-item">
              <strong>${f.name}</strong>
              <p>${f.description}</p>
            </div>
          `).join('')}
        </div>` : ''}
      </div>

      <div class="sheet-actions">
        <button onclick="window.print()" class="btn-secondary">🖨️ Imprimir</button>
        <button onclick="document.getElementById('sheet-modal').classList.remove('open')" class="btn-close">Fechar</button>
      </div>
    </div>
  `;

  modal.classList.add('open');
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  }, { once: true });
}

function genderLabel(g) {
  const labels = {
    male: 'Masculino', female: 'Feminino',
    'non-binary': 'Não-binário', agender: 'Agênero',
    other: 'Outro', 'prefer-not-to-say': 'Prefiro não dizer'
  };
  return labels[g] || g;
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
