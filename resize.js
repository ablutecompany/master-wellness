const { Jimp } = require('jimp');

async function processImage() {
  try {
    const original = await Jimp.read('assets/novo_logo.png.png');
    const width = original.bitmap.width;
    const height = original.bitmap.height;
    console.log(`Original logo size: ${width}x${height}`);

    // Standard 192x192
    const icon192 = new Jimp({ width: 192, height: 192, color: '#05070A' });
    const resized192 = original.clone().resize({ w: 150 });
    icon192.composite(resized192, (192 - resized192.bitmap.width) / 2, (192 - resized192.bitmap.height) / 2);
    await icon192.write('assets/pwa-192.png');
    console.log('Created pwa-192.png');

    // Standard 512x512
    const icon512 = new Jimp({ width: 512, height: 512, color: '#05070A' });
    const resized512 = original.clone().resize({ w: 400 });
    icon512.composite(resized512, (512 - resized512.bitmap.width) / 2, (512 - resized512.bitmap.height) / 2);
    await icon512.write('assets/pwa-512.png');
    console.log('Created pwa-512.png');

    // Maskable 512x512 (More padding to be "safe")
    // Safe zone is inner 80%. So 512 * 0.8 = 409, but logo should be fully visible, maybe size = 340.
    const maskable512 = new Jimp({ width: 512, height: 512, color: '#05070A' });
    const resizedMaskable = original.clone().resize({ w: 320 });
    maskable512.composite(resizedMaskable, (512 - resizedMaskable.bitmap.width) / 2, (512 - resizedMaskable.bitmap.height) / 2);
    await maskable512.write('assets/pwa-maskable-512.png');
    console.log('Created pwa-maskable-512.png');

    // Apple touch icon 180x180
    const appleIcon = new Jimp({ width: 180, height: 180, color: '#05070A' });
    const resizedApple = original.clone().resize({ w: 140 });
    appleIcon.composite(resizedApple, (180 - resizedApple.bitmap.width) / 2, (180 - resizedApple.bitmap.height) / 2);
    await appleIcon.write('assets/apple-touch-icon.png');
    console.log('Created apple-touch-icon.png');

    // Favicon 32x32
    const favicon = new Jimp({ width: 32, height: 32, color: '#00000000' });
    const resizedFav = original.clone().resize({ w: 32 });
    favicon.composite(resizedFav, (32 - resizedFav.bitmap.width) / 2, (32 - resizedFav.bitmap.height) / 2);
    await favicon.write('assets/favicon.png');
    console.log('Created favicon.png');

    console.log('Done processing images.');
  } catch (err) {
    console.error(err);
  }
}

processImage();
