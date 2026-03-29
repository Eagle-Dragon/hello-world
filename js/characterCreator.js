// ============================================================
// characterCreator.js — Canvas-based character visual creator
// ============================================================

import { state, updateChar } from './app.js';

let canvas, ctx;
let animFrame = null;
let dirty = false;

// ---- Skin tone palette (12 swatches) ----
export const SKIN_TONES = [
  '#FDDBB4', '#F5CBA7', '#E8B89A', '#D4956A',
  '#C68642', '#B5712A', '#9B5E22', '#8B4513',
  '#6E3A1E', '#4A2512', '#3B1A0D', '#2C1206'
];

// ---- Hair color palette ----
export const HAIR_COLORS = [
  '#FEFEFE', '#F5F5DC', '#E8D5A3', '#D4A84B',
  '#A0522D', '#8B4513', '#4A2E1A', '#1C1008',
  '#E53935', '#8E24AA', '#1565C0', '#00897B'
];

// ---- Eye color palette ----
export const EYE_COLORS = [
  '#5b8dd9', '#3a6bc4', '#2c5282',
  '#4CAF50', '#2E7D32', '#1B5E20',
  '#8B6914', '#6D4C1A', '#4E342E',
  '#424242', '#1A1A1A', '#E53935'
];

// ---- Hair style paths (6 options) ----
const HAIR_STYLES = ['curto', 'médio', 'longo', 'rabo-de-cavalo', 'selvagem', 'careca'];

export function initCanvas() {
  canvas = document.getElementById('char-canvas');
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = 340 * dpr;
  canvas.height = 540 * dpr;
  canvas.style.width = '340px';
  canvas.style.height = '540px';
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  document.addEventListener('char:updated', () => {
    dirty = true;
    if (!animFrame) {
      animFrame = requestAnimationFrame(() => {
        if (dirty) { drawCharacter(); dirty = false; }
        animFrame = null;
      });
    }
  });

  drawCharacter();
}

export function drawCharacter() {
  if (!ctx) return;
  ctx.clearRect(0, 0, 340, 540);

  const { appearance, attributes, identity, class: cls } = state;
  const classData = state._data.classes.find(c => c.id === cls.classId);
  const accentColor = classData?.visualHints?.accentColor || '#c9a84c';

  // Computed morphing values
  const strNorm = (attributes.scores.STR - 8) / 12;   // 0-1
  const conNorm = (attributes.scores.CON - 8) / 12;   // 0-1
  const isFemale = identity.gender === 'female';
  const isNB = identity.gender === 'non-binary' || identity.gender === 'agender';
  const heightScale = 0.75 + appearance.height * 0.5;  // 0.75-1.25
  const buildFactor = appearance.build;                  // 0-1

  const params = {
    sw: 42 + strNorm * 22 + buildFactor * 10 + (isFemale ? -8 : 0), // shoulder half-width
    ww: 20 + buildFactor * 18 + (isFemale ? 2 : 0),                  // waist half-width
    hw: 28 + buildFactor * 14 + (isFemale ? 12 : 0),                 // hip half-width
    armW: 10 + strNorm * 7 + buildFactor * 4,                         // arm half-width
    legW: 14 + buildFactor * 8 + conNorm * 3,                         // leg half-width
    skin: appearance.skinTone,
    hair: appearance.hairColor,
    eye: appearance.eyeColor,
    hairStyle: appearance.hairStyle,
    face: appearance.facePreset,
    gender: identity.gender,
    build: buildFactor,
    str: strNorm,
    height: heightScale
  };

  // Apply height scale from feet up
  ctx.save();
  ctx.translate(170, 530);
  ctx.scale(1, heightScale);
  ctx.translate(-170, -530);

  drawBackground(accentColor);
  drawShadow();
  drawLegs(params);
  drawFeet(params);
  drawTorso(params);
  drawArms(params);
  drawNeck(params);
  drawHead(params);
  drawHair(params);
  drawFace(params);
  drawEquipment();
  drawClassGlow(accentColor);

  ctx.restore();

  drawNameplate();
}

