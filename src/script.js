import promptMedia from './media.js';

const canvas = document.getElementById('webcamCanvas');
const context = canvas.getContext('2d');
const camcap = document.getElementById('camcap');

const CanvasResolution = {
  width: 960,
  height: 720,
};
const MinCameraSize = {
  width: 160,
  height: 120,
};

async function renderer() {
  context.drawImage(camcap, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(renderer);
}

async function main() {
  console.log('main func::');
  await promptMedia(CanvasResolution);
  console.log('promptMedia');
  canvas.width = 960;
  canvas.height = 720;
  requestAnimationFrame(renderer);
}

main();
