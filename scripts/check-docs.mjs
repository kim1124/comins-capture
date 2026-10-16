import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {resolve, dirname, relative, extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {referenceDocs, root, topics} from './reference-docs.mjs';

const read = path => readFile(resolve(root, path), 'utf8');
const pairs = await referenceDocs();
const directories = ['docs/guide','docs/user','docs/ko','docs/development','docs/assets'];
const paths = ['README.md','CONTRIBUTING.md','docs/README.md','docs/HANDOFF.md','docs/release-readiness.md'];
for (const directory of directories) {
  for (const name of await readdir(resolve(root,directory))) if (name.endsWith('.md')) paths.push(`${directory}/${name}`);
}
const stripCode = text => text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
function anchors(text) {
  const found = new Set(), counts = new Map();
  for (const match of stripCode(text).matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const slug = match[1].toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\- ]/gu,'').replace(/ /g,'-');
    const count = counts.get(slug) ?? 0;
    found.add(count ? `${slug}-${count}` : slug); counts.set(slug,count+1);
  }
  return found;
}
const isPackaged = path => path === 'README.md' || path === 'docs/README.md' || /^docs\/(guide|user|ko|assets)\//.test(path);
let links = 0, fragments = 0, syntaxExamples = 0, typedExamples = 0;
const ts = await import('typescript');
for (const path of paths) {
  const text = await read(path);
  assert.doesNotMatch(stripCode(text), /\b(?:TODO|TBD|FIXME)\b|작성\s*예정|미작성/, path);
  for (const match of stripCode(text).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:)/.test(target)) {
      // 저장소 내 원격 링크도 로컬 대상 존재 여부를 검사한다. 원격 반영 성공은 주장하지 않는다.
      const prefix = 'https://github.com/kim1124/comins-capture/blob/codex-governance-v111/';
      if (target.startsWith(prefix)) await read(target.slice(prefix.length).split('#')[0]);
      continue;
    }
    const [file, fragment] = target.split('#');
    const destination = file ? resolve(root,dirname(path),file) : resolve(root,path);
    const local = relative(root,destination).replaceAll('\\','/');
    const body = await readFile(destination);
    links++;
    if (isPackaged(path)) assert.ok(isPackaged(local) || ['LICENSE','THIRD_PARTY_NOTICES.md'].includes(local), `${path}: link excluded from package`);
    if (fragment && extname(destination)==='.md') {
      assert.ok(anchors(body.toString()).has(decodeURIComponent(fragment)), `${path}: missing anchor`); fragments++;
    }
  }
  for (const match of text.matchAll(/^```(js|javascript|ts|typescript)\s*\n([\s\S]*?)^```/gm)) {
    if (match[1]==='js' || match[1]==='javascript') {
      execFileSync(process.execPath,['--input-type=module','--check'],{input:match[2],stdio:['pipe','pipe','pipe']}); syntaxExamples++;
    } else {
      const result = ts.default.transpileModule(match[2],{reportDiagnostics:true,compilerOptions:{target:ts.default.ScriptTarget.ES2022,module:ts.default.ModuleKind.ESNext}});
      // 공개 API의 signature 발췌는 선언문으로 재검사한다.
      if (result.diagnostics?.some(d=>d.category===ts.default.DiagnosticCategory.Error)) {
        assert.match(match[2].trim(), /^(capture|paperSize)\(/, `${path}: invalid TypeScript`);
        const file = ts.default.createSourceFile('signature.ts',`declare function ${match[2].trim()};`,ts.default.ScriptTarget.ES2022,true);
        assert.equal(file.parseDiagnostics.length,0, `${path}: invalid signature`);
      }
      typedExamples++;
    }
  }
}

const api = await import('../dist/index.js');
assert.deepEqual(Object.keys(api).sort(), ['CaptureError','capture','paperSize']);
const declared = await read('src/index.ts');
for (const path of ['docs/guide/api.md','docs/user/09-public-api.md']) {
  const text = await read(path);
  for (const statement of declared.matchAll(/export type \{([^}]+)\}/g)) {
    for (const name of statement[1].split(',').map(s=>s.trim())) assert.ok(text.includes(name), `${path}: missing public type`);
  }
}
const errorSource = await read('src/errors.ts');
const codes = [...errorSource.split('/**')[0].matchAll(/'([A-Z_]+)'/g)].map(m=>m[1]);
for (const path of ['docs/guide/troubleshooting.md','docs/user/06-lifecycle-errors.md']) {
  const text=await read(path); for(const code of codes) assert.ok(text.includes(code), `${path}: missing error code`);
}
const refs={ISO:{A3:[297,420],A4:[210,297],A5:[148,210],B3:[353,500],B4:[250,353],B5:[176,250]},JIS:{A3:[297,420],A4:[210,297],A5:[148,210],B3:[364,515],B4:[257,364],B5:[182,257]}};
for (const path of ['docs/guide/output-options.md','docs/user/04-output-options.md']) {
  const text=await read(path);
  for (const name of Object.keys(refs.ISO)) {
    const row=text.split('\n').find(line=>line.startsWith(`| ${name} |`)); assert.ok(row);
    assert.equal(row.split('|')[2].trim(),refs.ISO[name].join('×'));
    assert.equal(row.split('|')[3].trim(),refs.JIS[name].join('×'));
  }
}
for (const path of ['README.md','docs/guide/getting-started.md','docs/guide/support.md','docs/guide/api.md','docs/development/releasing.md']) {
  assert.doesNotMatch(await read(path), /JIS[^\n]*(?:원문 확인 대기|원문 확인이 남|공식 원문 대조·최종)|원문 대조는 출시 확인 항목/,path);
}
const expected = ['Features','Installation','Quick Start','Choose a framework','Guides and API','Run the Playground locally','0.0.1 scope','Browser support and limits','License and support'];
const headings=[...(await read('README.md')).matchAll(/^## (.+)$/gm)].map(m=>m[1]);
assert.deepEqual(headings.filter(h=>expected.includes(h)),expected);
for(const [name] of topics) assert.ok((await read('docs/README.md')).includes(`user/${name}.md`) && (await read('docs/README.md')).includes(`ko/${name}.md`));
console.log(JSON.stringify({pass:true,documents:paths.length,languagePairs:pairs,localLinks:links,anchors:fragments,jsSyntaxExamples:syntaxExamples,tsSyntaxExamples:typedExamples,publicTypes:true,errorCodes:codes.length,paperTables:true,packageLinks:true}));
