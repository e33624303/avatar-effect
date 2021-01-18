import { load as loadFacemeshConfig, SupportedPackages } from '@tensorflow-models/face-landmarks-detection';
import promptMedia from './media';
import AvatarEffect from './avatar-effect/index';
import '@tensorflow/tfjs-backend-webgl';

const canvas = document.getElementById('webcamCanvas');
const context = canvas.getContext('2d');
const camcap = document.getElementById('camcap');
let model;
let avatar;

const CanvasResolution = {
  width: 960,
  height: 720,
};

async function renderer() {
  const predictions = await model.estimateFaces({
    input: camcap,
    returnTensors: false,
    flipHorizontal: false,
  });
  context.drawImage(camcap, 0, 0, canvas.width, canvas.height);
  avatar.updateFaceMesh(predictions);
  // console.log('render loop');
  requestAnimationFrame(renderer);
}

async function main() {
  console.log('main func::');
  await promptMedia(CanvasResolution);
  console.log('promptMedia');
  canvas.width = 960;
  canvas.height = 720;
  model = await loadFacemeshConfig(SupportedPackages.mediapipeFacemesh, {
    shouldLoadIrisModel: true,
    maxFaces: 1,
  });
  avatar = new AvatarEffect(CanvasResolution, './face-texture1.jpg');
  camcap.onloadedmetadata = (event) => {
    requestAnimationFrame(renderer);
  };
}

main();
