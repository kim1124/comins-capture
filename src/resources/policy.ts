import type { NetworkPolicy } from '../types.js';
/** Network admission used by the resource resolver; redirects remain disallowed. */
export function requestPolicy(input: string, base: string, policy: NetworkPolicy = 'deny') {
  let url: URL, origin: string;
  try { url=new URL(input,base); origin=new URL(base).origin; } catch { throw new Error('RESOURCE_POLICY_DENIED'); }
  const allowed=policy==='same-origin'?url.origin===origin:typeof policy==='object'&&policy.origins.includes(url.origin);
  if(!allowed||!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('RESOURCE_POLICY_DENIED');
  return {url:url.href,credentials:'omit' as const,redirect:'error' as const};
}
