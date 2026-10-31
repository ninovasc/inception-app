const fs = require('fs');
const zlib = require('zlib');

function inPawn(nx, ny) {
  // base
  if (nx >= 0.305 && nx <= 0.695 && ny >= 0.781 && ny <= 0.844) return true;
  // stem
  if (nx >= 0.441 && nx <= 0.559 && ny >= 0.586 && ny <= 0.781) return true;
  // body circle
  if ((nx-0.5)**2 + (ny-0.449)**2 <= 0.137**2) return true;
  // neck
  if (nx >= 0.461 && nx <= 0.539 && ny >= 0.293 && ny <= 0.371) return true;
  // head circle
  if ((nx-0.5)**2 + (ny-0.234)**2 <= 0.090**2) return true;
  return false;
}

function makePng(width, height) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const i = rowStart + 1 + x * 4;
      const nx = (x + 0.5) / width;
      const ny = (y + 0.5) / height;
      if (inPawn(nx, ny)) {
        raw[i]=255; raw[i+1]=255; raw[i+2]=255; raw[i+3]=255;
      } else {
        raw[i]=0; raw[i+1]=0; raw[i+2]=0; raw[i+3]=255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  function crc32(buf){let c=0xFFFFFFFF;const t=crc32.t||(crc32.t=makeT());for(let i=0;i<buf.length;i++)c=(c>>>8)^t[(c^buf[i])&0xFF];return(c^0xFFFFFFFF)>>>0;}
  function makeT(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;}
  function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);const tb=Buffer.from(type);const cb=Buffer.alloc(4);const crc=crc32(Buffer.concat([tb,data]));cb.writeUInt32BE(crc,0);return Buffer.concat([len,tb,data,cb]);}
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',idat), chunk('IEND',Buffer.alloc(0))]);
}

const sizes = [
  ['assets/icons/icon-192.png', 192, 192],
  ['assets/icons/icon-512.png', 512, 512],
  ['assets/splash-1170x2532.png', 1170, 2532],
  ['assets/splash-1125x2436.png', 1125, 2436],
  ['assets/splash-1284x2778.png', 1284, 2778],
  ['assets/splash-1179x2556.png', 1179, 2556],
  ['assets/splash-1290x2796.png', 1290, 2796],
  ['assets/splash-828x1792.png', 828, 1792],
  ['assets/splash-750x1334.png', 750, 1334],
  ['assets/splash-1242x2688.png', 1242, 2688],
];
for (const [p,w,h] of sizes) {
  fs.mkdirSync(p.split('/').slice(0,-1).join('/'), {recursive:true});
  fs.writeFileSync(p, makePng(w,h));
  console.log('wrote', p);
}
