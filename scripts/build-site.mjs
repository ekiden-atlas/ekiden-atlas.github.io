import {cp,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('../dist/',import.meta.url);
await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','favicon.svg','.nojekyll','js','data']){
 await cp(new URL(file,root),new URL(file,out),{recursive:true});
}
console.log('Prepared clean public-only dist/ with no repository docs or admin SQL.');
