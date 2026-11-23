const fs=require('node:fs');
const sharp=require('sharp');
const base='docs/images/consept/desktop/';
const out='src/assets/images/';
const entries=[
 ['os-windows','03-apps.png',95,511,60,62,true],
 ['os-macos','03-apps.png',418,506,55,67,true],
 ['os-ios','03-apps.png',418,506,55,67,true],
 ['os-android','03-apps.png',1030,506,60,67,true],
 ['os-linux','03-apps.png',1330,506,56,65,true],
 ['mascot','../mobile/01-home.png',320,340,360,220,false],
 ['logo-horizontal-light','logo-refined-03.png',1010,800,510,150,true],
 ['logo-horizontal','logo-refined-03.png',445,800,480,150,true],
 ['logo-vertical','logo-refined-03.png',350,80,830,590,true],
 ['logo-shield','logo-refined-03.png',535,270,460,320,true],
 ['home-art','01-home.png',480,70,1192,730,false],
 ['features-art','02-features.png',680,94,991,515,false],
 ['apps-art','03-apps.png',550,74,1121,440,false],
 ['security-art','04-security.png',650,94,1021,835,false],
 ['support-art','05-support.png',820,94,851,530,false],
 ['windows-device','03-apps.png',87,600,260,157,false],
 ['macos-device','03-apps.png',405,600,260,157,false],
 ['ios-device','03-apps.png',775,595,165,165,false],
 ['android-device','03-apps.png',1075,588,165,172,false],
 ['linux-device','03-apps.png',1320,600,260,157,false]
];

// Remove only the dark backing connected to the image boundary, retaining dark device screens.
function clearBacking(data,width,height,light=false,threshold=38){
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;
 const push=i=>{if(i<0||i>=seen.length||seen[i])return;const k=i*4;const lo=Math.min(data[k],data[k+1],data[k+2]),hi=Math.max(data[k],data[k+1],data[k+2]);if(data[k+3]===0||(light?lo>235:hi<threshold&&hi-lo<18)){seen[i]=1;queue[tail++]=i;}};
 for(let x=0;x<width;x++){push(x);push((height-1)*width+x);}for(let y=0;y<height;y++){push(y*width);push(y*width+width-1);}
 while(head<tail){const i=queue[head++],x=i%width;data[i*4+3]=0;if(x)push(i-1);if(x<width-1)push(i+1);if(i>=width)push(i-width);if(i+width<seen.length)push(i+width);}
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const registry=[];
 for(const [name,source,left,top,width,height,alpha] of entries){
  let image=sharp(base+source).extract({left,top,width,height});
  if(alpha||name.endsWith('-art')||name.endsWith('-device')){
   const {data}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
   // Knock out source typography only; never use stepped silhouette thresholds.
   const textBoxes={
    'home-art':[[0,0,1192,24],[0,24,350,280],[0,304,210,110],[0,414,45,200]],
    'features-art':[[0,0,150,240]],
    'apps-art':[[0,0,300,195],[0,195,120,60]],
    'security-art':[[0,720,335,40],[0,150,45,75],[0,320,45,45]],
    'support-art':[[0,295,80,170]]
   };
   for(const [x,y,w,h]of textBoxes[name]||[])for(let yy=y;yy<Math.min(height,y+h);yy++)for(let xx=x;xx<Math.min(width,x+w);xx++)data[(yy*width+xx)*4+3]=0;
   if(!name.endsWith('-device'))clearBacking(data,width,height,name.endsWith('-light'),name.endsWith('-art')?12:38);
   image=sharp(data,{raw:{width,height,channels:4}});
   const silhouettes={
    'windows-device':'73,19 246,2 224,134 259,142 218,155 18,151 0,140 48,132',
    'macos-device':'58,16 242,0 225,133 259,141 205,156 14,151 0,139 37,133',
    'linux-device':'75,18 259,0 239,133 259,142 215,155 15,151 0,139 48,133',
    'ios-device':'53,10 137,8 142,18 108,153 98,164 8,161 4,151 45,20',
    'android-device':'52,5 135,0 143,10 108,159 100,170 7,166 2,153 44,16'
   };
   if(silhouettes[name])image=image.composite([{input:Buffer.from('<svg width="'+width+'" height="'+height+'"><polygon points="'+silhouettes[name]+'" fill="white"/></svg>'),blend:'dest-in'}]);
   if(silhouettes[name])image=sharp(await image.png().toBuffer());
  }
  await (alpha?image.clone().png():image.clone().webp({quality:90})).toFile(out+name+(alpha?'.png':'.webp'));
  if(!name.startsWith('logo'))await image.clone().resize({width:Math.round(width/2)}).webp({quality:85}).toFile(out+name+'-small.webp');
  registry.push({name,source:base+source,crop:{left,top,width,height},output:out+name+(alpha?'.png':'.webp'),alpha:alpha||name.endsWith('-art')||name.endsWith('-device'),mobile:!name.startsWith('logo')?name+'-small.webp':'same',limitation:alpha?'Black backing removed; original geometry retained.':'Masked flattened composition on dark surface; occluded layers unavailable. No whole-section text or navigation retained.'});
 }
 const {data,info}=await sharp(base+'02-features.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
 for(const kind of ['top','bottom']){
  const height=64,width=info.width,rgba=Buffer.alloc(width*height*4);
  for(let x=0;x<width;x++){
   let boundary=kind==='top'?630:755;
   const start=kind==='top'?595:730,end=kind==='top'?650:785;
   for(let y=start;y<end;y++){const i=(y*width+x)*3;const light=data[i]>205&&data[i+1]>190&&data[i+2]>160;
    if((kind==='top'&&light)||(kind==='bottom'&&!light)){boundary=y;break;}}
   const edge=Math.max(4,Math.min(60,boundary-start));
   for(let y=0;y<height;y++)if(kind==='top'?y>=edge:y<=edge){const i=(y*width+x)*4;rgba[i]=247;rgba[i+1]=240;rgba[i+2]=225;rgba[i+3]=255;}
  }
  await sharp(rgba,{raw:{width,height,channels:4}}).png().toFile(out+'torn-'+kind+'.png');
  registry.push({name:'torn-'+kind,source:base+'02-features.png',crop:kind==='top'?'paper boundary y595–650':'paper boundary y730–785',output:out+'torn-'+kind+'.png',alpha:true,width,height,mobile:'scaled full width',limitation:'Boundary sampled from flattened reference; paper color normalized to CSS token.'});
 }
 fs.mkdirSync('docs/qa',{recursive:true});
 fs.writeFileSync('docs/qa/asset-registry.json',JSON.stringify(registry,null,2)+'\n');
 console.log('Prepared '+registry.length+' assets from supplied references.');
})().catch(error=>{console.error(error);process.exitCode=1;});
