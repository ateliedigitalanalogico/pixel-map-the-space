var out = [];
var names = ['P1 \u2014 Frente','P2 \u2014 Direita','P3 \u2014 Fundo','P4 \u2014 Esquerda','PISO'];
for (var n = 0; n < names.length; n++) {
    for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === names[n]) {
            for (var l = 1; l <= it.numLayers; l++) {
                var ly = it.layer(l);
                var pos = ly.property('Position').value;
                var sc  = ly.property('Scale').value;
                out.push(names[n] + ' | L' + l + ': ' + ly.name
                    + ' | src: ' + (ly.source ? ly.source.name : '?')
                    + ' | pos: [' + Math.round(pos[0]) + ',' + Math.round(pos[1]) + ']'
                    + ' | scale: ' + Math.round(sc[0]) + '%');
            }
            break;
        }
    }
}
out.join('\n');
