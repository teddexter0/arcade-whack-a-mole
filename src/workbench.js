import {expression} from './expression.js';
// Owner editors are excluded from public release packages.
export function workbench(root,options){
  if(typeof globalThis.__DEX_OWNER_WORKBENCH__==='function')return globalThis.__DEX_OWNER_WORKBENCH__(root,options);
  return {run(key,context){return expression(options.rules[key].initial,context);},open(){}};
}