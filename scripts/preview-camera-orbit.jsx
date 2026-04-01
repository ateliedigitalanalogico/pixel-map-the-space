/**
 * Adiciona orbit control na câmera do PREVIEW.
 * Cria null "CAMERA RIG" com slider ANGULO (0-360).
 * Câmera orbita em círculo mantendo POI fixo no centro da sala.
 */

app.beginUndoGroup("Camera orbit PREVIEW");
var project = app.project;

function findComp(name) {
    for (var i = 1; i <= project.numItems; i++) {
        var it = project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}

var prev = findComp("PREVIEW");
if (!prev) { app.endUndoGroup(); "ERRO: comp PREVIEW não encontrada"; }
else {

// Encontrar câmera
var cam = null;
for (var l = 1; l <= prev.numLayers; l++) {
    if (prev.layer(l) instanceof CameraLayer) { cam = prev.layer(l); break; }
}
if (!cam) { app.endUndoGroup(); "ERRO: câmera não encontrada no PREVIEW"; }
else {

// Centro da sala no espaço da comp
var cx = 960, cy = 540, cz = 0;

// Raio da órbita (mesma distância XZ atual da câmera ao centro)
// Câmera está em Z = halfD*0.75 ≈ 179, X = cx → raio = 179
var RADIUS = 179;
var CAM_Y  = 510; // altura da câmera (ligeiramente acima do centro)

// ── Remover CAMERA RIG existente se houver ────────────────
for (var l = prev.numLayers; l >= 1; l--) {
    if (prev.layer(l).name === "CAMERA RIG") { prev.layer(l).remove(); break; }
}

// ── Criar null CAMERA RIG no centro da sala ───────────────
var rig = prev.layers.addNull();
rig.threeDLayer = true;
rig.name        = "CAMERA RIG";
rig.property("Position").setValue([cx, cy, cz]);
rig.label = 2; // amarelo

// ── Adicionar Slider Control "ANGULO" ao rig ─────────────
var sliderFx = rig.property("Effects").addProperty("ADBE Slider Control");
sliderFx.name = "ANGULO";
sliderFx.property("Slider").setValue(45); // valor inicial: visão diagonal

// ── Expressão na posição da câmera ────────────────────────
// A câmera orbita em XZ mantendo altura constante
// sin/cos do ângulo → posição circular ao redor do centro
var posExpr = [
    'var rig = thisComp.layer("CAMERA RIG");',
    'var a   = rig.effect("ANGULO")("Slider") * Math.PI / 180;',
    'var r   = ' + RADIUS + ';',
    'var cx  = ' + cx + ', cy = ' + CAM_Y + ', cz = ' + cz + ';',
    '[cx + r * Math.sin(a), cy, cz + r * Math.cos(a)];'
].join('\n');

cam.property("Position").expression = posExpr;

// ── POI fixo no centro da sala ────────────────────────────
cam.property("Point of Interest").setValue([cx, cy + 10, cz]);
// Remover qualquer expressão anterior no POI
try { cam.property("Point of Interest").expression = ""; } catch(e) {}

app.endUndoGroup();
'Camera orbit OK. Slider "ANGULO" no layer CAMERA RIG. Valor inicial: 45°';

}}
