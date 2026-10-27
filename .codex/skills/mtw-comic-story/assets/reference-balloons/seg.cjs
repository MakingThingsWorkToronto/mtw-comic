const sharp=require('C:/Code/MTWWebsite-clean/site/node_modules/sharp');const fs=require('fs');
const SP=process.argv[2];const files=fs.readdirSync(SP).filter(f=>/^[^_].*\.png$/.test(f)&&!f.includes('ov'));
(async()=>{const all={};
for(const f of files){const {data,info}=await sharp(SP+'/'+f).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const W=info.width,H=info.height,N=W*H;const lum=new Uint8Array(N),cls=new Uint8Array(N);
 for(let i=0;i<N;i++){const r=data[i*3],g=data[i*3+1],b=data[i*3+2];const L=0.299*r+0.587*g+0.114*b;lum[i]=L;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  if(L>195&&mx-mn<45)cls[i]=1; else if(r>170&&g>140&&b<130&&r-b>80&&Math.abs(r-g)<90)cls[i]=2;}
 const lab=new Int32Array(N).fill(-1);const comps=[];
 for(let s=0;s<N;s++){if(!cls[s]||lab[s]>=0)continue;const c=cls[s];const id=comps.length;let st=[s];lab[s]=id;let area=0,x0=W,y0=H,x1=0,y1=0,border=false;
  while(st.length){const p=st.pop();area++;const x=p%W,y=(p/W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(x==0||y==0||x==W-1||y==H-1)border=true;
   for(const q of [p-1,p+1,p-W,p+W]){if(q<0||q>=N)continue;const qx=q%W;if(Math.abs(qx-x)>1)continue;if(cls[q]===c&&lab[q]<0){lab[q]=id;st.push(q);}}}
  comps.push({id,c,area,x0,y0,x1,y1,border});}
 // holes: pixels inside bbox not in comp and not reachable from bbox edge via non-comp pixels
 const out=[];
 for(const k of comps){const bw=k.x1-k.x0+1,bh=k.y1-k.y0+1;if(k.area<W*H*0.0008||k.area>W*H*0.25||bw<20||bh<12)continue;
  const reach=new Uint8Array(bw*bh);const st=[];const inC=(x,y)=>lab[(y+k.y0)*W+x+k.x0]===k.id;
  for(let x=0;x<bw;x++){for(const y of[0,bh-1])if(!inC(x,y)&&!reach[y*bw+x]){reach[y*bw+x]=1;st.push(y*bw+x);}}
  for(let y=0;y<bh;y++){for(const x of[0,bw-1])if(!inC(x,y)&&!reach[y*bw+x]){reach[y*bw+x]=1;st.push(y*bw+x);}}
  while(st.length){const p=st.pop();const x=p%bw,y=(p/bw)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=bw||ny>=bh)continue;const q=ny*bw+nx;if(!reach[q]&&!inC(nx,ny)){reach[q]=1;st.push(q);}}}
  let holes=0,dark=0;for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const q=y*bw+x;if(!reach[q]&&!inC(x,y)){holes++;if(lum[(y+k.y0)*W+x+k.x0]<100)dark++;}}
  const fill=(k.area+holes)/(bw*bh);
  if(dark<k.area*0.03)continue;
  out.push({...k,holes,dark,fill:+fill.toFixed(3)});}
 all[f]={W,H,cands:out};
 // overlay
 const svg=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${out.map((k,i)=>`<rect x="${k.x0}" y="${k.y0}" width="${k.x1-k.x0}" height="${k.y1-k.y0}" fill="none" stroke="${k.c==1?'#f0f':'#0a0'}" stroke-width="3"/><text x="${k.x0}" y="${k.y0+22}" font-size="26" fill="#f0f" stroke="#000" stroke-width="1">${i}</text>`).join('')}</svg>`;
 await sharp(SP+'/'+f).composite([{input:Buffer.from(svg)}]).toFile(SP+'/_ov_'+f);
 fs.writeFileSync(SP+'/_lab_'+f+'.bin',Buffer.from(lab.buffer));
 console.log(f,W,H,out.length);}
fs.writeFileSync(SP+'/cands.json',JSON.stringify(all,null,1));})();
