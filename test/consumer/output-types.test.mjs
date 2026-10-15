import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('public output declarations distinguish SVG, raster, and encoder options',()=>{
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--ignoreConfig','--noEmit','--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','test/types/output-options.ts'],{stdio:'pipe'});
});
