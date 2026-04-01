/**
 * Cria ou atualiza GitHub Release com o ZIP completo do projeto.
 * Uso: node scripts/criar-release.js
 *
 * Sempre que alterar arquivos do ZIP, rodar este script para atualizar a release.
 */

const fs       = require('fs');
const path     = require('path');
const https    = require('https');
const archiver = require('archiver');
const { execSync } = require('child_process');

const ROOT  = path.join(__dirname, '..');
const OWNER = 'ateliedigitalanalogico';
const REPO  = 'pixel-map-the-space';
const TAG   = 'v1.1';
const ASSET_NAME = 'thespace-pixelmap-projeto-completo.zip'; // nome fixo → link direto sempre funciona
const ZIP_PATH   = path.join(ROOT, 'output', ASSET_NAME);

// ── Pasta do Collect Files ─────────────────────────────────────
// After Effects → File → Dependencies → Collect Files
// Gera uma pasta auto-contida com caminhos relativos já resolvidos.
const AE_COLLECTED = path.join(ROOT, 'output/after-effects/PIXEL_MAP_THE_SPACE folder');
const BLENDER_FILE = path.join(ROOT, 'output/blender/the_space_preview.blend');

// ── Pegar token do git credential ─────────────────────────────
function getToken() {
  const out = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
  return out.match(/password=(.+)/)?.[1]?.trim();
}

// ── Requisição HTTPS ───────────────────────────────────────────
function api(method, endpoint, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const data  = body ? JSON.stringify(body) : null;
    const req   = https.request({
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}${endpoint}`,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ada-release-script',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...extraHeaders,
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Upload binário para release ────────────────────────────────
function uploadAsset(uploadUrl, filePath, assetName) {
  return new Promise((resolve, reject) => {
    const token    = getToken();
    const fileData = fs.readFileSync(filePath);
    const url      = new URL(uploadUrl.replace('{?name,label}', '') + `?name=${encodeURIComponent(assetName)}`);

    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent':    'ada-release-script',
        'Accept':        'application/vnd.github+json',
        'Content-Type':  'application/zip',
        'Content-Length': fileData.length,
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);

    // Stream com progresso
    const total = fileData.length;
    let sent = 0;
    const chunk = 256 * 1024;
    function write(offset) {
      if (offset >= total) { req.end(); return; }
      const slice = fileData.slice(offset, offset + chunk);
      req.write(slice);
      sent += slice.length;
      process.stdout.write(`\rUpload: ${(sent/1024/1024).toFixed(1)}/${(total/1024/1024).toFixed(1)} MB`);
      setImmediate(() => write(offset + chunk));
    }
    write(0);
  });
}

// ── Main ───────────────────────────────────────────────────────
async function main() {

  // 1. Gerar ZIP
  console.log('Gerando ZIP completo...');
  await new Promise((resolve, reject) => {
    const out     = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 6 } });
    out.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(out);

    const ROOT_FOLDER = `thespace-pixelmap-${TAG}`;

    // Pasta coletada pelo AE (caminhos já relativos, auto-contida)
    archive.directory(AE_COLLECTED, `${ROOT_FOLDER}/after-effects`);

    // Cena Blender
    if (fs.existsSync(BLENDER_FILE)) {
      archive.file(BLENDER_FILE, { name: `${ROOT_FOLDER}/blender/the_space_preview.blend` });
    } else {
      console.warn('  não encontrado: blender/the_space_preview.blend');
    }

    archive.finalize();
  });
  const sizeMB = (fs.statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1);
  console.log(`ZIP gerado: ${sizeMB} MB`);

  // 2. Verificar se release já existe
  console.log(`\nVerificando release ${TAG}...`);
  const check = await api('GET', `/releases/tags/${TAG}`);

  let releaseId, uploadUrl;

  if (check.status === 200) {
    // Release existe — deletar asset antigo se houver
    releaseId = check.body.id;
    uploadUrl = check.body.upload_url;
    console.log(`Release existe (id ${releaseId}), atualizando asset...`);

    const assets = await api('GET', `/releases/${releaseId}/assets`);
    for (const asset of assets.body) {
      if (asset.name === ASSET_NAME) {
        await api('DELETE', `/releases/assets/${asset.id}`);
        console.log('Asset antigo removido.');
      }
    }
  } else {
    // Criar release
    console.log('Criando nova release...');
    const created = await api('POST', '/releases', {
      tag_name: TAG,
      name: `${TAG} — Projeto Completo`,
      body: `### Conteúdo\n- Pixel Map PNG (4596×4344px)\n- Projeto After Effects\n- Cena Blender\n- Vídeo de mídia de referência`,
      draft: false,
      prerelease: false,
    });
    releaseId = created.body.id;
    uploadUrl = created.body.upload_url;
    console.log(`Release criada (id ${releaseId})`);
  }

  // 3. Upload do ZIP
  console.log(`\nUpload de ${ASSET_NAME}...`);
  const up = await uploadAsset(uploadUrl, ZIP_PATH, ASSET_NAME);
  console.log(`\nUpload concluído (status ${up.status})`);
  console.log(`\nDownload URL:\nhttps://github.com/${OWNER}/${REPO}/releases/latest/download/${ASSET_NAME}`);
}

main().catch(err => { console.error('\nErro:', err.message); process.exit(1); });
