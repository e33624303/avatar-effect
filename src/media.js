const camCapNode = document.getElementById('camcap');

async function promptMedia(resolution) {
  try {
    const constraints = {
      audio: false,
      video: {
        width: { ideal: resolution.width },
        height: { ideal: resolution.height },
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    camCapNode.srcObject = stream;
    const videoTrack = stream.getVideoTracks()[0];
    camCapNode.width = videoTrack.getSettings().width || 0;
    camCapNode.height = videoTrack.getSettings().height || 0;
    console.log('webcam::start dimension', camCapNode.width, camCapNode.height);
  } catch (e) {
    console.log('webcam::start error', e);
    throw new Error('Unable to activate Webcam, please turn off Webcam in other apps and reopen BiBi');
  }
}

export default promptMedia;
