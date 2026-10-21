const fs=require("fs");
let s=fs.readFileSync("scripts/gerar-paginas.mjs","utf8");
const a=`  // remove bloco antigo (se houver), <title> e meta description soltos
  h = h.replace(/<!-- seo:inicio -->[\s\S]*?<!-- seo:fim -->\n?/, "");
  const t = h.match(/<title>([\s\S]*?)<\/title>\n?/);
  const tituloPt = t ? t[1] : null;`;
const b=`  // o título em português vem do <title> atual (solto ou dentro do bloco de SEO)
  const t = h.match(/<title>([\s\S]*?)<\/title>/);
  const tituloPt = t ? t[1] : null;
  // remove bloco antigo (se houver), <title> e meta description soltos
  h = h.replace(/<!-- seo:inicio -->[\s\S]*?<!-- seo:fim -->\n?/, "");`;
if(!s.includes(a))throw new Error("trecho");
s=s.replace(a,b);fs.writeFileSync("scripts/gerar-paginas.mjs",s);console.log("ok");
