var newPath = 'E:\\ADA Dropbox\\ADA (1)\\2026\\pixel-map-the-space\\output\\pixel-maps\\principal\\thespace-imersiva-principal-pixelmap.png';
var newFile = new File(newPath);
var results = [];

for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof FootageItem && item.name.indexOf('pixelmap') !== -1) {
        item.replace(newFile);
        results.push('Relinkado: ' + item.name + ' (id ' + item.id + ')');
    }
}

var msg = results.length > 0 ? results.join(' | ') : 'Nenhum footage encontrado';
msg;
