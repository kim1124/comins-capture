import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, isAbsolute, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failure = 'release-artifact-check: failed\n';

function pathName(value) {
  assert.equal(typeof value, 'string');
  const path = value.replace(/^\.\//, '');
  assert.ok(path && !isAbsolute(path) && !/[\\\x00-\x20*?\[\]]/.test(path));
  assert.ok(path.split('/').every(part => part && part !== '..' && part !== '.'));
  return path;
}

export function validateInventory(manifest, files) {
  assert.equal(manifest.name, 'comins-capture');
  assert.match(manifest.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/);
  assert.equal(manifest.private, false);
  assert.equal(manifest.publishConfig.access, 'public');
  assert.ok(Array.isArray(manifest.files) && manifest.files.length);
  const roots = manifest.files.map(pathName);
  const paths = files.map(pathName);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every(path => path === 'package.json' || roots.some(r => path === r || path.startsWith(r + '/'))));
  assert.ok(roots.every(r => paths.some(path => path === r || path.startsWith(r + '/'))));
  for (const path of ['package.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md',
    'dist/engine/vendor/LICENSE', 'dist/engine/vendor/provenance.json']) assert.ok(paths.includes(path));
  assert.deepEqual(Object.keys(manifest.exports), ['.']);
  for (const target of Object.values(manifest.exports['.'])) assert.ok(paths.includes(pathName(target)));
  return paths;
}

export function verifyDigest(file, expected) {
  assert.match(expected, /^[a-f0-9]{64}$/);
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), expected);
}

function command(bin, args, cwd = root) {
  return execFileSync(bin, args, {cwd, encoding:'utf8', stdio:['ignore','pipe','pipe']});
}

function treeFiles(dir, prefix = '') {
  return readdirSync(dir).flatMap(name => {
    const local = prefix ? `${prefix}/${name}` : name;
    return statSync(join(dir, name)).isDirectory() ? treeFiles(join(dir, name), local) : [local];
  });
}

export function checkArtifact(artifact, manifest, expectedFiles) {
  const temp = mkdtempSync(join(tmpdir(), 'comins-capture-artifact-'));
  const consumer = mkdtempSync(join(tmpdir(), 'comins-capture-consumer-'));
  try {
    // npm이 생성했거나 유지관리자가 digest를 고정한 단일 artifact를 표준 tar로 검사한다.
    const names = command('tar', ['-tzf', artifact]).trim().split('\n').filter(n => !n.endsWith('/'));
    assert.ok(names.every(n => n.startsWith('package/')));
    const paths = validateInventory(manifest, names.map(n => n.slice('package/'.length)));
    const allowedFiles = ['package.json', ...manifest.files.flatMap(entry => {
      const path = pathName(entry);
      return statSync(join(root,path)).isDirectory() ? treeFiles(join(root,path)).map(f => `${path}/${f}`) : [path];
    })];
    assert.deepEqual([...new Set(allowedFiles)].sort(), [...paths].sort());
    if (expectedFiles) assert.deepEqual([...paths].sort(), [...expectedFiles].sort());
    command('tar', ['-xzf', artifact, '-C', temp]);
    const extracted = join(temp, 'package');
    assert.deepEqual(treeFiles(extracted).sort(), [...paths].sort());
    for (const path of paths) assert.deepEqual(readFileSync(join(extracted,path)), readFileSync(join(root,path)));
    const scan = spawnSync(process.env.GITLEAKS_BIN || 'gitleaks', ['dir',extracted,
      '--config',join(root,'.gitleaks.toml'),'--ignore-gitleaks-allow','--redact',
      '--no-banner','--no-color','--log-level','error'], {stdio:'ignore'});
    assert.equal(scan.status, 0);
    command(process.execPath, [join(root,'scripts/check-licenses.mjs')]);
    writeFileSync(join(consumer,'package.json'), JSON.stringify({private:true,type:'module'}));
    command('npm', ['install','--ignore-scripts','--no-audit','--no-fund','--package-lock=false',
      '--registry=https://registry.npmjs.org/',artifact], consumer);
    command(process.execPath, ['--input-type=module','-e', `
      import assert from 'node:assert/strict';
      import * as api from 'comins-capture';
      assert.deepEqual(Object.keys(api).sort(),['CaptureError','capture','paperSize']);
      assert.equal(typeof globalThis.document,'undefined');
      assert.deepEqual(api.paperSize('A4'),{width:2480,height:3508});
      await assert.rejects(api.capture(null),e=>e instanceof api.CaptureError && e.code==='INVALID_TARGET');
      assert.throws(()=>import.meta.resolve('comins-capture/dist/index.js'),{code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
    `], consumer);
    writeFileSync(join(consumer,'output-options.ts'),readFileSync(join(root,'test/types/output-options.ts')));
    command(process.execPath, [join(root,'node_modules/typescript/bin/tsc'),'--ignoreConfig',
      '--noEmit','--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext',
      'output-options.ts'], consumer);
  } finally {
    rmSync(temp, {recursive:true,force:true});
    rmSync(consumer, {recursive:true,force:true});
  }
}

export function run(args = process.argv.slice(2)) {
  try {
    if (args[0] === '--digest' && args.length === 3) {
      verifyDigest(resolve(args[1]), args[2]);
      return 0;
    }
    const manifest = JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
    if (args[0] === '--existing' && args.length === 3) {
      const artifact = resolve(args[1]);
      verifyDigest(artifact, args[2]);
      checkArtifact(artifact, manifest);
      return 0;
    }
    assert.equal(args.length, 0);
    const packed = JSON.parse(command('npm', ['pack','--json','--ignore-scripts']));
    assert.ok(Array.isArray(packed) && packed.length === 1);
    const {filename,files} = packed[0];
    assert.equal(filename, `${manifest.name}-${manifest.version}.tgz`);
    assert.equal(basename(filename), filename);
    const paths = validateInventory(manifest, files.map(file => file.path));
    checkArtifact(join(root,filename), manifest, paths);
    process.stdout.write(filename + '\n');
    return 0;
  } catch {
    process.stderr.write(failure);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = run();
