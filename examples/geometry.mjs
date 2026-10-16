import {paperSize} from '../dist/index.js';
console.log('ISO A4 300 PPI:',paperSize('A4'));
console.log('JIS B4 landscape 300 PPI:',paperSize('B4',{standard:'JIS',orientation:'landscape'}));
