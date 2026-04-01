/**
 * relink-ao-abrir.jsx
 *
 * Revincula todos os footages do projeto usando caminhos relativos
 * à pasta onde o AEP está salvo.
 *
 * Estrutura esperada (extraída do ZIP):
 *   thespace-pixelmap-projeto-completo/
 *     after-effects/  ← AEP + este script ficam aqui
 *     pixel-map/
 *     assets/
 *     blender/
 *
 * Uso: File → Scripts → Run Script File...  →  relink-ao-abrir.jsx
 */

(function () {

  if (!app.project.file) {
    alert('Salve o projeto antes de rodar este script.');
    return;
  }

  // Raiz do pacote: pasta pai de "after-effects/"
  var aeFolder   = app.project.file.parent;       // .../after-effects/
  var rootFolder = aeFolder.parent;               // .../thespace-pixelmap-projeto-completo/

  // Mapeamento: nome do arquivo → caminho relativo a partir da raiz
  var map = [
    { name: 'thespace-imersiva-principal-pixelmap.png', rel: 'pixel-map/thespace-imersiva-principal-pixelmap.png' },
    { name: 'ikeda-antivj_particles_v1_h264.mp4',       rel: 'assets/ikeda-antivj_particles_v1_h264.mp4' },
  ];

  var fixed = 0, missing = 0, skipped = 0;

  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (!(item instanceof FootageItem)) continue;
    if (item.mainSource instanceof SolidSource) { skipped++; continue; }

    var fileName = item.name;

    // Procura no mapa pelo nome exato
    var entry = null;
    for (var j = 0; j < map.length; j++) {
      if (map[j].name === fileName) { entry = map[j]; break; }
    }

    if (!entry) { skipped++; continue; }

    var newFile = new File(rootFolder.fsName + '/' + entry.rel);

    if (!newFile.exists) {
      $.writeln('AVISO: não encontrado — ' + newFile.fsName);
      missing++;
      continue;
    }

    try {
      item.replace(newFile);
      fixed++;
    } catch (e) {
      $.writeln('ERRO ao revinvular ' + fileName + ': ' + e.toString());
      missing++;
    }
  }

  alert(
    'Relink concluído.\n\n' +
    '✓ Revinculados: ' + fixed + '\n' +
    '⚠ Não encontrados: ' + missing + '\n' +
    '— Ignorados (sólidos/sem mapa): ' + skipped
  );

})();
