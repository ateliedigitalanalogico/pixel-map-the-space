/**
 * Cria comps PREVIEW de cada parede/piso usando CONTEUDO como source.
 * Posiciona CONTEUDO em cada comp para mostrar apenas a seção correta.
 * Atualiza o PREVIEW 3D para usar as novas comps PREVIEW.
 */

app.beginUndoGroup("Criar wall comps PREVIEW");
var project = app.project;

function findComp(name) {
    for (var i = 1; i <= project.numItems; i++) {
        var it = project.item(i);
        if (it instanceof CompItem && it.name === name) return it;
    }
    return null;
}
function findFolder(name) {
    for (var i = 1; i <= project.numItems; i++) {
        var it = project.item(i);
        if (it instanceof FolderItem && it.name === name) return it;
    }
    return null;
}

var conteudo = findComp("CONTEUDO - SUBSTITUIR AQUI");
var preview3d = findComp("PREVIEW");
var folderPreview = findFolder("PREVIEW");

if (!conteudo) { app.endUndoGroup(); "ERRO: CONTEUDO não encontrado"; }
else {

// CONTEUDO anchor padrão (centro do comp 4596×4344)
var CA = [4596/2, 4344/2]; // = [2298, 2172]

// Definição de cada wall preview:
// name, compW, compH, sectionCenterX, sectionCenterY
// posição do layer CONTEUDO = compCenter - (sectionCenter - contentAnchor)
var walls = [
    {
        name: "P1 PREVIEW",
        origName: "P1 \u2014 FRENTE",
        W: 2160, H: 1218,
        // P1: x=1218, y=0, w=2160, h=1218 → center (2298, 609)
        cx: 2298, cy: 609
    },
    {
        name: "P2 PREVIEW",
        origName: "P2 \u2014 DIREITA",
        W: 1218, H: 1908,
        // P2: x=3378, y=1218, w=1218, h=1908 → center (3987, 2172)
        cx: 3987, cy: 2172
    },
    {
        name: "P3 PREVIEW",
        origName: "P3 \u2014 FUNDO",
        W: 2160, H: 1218,
        // P3: x=1218, y=3126, w=2160, h=1218 → center (2298, 3735)
        cx: 2298, cy: 3735
    },
    {
        name: "P4 PREVIEW",
        origName: "P4 \u2014 ESQUERDA",
        W: 1218, H: 1908,
        // P4: x=0, y=1218, w=1218, h=1908 → center (609, 2172)
        cx: 609, cy: 2172
    },
    {
        name: "PISO PREVIEW",
        origName: "PISO",
        W: 2160, H: 1908,
        // PISO: x=1218, y=1218, w=2160, h=1908 → center (2298, 2172)
        cx: 2298, cy: 2172
    }
];

var created = [];

for (var n = 0; n < walls.length; n++) {
    var w = walls[n];

    // Remover se já existir
    var existing = findComp(w.name);
    if (existing) existing.remove();

    // Criar comp preview
    var comp = project.items.addComp(w.name, w.W, w.H, 1, 180, 30);

    // Calcular posição: onde o anchor do CONTEUDO deve ficar para
    // que o centro da seção apareça no centro desta comp
    var compCX = w.W / 2;
    var compCY = w.H / 2;
    var posX = compCX - (w.cx - CA[0]);
    var posY = compCY - (w.cy - CA[1]);

    var ly = comp.layers.add(conteudo);
    ly.property("Position").setValue([posX, posY]);

    // Mover para pasta PREVIEW
    if (folderPreview) comp.parentFolder = folderPreview;

    created.push(w.name + " pos(" + Math.round(posX) + "," + Math.round(posY) + ")");
}

// ── Atualizar PREVIEW 3D para usar comps PREVIEW ──────────
if (preview3d) {
    for (var l = 1; l <= preview3d.numLayers; l++) {
        var ly = preview3d.layer(l);
        if (!(ly.source instanceof CompItem)) continue;

        for (var n = 0; n < walls.length; n++) {
            if (ly.source.name === walls[n].origName ||
                ly.source.name === walls[n].origName.replace("\u2014 ", "")) {
                var newComp = findComp(walls[n].name);
                if (newComp) ly.replaceSource(newComp, false);
                break;
            }
        }
    }
}

app.endUndoGroup();
"Criadas: " + created.join(" | ");

}
