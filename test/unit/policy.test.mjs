import test from 'node:test';
import assert from 'node:assert/strict';
import {requestPolicy} from '../../dist/resources/policy.js';
test('default deny does not grant a network request',()=>assert.throws(()=>requestPolicy('https://example.test/image','https://example.test/','deny'),{message:'RESOURCE_POLICY_DENIED'}));
test('origin and credentials are explicit; redirects cannot bypass policy',()=>{
 assert.deepEqual(requestPolicy('/image','https://example.test/','same-origin'),{url:'https://example.test/image',credentials:'omit',redirect:'error'});
 assert.throws(()=>requestPolicy('https://other.test/a','https://example.test/','same-origin'));
 assert.equal(requestPolicy('https://other.test/a','https://example.test/',{origins:['https://other.test']}).credentials,'omit');
 assert.throws(()=>requestPolicy('https://other.test.evil/a','https://example.test/',{origins:['https://other.test']}));
});
test('non-HTTP and embedded credentials never use the fetch path',()=>{
 for(const url of ['file:///a','data:image/png,abc','https://user:pass@example.test/a'])assert.throws(()=>requestPolicy(url,'https://example.test/','same-origin'));
});
