import { createCanvas, Image, loadImage } from 'canvas';
import { promises as fs } from 'fs';

// Helper to render SVG to canvas
async function renderSVGToCanvas(svgPath, width, height, backgroundColor = '#08090c') {
  const svgContent = await fs.readFile(svgPath, 'utf-8');
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Create image from SVG using data URL
  const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');
  const img = await loadImage(dataUrl);
  
  // Draw centered
  const scale = Math.min(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  
  ctx.drawImage(img, x, y, drawWidth, drawHeight);
  
  return canvas;
}

async function main() {
  console.log('Gerando PNGs a partir dos novos SVGs...\n');
  
  // 1. Icons PWA (192x192 e 512x512) - baseados no pawn.svg
  console.log('1. Gerando icons PWA...');
  
  const icon192 = await renderSVGToCanvas(
    './assets/pawn.svg', 192, 192, '#08090c'
  );
  await fs.writeFile('./assets/icons/icon-192.png', icon192.toBuffer('image/png'));
  console.log('   ✓ icon-192.png');
  
  const icon512 = await renderSVGToCanvas(
    './assets/pawn.svg', 512, 512, '#08090c'
  );
  await fs.writeFile('./assets/icons/icon-512.png', icon512.toBuffer('image/png'));
  console.log('   ✓ icon-512.png');
  
  // 2. Apple splash screens - baseados no totem-screensaver.svg
  // Tamanhos necessários para iOS
  const splashSizes = [
    { name: 'splash-750x1334.png', w: 750, h: 1334 },      // iPhone 6/7/8
    { name: 'splash-828x1792.png', w: 828, h: 1792 },      // iPhone XR
    { name: 'splash-1125x2436.png', w: 1125, h: 2436 },    // iPhone X/XS/11 Pro
    { name: 'splash-1170x2532.png', w: 1170, h: 2532 },    // iPhone 12/13/14
    { name: 'splash-1179x2556.png', w: 1179, h: 2556 },    // iPhone 14/15
    { name: 'splash-1242x2688.png', w: 1242, h: 2688 },    // iPhone XS Max/11 Pro Max
    { name: 'splash-1284x2778.png', w: 1284, h: 2778 },    // iPhone 12/13/14 Pro Max
    { name: 'splash-1290x2796.png', w: 1290, h: 2796 },    // iPhone 15 Pro Max
  ];
  
  console.log('\n2. Gerando splash screens iOS...');
  
  for (const { name, w, h } of splashSizes) {
    const canvas = await renderSVGToCanvas(
      './assets/totem-screensaver.svg', w, h, '#08090c'
    );
    await fs.writeFile(`./assets/${name}`, canvas.toBuffer('image/png'));
    console.log(`   ✓ ${name} (${w}x${h})`);
  }
  
  // 3. PWA Icons maskable - baseados no pawn.svg
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  console.log('\n3. Gerando ícones PWA maskable...');
  
  for (const size of iconSizes) {
    const canvas = await renderSVGToCanvas(
      './assets/pawn.svg', size, size, '#08090c'
    );
    await fs.writeFile(`./assets/icons/icon-${size}.png`, canvas.toBuffer('image/png'));
    console.log(`   ✓ icon-${size}.png`);
  }
  
  console.log('\n✓ Todos os PNGs gerados com sucesso!');
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});