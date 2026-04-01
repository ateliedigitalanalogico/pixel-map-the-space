/**
 * 1. Cria comp "conteudo - substituir aqui" (4596×4344) com o pixel map PNG
 * 2. Substitui o source do layer em cada comp de parede por essa comp
 *    (replaceSource mantém posição/escala/rotação intactas)
 */

app.beginUndoGroup("Criar comp conteudo e substituir paredes");

var project = app.project;

// ── Encontrar o PNG do pixel map no projeto ───────────────
var pixelMapFootage = null;
for (var i = 1; i <= project.numItems; i++) {
    var it = project.item(i);
    if (it instanceof FootageItem && it.name.indexOf('pixelmap') !== -1) {
        pixelMapFootage = it;
        break;
    }
}

if (!pixelMapFootage) {
    // Tentar pelo nome parcial
    for (var i = 1; i <= project.numItems; i++) {
        var it = project.item(i);
        if (it instanceof FootageItem && (
            it.name.indexOf('pixel') !== -1 ||
            it.name.indexOf('Pixel') !== -1 ||
            it.name.indexOf('thespace') !== -1
        )) {
            pixelMapFootage = it;
            break;
        }
    }
}

if (!pixelMapFootage) {
    app.endUndoGroup();
    "ERRO: PNG do pixel map não encontrado no projeto. Importe-o primeiro.";
} else {

    // ── Remover comp conteudo existente se houver ─────────
    for (var i = project.numItems; i >= 1; i--) {
        var it = project.item(i);
        if (it instanceof CompItem && it.name === "conteudo - substituir aqui") {
            it.remove();
            break;
        }
    }

    // ── Criar comp "conteudo - substituir aqui" ───────────
    var W = 4596, H = 4344;
    var conteudo = project.items.addComp("conteudo - substituir aqui", W, H, 1, 180, 30);

    // Adicionar pixel map como layer base
    var baseLayer = conteudo.layers.add(pixelMapFootage);
    baseLayer.property("Position").setValue([W / 2, H / 2]);

    // ── Substituir source em cada comp de parede ──────────
    var wallNames = [
        "P1 \u2014 Frente",
        "P2 \u2014 Direita",
        "P3 \u2014 Fundo",
        "P4 \u2014 Esquerda",
        "PISO"
    ];

    var replaced = [];
    var notFound = [];

    for (var n = 0; n < wallNames.length; n++) {
        var wallComp = null;
        for (var i = 1; i <= project.numItems; i++) {
            var it = project.item(i);
            if (it instanceof CompItem && it.name === wallNames[n]) {
                wallComp = it;
                break;
            }
        }

        if (!wallComp) {
            notFound.push(wallNames[n]);
            continue;
        }

        // Substituir todos os layers que sejam footage (não comps)
        var done = false;
        for (var l = 1; l <= wallComp.numLayers; l++) {
            var ly = wallComp.layer(l);
            if (ly.source instanceof FootageItem) {
                ly.replaceSource(conteudo, false);
                replaced.push(wallNames[n]);
                done = true;
                break;
            }
        }
        if (!done) notFound.push(wallNames[n] + " (sem footage layer)");
    }

    app.endUndoGroup();

    var msg = "Comp criada: 'conteudo - substituir aqui'\n";
    msg += "Substituídas: " + replaced.join(", ") + "\n";
    if (notFound.length > 0) msg += "Não encontradas: " + notFound.join(", ");
    msg;
}
