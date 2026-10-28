#!/usr/bin/env node
// vault-health-scan.mjs - read-only vault health scan.
// Checks: 1 root drift, 7 only-title/empty, 8 illegal filename, 9 orphan (incoming=0).
// Link-graph incoming logic compatible with obsidian-query/assets/graph-explore.mjs.
// Usage: node vault-health-scan.mjs <vault_path>
import fs from "node:fs";
import path from "node:path";
const vault = process.argv[2];
if(!vault){ console.error("Usage: node vault-health-scan.mjs <vault_path>"); process.exit(2); }
if(!fs.existsSync(vault)){ console.error("vault_path not found: " + vault); process.exit(2); }

function walk(dir,out){ out=out||[]; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory()){ if(!e.name.startsWith(".")) walk(p,out);} else if(e.name.endsWith(".md")) out.push(p);} return out; }
const files=walk(vault);
const rel=p=>path.relative(vault,p).replace(/\\/g,"/");
const baseName=p=>path.basename(p,".md");
const WIKI=/\[\[([^\]|#]+)(?:[|#][^\]]+)?\]\]/g;

const nameToPath={}; for(const p of files) nameToPath[baseName(p).toLowerCase()]=p;
const incoming={}; for(const p of files) incoming[p]=0;
for(const p of files){ const c=fs.readFileSync(p,"utf8"); let m; WIKI.lastIndex=0; while((m=WIKI.exec(c))){ const t=m[1].trim().replace(/^\/+/,""); const b=t.split("/").pop().replace(/\.(md|png|jpg|jpeg|pdf)$/i,"").toLowerCase(); const f=nameToPath[b]; if(f) incoming[f]++; } }

const isIndex=r=>/_index\.md$/i.test(r)||/-index\.md$/i.test(r);
const isRaw=r=>/\.raw\.md$/i.test(r);
const isMaint=r=>r.indexOf("99_系统/维护记录/")!==-1||r.indexOf("/99_系统/维护记录/")!==-1;
const isArch=r=>r.indexOf("99_系统/归档/")!==-1||r.indexOf("/99_系统/归档/")!==-1;
const isRoot=r=>r.indexOf("/")===-1;
const illegal=/[*"\\\/<>:|?#]/;
const fullwidth=/[\uFF0F\uFF1F\uFF02\uFF1C\uFF1E\uFF1A\uFF5C\uFF03]/;
const KNOW=/^(05_概念|06_决策|09_操作手册|10_问题解决|02_项目|08_技能|05_evergreen)/;

function validContent(p){
  let c=fs.readFileSync(p,"utf8");
  c=c.replace(/^---[\s\S]*?---/,"");
  c=c.replace(/<!--[\s\S]*?-->/g,"");
  c=c.replace(/^#+ .*$/gm,"");
  c=c.replace(/\s+/g," ").trim();
  if(!c) return 0;
  return c.split(/\s+/).filter(Boolean).length;
}

const c1=[],c7=[],c8=[],c9=[];
for(const p of files){
  const r=rel(p); const b=baseName(p);
  if(isRoot(r)&&!isIndex(r)) c1.push(p);
  if(illegal.test(b)||fullwidth.test(b)) c8.push(p);
  if(isRaw(r)||isIndex(r)||isMaint(r)||isArch(r)) continue;
  if(!KNOW.test(r)) continue;
  if(validContent(p)<2) c7.push(p);
  if((incoming[p]||0)===0) c9.push(p);
}
function dump(arr){ for(const p of arr){ let extra=(arr===c9)?(" in="+(incoming[p]||0)):""; console.log("  "+rel(p)+"  bytes="+fs.statSync(p).size+extra); } }
console.log("===== VAULT HEALTH SCAN =====");
console.log("vault: " + vault);
console.log("Check1 Root Drift: " + c1.length); dump(c1);
console.log("Check7 Only-Title/Empty: " + c7.length); dump(c7);
console.log("Check8 Illegal Filename: " + c8.length); dump(c8);
console.log("Check9 Orphan (incoming=0): " + c9.length); dump(c9);
console.log("===== END (read-only, exit 0) =====");
process.exit(0);