function drawBackground(accentColor) {
  // Dark gradient background
  const grad = ctx.createRadialGradient(170, 400, 30, 170, 300, 260);
  grad.addColorStop(0, '#1a1525');
  grad.addColorStop(1, '#0d0d14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 340, 540);

  // Floor line
  ctx.save();
  ctx.globalAlpha = 0.3;
  const floorGrad = ctx.createLinearGradient(60, 532, 280, 532);
  floorGrad.addColorStop(0, 'transparent');
  floorGrad.addColorStop(0.5, accentColor);
  floorGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = floorGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 532);
  ctx.lineTo(280, 532);
  ctx.stroke();
  ctx.restore();
}

function drawShadow() {
  ctx.save();
  ctx.globalAlpha = 0.35;
  const shadow = ctx.createRadialGradient(170, 532, 5, 170, 528, 55);
  shadow.addColorStop(0, '#000000');
  shadow.addColorStop(1, 'transparent');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(170, 530, 55, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLegs({ sw, ww, hw, legW, skin, build }) {
  const legGap = 6;
  const hipY = 365;
  const kneeY = 445;
  const ankleY = 510;

  // LEFT LEG
  ctx.save();
  roundedTrapezoid(ctx,
    170 - hw + legGap, hipY,
    170 - legGap,      hipY,
    170 - legGap - 2,  ankleY,
    170 - hw + legGap + legW * 0.5, ankleY,
    legW * 0.3
  );
  ctx.fillStyle = shadedColor(skin, -0.15);
  ctx.fill();
  // Knee highlight
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(170 - hw / 2 - legGap / 2 + legW * 0.25, kneeY, legW * 0.55, legW * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // RIGHT LEG
  ctx.save();
  roundedTrapezoid(ctx,
    170 + legGap,      hipY,
    170 + hw - legGap, hipY,
    170 + hw - legGap - legW * 0.5, ankleY,
    170 + legGap + 2,  ankleY,
    legW * 0.3
  );
  ctx.fillStyle = shadedColor(skin, -0.1);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(170 + hw / 2 + legGap / 2 - legW * 0.25, kneeY, legW * 0.55, legW * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFeet({ hw, legW, skin }) {
  const footY = 515;
  ctx.fillStyle = shadedColor(skin, -0.2);

  // Left foot
  ctx.beginPath();
  ctx.ellipse(170 - hw / 2 + legW * 0.3, footY, legW * 0.8, legW * 0.38, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Right foot
  ctx.beginPath();
  ctx.ellipse(170 + hw / 2 - legW * 0.3, footY, legW * 0.8, legW * 0.38, 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawTorso({ sw, ww, hw, skin }) {
  ctx.save();
  // Torso as bezier path
  ctx.beginPath();
  ctx.moveTo(170 - sw, 185);                                      // L shoulder
  ctx.quadraticCurveTo(170 - sw - 4, 220, 170 - ww, 330);       // L side curve to waist
  ctx.quadraticCurveTo(170 - hw + 4, 360, 170 - hw + 8, 368);   // L hip flare
  ctx.lineTo(170 + hw - 8, 368);                                   // hip bottom
  ctx.quadraticCurveTo(170 + hw - 4, 360, 170 + ww, 330);       // R hip to waist
  ctx.quadraticCurveTo(170 + sw + 4, 220, 170 + sw, 185);       // R side
  ctx.closePath();
  ctx.fillStyle = skin;
  ctx.fill();

  // Chest shading
  const chestGrad = ctx.createLinearGradient(170 - sw, 185, 170 + sw, 300);
  chestGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
  chestGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  chestGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = chestGrad;
  ctx.fill();
  ctx.restore();
}

function drawArms({ sw, ww, armW, skin }) {
  const shoulderY = 195;
  const elbowY = 320;
  const handY = 400;

  // LEFT ARM - outer arm
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(170 - sw + armW * 0.5, shoulderY);          // shoulder attach top
  ctx.quadraticCurveTo(170 - sw - armW * 1.4, 260, 170 - sw - armW * 0.8, elbowY);    // upper arm
  ctx.quadraticCurveTo(170 - sw - armW * 0.5, 370, 170 - sw + armW * 0.5, handY);    // forearm
  ctx.quadraticCurveTo(170 - sw + armW * 1.5, handY + 5, 170 - sw + armW * 2, handY - 5); // hand
  ctx.quadraticCurveTo(170 - sw + armW * 1.5, elbowY, 170 - sw + armW * 0.5, elbowY - 5); // inner elbow
  ctx.quadraticCurveTo(170 - sw + armW, 260, 170 - sw, shoulderY + 5);                // inner upper arm
  ctx.closePath();
  ctx.fillStyle = shadedColor(skin, -0.08);
  ctx.fill();
  // Arm highlight
  ctx.beginPath();
  ctx.ellipse(170 - sw - armW * 0.3, elbowY, armW * 0.5, armW * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadedColor(skin, 0.05);
  ctx.fill();
  ctx.restore();

  // RIGHT ARM
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(170 + sw - armW * 0.5, shoulderY);
  ctx.quadraticCurveTo(170 + sw + armW * 1.4, 260, 170 + sw + armW * 0.8, elbowY);
  ctx.quadraticCurveTo(170 + sw + armW * 0.5, 370, 170 + sw - armW * 0.5, handY);
  ctx.quadraticCurveTo(170 + sw - armW * 1.5, handY + 5, 170 + sw - armW * 2, handY - 5);
  ctx.quadraticCurveTo(170 + sw - armW * 1.5, elbowY, 170 + sw - armW * 0.5, elbowY - 5);
  ctx.quadraticCurveTo(170 + sw - armW, 260, 170 + sw, shoulderY + 5);
  ctx.closePath();
  ctx.fillStyle = shadedColor(skin, -0.05);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(170 + sw + armW * 0.3, elbowY, armW * 0.5, armW * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadedColor(skin, 0.05);
  ctx.fill();
  ctx.restore();
}

function drawNeck({ skin }) {
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.roundRect(162, 155, 16, 32, 4);
  ctx.fill();
}

function drawHead({ skin, face, gender, build }) {
  const cx = 170, cy = 125;
  const isFemale = gender === 'female';
  const rx = 36 + build * 3;
  const ry = 40 + build * 2 + (isFemale ? -2 : 2);

  ctx.save();
  // Head shape
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();

  // Jaw/chin shape
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.7, cy + ry * 0.4);
  ctx.quadraticCurveTo(cx - rx * 0.8, cy + ry + 8, cx, cy + ry + (isFemale ? 10 : 14));
  ctx.quadraticCurveTo(cx + rx * 0.8, cy + ry + 8, cx + rx * 0.7, cy + ry * 0.4);
  ctx.fillStyle = skin;
  ctx.fill();

  // Ear left
  ctx.beginPath();
  ctx.ellipse(cx - rx + 3, cy + 5, 7, 10, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = shadedColor(skin, -0.05);
  ctx.fill();
  // Ear right
  ctx.beginPath();
  ctx.ellipse(cx + rx - 3, cy + 5, 7, 10, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = shadedColor(skin, -0.05);
  ctx.fill();

  // Head shading
  const headShade = ctx.createRadialGradient(cx - 10, cy - 15, 5, cx, cy, rx + 5);
  headShade.addColorStop(0, 'rgba(255,255,255,0.12)');
  headShade.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = headShade;
  ctx.fill();

  ctx.restore();
}

function drawFace({ eye, skin, face, gender }) {
  const cx = 170, cy = 125;
  const isFemale = gender === 'female';

  // Eyebrows
  ctx.save();
  ctx.strokeStyle = shadedColor(skin, -0.45);
  ctx.lineWidth = isFemale ? 1.5 : 2.2;
  ctx.lineCap = 'round';
  // Left eyebrow
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy - 16);
  ctx.quadraticCurveTo(cx - 12, cy - (isFemale ? 22 : 20), cx - 4, cy - 17);
  ctx.stroke();
  // Right eyebrow
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy - 17);
  ctx.quadraticCurveTo(cx + 12, cy - (isFemale ? 22 : 20), cx + 20, cy - 16);
  ctx.stroke();

  // Eyes - whites
  ctx.fillStyle = '#f8f8f8';
  ctx.beginPath();
  ctx.ellipse(cx - 12, cy - 5, 8, isFemale ? 5 : 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 12, cy - 5, 8, isFemale ? 5 : 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes - iris
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.ellipse(cx - 12, cy - 5, 5, isFemale ? 5 : 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 12, cy - 5, 5, isFemale ? 5 : 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes - pupils
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.ellipse(cx - 11, cy - 5, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 13, cy - 5, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.ellipse(cx - 10, cy - 7, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 15, cy - 7, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();

  // Eyelashes (female)
  if (isFemale) {
    ctx.strokeStyle = '#1a0a00';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 12 + i * 2, cy - 9.5);
      ctx.lineTo(cx - 12 + i * 2 - 0.5, cy - 13);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 12 + i * 2, cy - 9.5);
      ctx.lineTo(cx + 12 + i * 2 + 0.5, cy - 13);
      ctx.stroke();
    }
  }

  // Nose
  ctx.strokeStyle = shadedColor(skin, -0.3);
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy + 2);
  ctx.quadraticCurveTo(cx - 5, cy + 10, cx - 4, cy + 13);
  ctx.quadraticCurveTo(cx, cy + 15, cx + 4, cy + 13);
  ctx.quadraticCurveTo(cx + 5, cy + 10, cx + 3, cy + 2);
  ctx.stroke();

  // Mouth
  ctx.strokeStyle = shadedColor(skin, -0.4);
  ctx.lineWidth = isFemale ? 1.5 : 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 22);
  ctx.quadraticCurveTo(cx, cy + (isFemale ? 28 : 26), cx + 10, cy + 22);
  ctx.stroke();

  // Upper lip line (female)
  if (isFemale) {
    ctx.strokeStyle = shadedColor(skin, -0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy + 21);
    ctx.quadraticCurveTo(cx - 5, cy + 19, cx, cy + 20);
    ctx.quadraticCurveTo(cx + 5, cy + 19, cx + 9, cy + 21);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHair({ hair, hairStyle, skin, gender }) {
  const cx = 170, cy = 125;
  ctx.save();
  ctx.fillStyle = hair;
  ctx.strokeStyle = shadedColor(hair, -0.2);
  ctx.lineWidth = 0.5;

  switch (hairStyle) {
    case 0: // Short/buzz
      ctx.beginPath();
      ctx.ellipse(cx, cy - 12, 37, 28, 0, Math.PI, 0);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.rect(cx - 37, cy - 12, 74, 10);
      ctx.fill();
      break;

    case 1: // Medium
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 37, 30, 0, Math.PI, 0);
      ctx.fill();
      // Side strands
      ctx.beginPath();
      ctx.moveTo(cx - 37, cy - 12);
      ctx.quadraticCurveTo(cx - 42, cy + 20, cx - 35, cy + 45);
      ctx.lineTo(cx - 25, cy + 45);
      ctx.quadraticCurveTo(cx - 30, cy + 20, cx - 28, cy - 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 37, cy - 12);
      ctx.quadraticCurveTo(cx + 42, cy + 20, cx + 35, cy + 45);
      ctx.lineTo(cx + 25, cy + 45);
      ctx.quadraticCurveTo(cx + 30, cy + 20, cx + 28, cy - 5);
      ctx.fill();
      break;

    case 2: // Long
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 37, 30, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 37, cy - 12);
      ctx.quadraticCurveTo(cx - 48, cy + 80, cx - 38, cy + 180);
      ctx.lineTo(cx - 20, cy + 180);
      ctx.quadraticCurveTo(cx - 28, cy + 80, cx - 24, cy - 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 37, cy - 12);
      ctx.quadraticCurveTo(cx + 48, cy + 80, cx + 38, cy + 180);
      ctx.lineTo(cx + 20, cy + 180);
      ctx.quadraticCurveTo(cx + 28, cy + 80, cx + 24, cy - 5);
      ctx.fill();
      break;

    case 3: // Ponytail
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 37, 30, 0, Math.PI, 0);
      ctx.fill();
      // Ponytail
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 40);
      ctx.quadraticCurveTo(cx + 50, cy - 10, cx + 45, cy + 60);
      ctx.quadraticCurveTo(cx + 40, cy + 100, cx + 30, cy + 140);
      ctx.lineTo(cx + 18, cy + 138);
      ctx.quadraticCurveTo(cx + 26, cy + 95, cx + 30, cy + 58);
      ctx.quadraticCurveTo(cx + 33, cy + 0, cx - 2, cy - 38);
      ctx.fill();
      // Tie
      ctx.fillStyle = shadedColor(hair, -0.3);
      ctx.beginPath();
      ctx.ellipse(cx + 28, cy + 15, 7, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 4: // Wild/spiky
      ctx.beginPath();
      ctx.ellipse(cx, cy - 10, 37, 30, 0, Math.PI, 0);
      ctx.fill();
      // Spikes
      const spikes = [[-30, -42], [-15, -52], [0, -56], [15, -52], [30, -42], [-42, -28], [42, -28]];
      spikes.forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + ox - 8, cy + oy + 15);
        ctx.lineTo(cx + ox, cy + oy);
        ctx.lineTo(cx + ox + 8, cy + oy + 15);
        ctx.fill();
      });
      break;

    case 5: // Bald - just a slight shine
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 25, 12, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
  }

  ctx.restore();
}

function drawEquipment() {
  const { mainHand, offHand } = state.equipment;
  const weapon = state._data.weapons?.find(w => w.id === mainHand);
  if (!weapon) return;

  ctx.save();
  ctx.translate(240, 350);
  ctx.rotate(0.3);

  const color = weaponColor(weapon.category);
  const lightColor = lighten(color, 0.3);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  switch (weapon.category) {
    case 'sword':
      drawSwordShape(ctx, lightColor, color);
      break;
    case 'axe':
      drawAxeShape(ctx, lightColor, color);
      break;
    case 'staff':
    case 'polearm':
      drawStaffShape(ctx, lightColor, color);
      break;
    case 'dagger':
      drawDaggerShape(ctx, lightColor, color);
      break;
    case 'mace':
      drawMaceShape(ctx, lightColor, color);
      break;
    case 'bow':
      drawBowShape(ctx, lightColor, color);
      break;
    case 'shield':
      ctx.restore();
      drawShieldOffHand(color);
      return;
    default:
      drawSwordShape(ctx, lightColor, color);
  }

  ctx.restore();
}

function drawSwordShape(ctx, light, dark) {
  // Blade
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.lineTo(4, 10);
  ctx.lineTo(-4, 10);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Center fuller
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -75);
  ctx.lineTo(0, 5);
  ctx.stroke();
  // Crossguard
  ctx.fillStyle = dark;
  ctx.fillRect(-14, 8, 28, 6);
  // Grip
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(-4, 14, 8, 30);
  // Pommel
  ctx.beginPath();
  ctx.arc(0, 48, 7, 0, Math.PI * 2);
  ctx.fillStyle = dark;
  ctx.fill();
}

function drawAxeShape(ctx, light, dark) {
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(-3, 10, 6, 70);
  ctx.beginPath();
  ctx.moveTo(-3, 10);
  ctx.lineTo(-25, -10);
  ctx.quadraticCurveTo(-35, 20, -8, 35);
  ctx.lineTo(-3, 35);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawStaffShape(ctx, light, dark) {
  ctx.fillStyle = '#6b3a1f';
  ctx.beginPath();
  ctx.roundRect(-4, -90, 8, 170, 3);
  ctx.fill();
  // Orb at top
  ctx.beginPath();
  ctx.arc(0, -90, 12, 0, Math.PI * 2);
  ctx.fillStyle = light;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Glow
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(0, -90, 16, 0, Math.PI * 2);
  ctx.fillStyle = light;
  ctx.fill();
  ctx.restore();
}

function drawDaggerShape(ctx, light, dark) {
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(3, 5);
  ctx.lineTo(-3, 5);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = dark;
  ctx.fillRect(-10, 3, 20, 4);
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(-3, 7, 6, 22);
}

function drawMaceShape(ctx, light, dark) {
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(-3, 10, 6, 60);
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fillStyle = light;
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(0, 0);
    ctx.rotate(a);
    ctx.fillStyle = dark;
    ctx.fillRect(-2, 10, 4, 8);
    ctx.restore();
  }
}

function drawBowShape(ctx, light, dark) {
  ctx.strokeStyle = '#6b3a1f';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.quadraticCurveTo(-35, 0, 0, 80);
  ctx.stroke();
  ctx.strokeStyle = '#d4c4a0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -75);
  ctx.lineTo(0, 75);
  ctx.stroke();
}

function drawShieldOffHand(color) {
  ctx.save();
  ctx.translate(105, 330);
  ctx.rotate(-0.2);
  ctx.beginPath();
  ctx.moveTo(-25, -35);
  ctx.lineTo(25, -35);
  ctx.lineTo(28, 10);
  ctx.quadraticCurveTo(0, 50, -28, 10);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = lighten(color, 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -5, 8, 0, Math.PI * 2);
  ctx.fillStyle = lighten(color, 0.2);
  ctx.fill();
  ctx.restore();
}

function drawClassGlow(accentColor) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  const glow = ctx.createRadialGradient(170, 350, 20, 170, 300, 180);
  glow.addColorStop(0, accentColor);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 340, 540);
  ctx.restore();
}

function drawNameplate() {
  const name = state.identity.name || 'Sem nome';
  const cls = state._data.classes.find(c => c.id === state.class.classId);
  const sub = cls?.subclasses?.find(s => s.id === state.class.subclassId);

  ctx.save();
  // Plate background
  ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
  ctx.beginPath();
  ctx.roundRect(20, 490, 300, 42, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(201, 168, 76, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Name
  ctx.fillStyle = '#e8d8a0';
  ctx.font = 'bold 15px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase() || '— SEM NOME —', 170, 508);

  // Class
  if (cls) {
    const subtitle = sub ? `${cls.name} · ${sub.name}` : cls.name;
    ctx.fillStyle = cls.visualHints.accentColor;
    ctx.font = '11px "Cinzel", serif';
    ctx.fillText(subtitle, 170, 524);
  }

  ctx.restore();
}

// ---- Helpers ----
function shadedColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const nr = clamp(r + amount * 255);
  const ng = clamp(g + amount * 255);
  const nb = clamp(b + amount * 255);
  return `rgb(${nr},${ng},${nb})`;
}

function lighten(hex, amount) { return shadedColor(hex, amount); }

function weaponColor(category) {
  const colors = {
    sword: '#a8b5c4', axe: '#8a9aaa', dagger: '#c0c8d0',
    mace: '#9aabb8', staff: '#a06030', polearm: '#9aabb8',
    bow: '#8b6914', shield: '#6a8ab0'
  };
  return colors[category] || '#a0a0a0';
}

function roundedTrapezoid(ctx, x1, y1, x2, y2, x3, y3, x4, y4, r) {
  ctx.beginPath();
  ctx.moveTo(x1 + r, y1);
  ctx.lineTo(x2 - r, y2);
  ctx.quadraticCurveTo(x2, y2, x2, y2 + r);
  ctx.lineTo(x3, y3 - r);
  ctx.quadraticCurveTo(x3, y3, x3 + r, y3);
  ctx.lineTo(x4 - r, y4);
  ctx.quadraticCurveTo(x4, y4, x4, y4 - r);
  ctx.lineTo(x1, y1 + r);
  ctx.quadraticCurveTo(x1, y1, x1 + r, y1);
  ctx.closePath();
}

// ---- UI Controls ----
export function initAppearanceControls() {
  // Height slider
  bindSlider('slider-height', 'appearance.height');
  bindSlider('slider-build', 'appearance.build');
  bindSlider('slider-hair-style', 'appearance.hairStyle', true);
  bindSlider('slider-face', 'appearance.facePreset', true);

  // Skin tone swatches
  renderSwatches('skin-swatches', SKIN_TONES, 'appearance.skinTone', state.appearance.skinTone);
  renderSwatches('hair-swatches', HAIR_COLORS, 'appearance.hairColor', state.appearance.hairColor);
  renderSwatches('eye-swatches', EYE_COLORS, 'appearance.eyeColor', state.appearance.eyeColor);

  // Hair style labels
  const hairLabel = document.getElementById('hair-style-label');
  if (hairLabel) {
    hairLabel.textContent = HAIR_STYLES[state.appearance.hairStyle];
    document.getElementById('slider-hair-style')?.addEventListener('input', e => {
      hairLabel.textContent = HAIR_STYLES[parseInt(e.target.value)];
    });
  }
}

function bindSlider(id, path, isInt = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', e => {
    const v = isInt ? parseInt(e.target.value) : parseFloat(e.target.value);
    updateChar(path, v);
  });
}

function renderSwatches(containerId, palette, path, selected) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  palette.forEach(color => {
    const swatch = document.createElement('button');
    swatch.className = 'color-swatch' + (color === selected ? ' active' : '');
    swatch.style.background = color;
    swatch.title = color;
    swatch.addEventListener('click', () => {
      container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      updateChar(path, color);
    });
    container.appendChild(swatch);
  });
}

export function getCanvas() { return canvas; }
