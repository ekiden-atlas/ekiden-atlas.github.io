import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),out=new URL('../dist/',import.meta.url);
await mkdir(out,{recursive:true});
for(const file of ['index.html','style.css','favicon.svg','.nojekyll','js','data','assets']){
 await cp(new URL(file,root),new URL(file,out),{recursive:true});
}
const analyticsToken=process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim();
if(analyticsToken){
 if(!/^[a-f0-9]{32}$/i.test(analyticsToken))throw new Error('Expected a Cloudflare Web Analytics site token.');
 const index=new URL('index.html',out);
 const html=await readFile(index,'utf8');
 const beacon=`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${analyticsToken}"}'></script>`;
 await writeFile(index,html.replace('</body>',`${beacon}\n</body>`));
}
console.log('Prepared clean public-only dist/ with no repository docs or admin SQL.');
