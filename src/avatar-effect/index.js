import {
  WebGLRenderer,
  Scene,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  Face3,
  OrthographicCamera,
  AmbientLight,
  SpotLight,
  PointLight,
  Box3,
  Vector2,
  Vector3,
  TextureLoader,
  CanvasTexture,
} from 'three';
import * as GLTF from './GLTFLoader';
import Facemesh from './face-mesh-triangles';
import Coord from './coordinate';
import { getRadian2D, getDistance3D } from './three-math';

export default class AvatarEffect {
  constructor(facemeshResolution, textureUrl) {
    this.canvas = document.getElementById('avatarCanvas');
    this.meshes = [];
    this.lastRotation = {
      x: 0,
      y: 0,
      z: 0,
    };
    const whiteCanvas = document.createElement('canvas');
    const whiteCtx = whiteCanvas.getContext('2d');
    whiteCtx.fillStyle = 'white';
    whiteCtx.fillRect(0, 0, whiteCanvas.width, whiteCanvas.height);
    this.skinTexture = new CanvasTexture(whiteCanvas);
    if (textureUrl) {
      this.skinTexture = new TextureLoader().load(textureUrl);
    }
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
    this.camera.position.set(0, 0, 10);
    this.scene = new Scene();
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
    });
    this.renderer.setSize(960, 720, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.ambientLight = new AmbientLight('#fafafa');
    this.spotLight = new SpotLight('#ffffff');
    this.pointLight = new PointLight('#ffffff', 5);
    this.pointLight.intensity = 5;
    this.scene.add(this.spotLight);
    this.scene.add(this.ambientLight);
    this.scene.add(this.pointLight);
    this.spotLight.position.set(1, 1, 10);
    this.pointLight.position.set(1, 0, 10);
    this.facemeshResolution = facemeshResolution;
    this.material = new MeshBasicMaterial({ map: this.skinTexture, side: DoubleSide });
  }

  // setCameraViewPort, setVisibility, and hideAvatar is used for both Facemesh and Gltf Model

  setCameraViewPort(src, width, height) {
    this.camera?.clearViewOffset();
    this.camera?.setViewOffset(width, height, src.x, src.y, src.width, src.height);
  }

  setTexture(canvas) {
    this.skinTexture = new CanvasTexture(canvas);
    this.material.dispose();
    this.material = new MeshBasicMaterial({ map: this.skinTexture, side: DoubleSide });
    console.log('Avatar::update texture');
  }

  setVisibility(parm) {
    this.scene.visible = parm;
  }

  hideAvatar() {
    if (this.scene.visible) {
      this.setVisibility(false);
      this.renderer.render(this.scene, this.camera);
    }
  }
  // loadGltfModel, setGltfFacemeshResolution, setGltfScale, setGltfPosition, setGltfRotation, updateGltfModel is used for GLTF Model
  // User only have to use LoadGltfModel before using GLTF type Avatar, and then use updateGltfModel per frame

  loadGltfModel(dirPath, fileName, facemeshBindingPointIndex, objectBindingPosition, objectIdealRatioWithFacemesh) {
    const loader = new GLTF.GLTFLoader().setPath(dirPath);
    loader.load(fileName, (gltf) => {
      this.scene.add(gltf.scene);
      gltf.scene.position.set(0, 0, 5 + 1 - objectBindingPosition.z);
      this.object.push(gltf.scene);
      const boundingBox = new Box3().setFromObject(gltf.scene);
      this.bindingPoint.push(
        gltf.scene.worldToLocal(
          new Vector3(
            boundingBox.min.x + objectBindingPosition.x * (boundingBox.max.x - boundingBox.min.x),
            boundingBox.min.y + objectBindingPosition.y * (boundingBox.max.y - boundingBox.min.y),
            boundingBox.min.z + objectBindingPosition.z * (boundingBox.max.z - boundingBox.min.z)
          )
        )
      );
      this.setGltfFacemeshResolution(gltf.scene);
      this.facemeshBindingPointIndex.push(facemeshBindingPointIndex);
      this.objectIdealRatioWithFacemesh.push(objectIdealRatioWithFacemesh);
    });
  }

  setGltfFacemeshResolution(object) {
    const size = this.facemeshResolution;
    const boundingBox = new Box3().setFromObject(object);
    const boxSize = new Vector3();
    boundingBox.getSize(boxSize);
    this.currentSize.push({ width: (boxSize.x / 2) * size.width, height: (boxSize.y / 2) * size.height });
  }

  setGltfPosition(scaledMesh) {
    this.bindingPoint.forEach((bindingPoint, index) => {
      const x = scaledMesh[this.facemeshBindingPointIndex[index]][0];
      const y = scaledMesh[this.facemeshBindingPointIndex[index]][1];
      const bindingVector = new Vector3(bindingPoint.x, bindingPoint.y, bindingPoint.z);
      const worldBindingVector = this.object[index].localToWorld(bindingVector);
      const positionOffset = {
        x: worldBindingVector.x - this.object[index].position.x,
        y: worldBindingVector.y - this.object[index].position.y,
      };
      const position = new Vector3(
        ((this.facemeshResolution.width - x) / this.facemeshResolution.width) * 2 - 1 - positionOffset.x,
        ((this.facemeshResolution.height - y) / this.facemeshResolution.height) * 2 - 1 - positionOffset.y,
        this.object[index].position.z
      );
      this.object[index].position.set(position.x, position.y, position.z);
    });
  }

  setGltfScale(width, height) {
    this.currentSize.forEach((currentSize, index) => {
      const scaleParm =
        (width * this.objectIdealRatioWithFacemesh[index].x) / currentSize.width >
        (height * this.objectIdealRatioWithFacemesh[index].y) / currentSize.height
          ? (width * this.objectIdealRatioWithFacemesh[index].x) / currentSize.width
          : (height * this.objectIdealRatioWithFacemesh[index].y) / currentSize.height;
      this.currentSize[index].width *= scaleParm;
      this.currentSize[index].height *= scaleParm;
      const preScale = this.object[index].scale;
      this.object[index].scale.set(scaleParm * preScale.x, scaleParm * preScale.y, scaleParm * preScale.z);
    });
  }

  setGltfRotation(radian, axis) {
    this.object.forEach((object) => {
      if (axis === 'X') {
        object.rotateOnWorldAxis(new Vector3(1, 0, 0), radian);
      } else if (axis === 'Y') {
        object.rotateOnWorldAxis(new Vector3(0, 1, 0), radian);
      } else {
        object.rotateOnWorldAxis(new Vector3(0, 0, 1), radian);
      }
    });
  }

  updateGltfModel(facemeshResult) {
    if (facemeshResult.length > 0) {
      let maxScoreId = 0;
      let maxScore = 0;
      facemeshResult.forEach((e, index) => {
        if (e.faceInViewConfidence > maxScore) {
          maxScoreId = index;
          maxScore = e.faceInViewConfidence;
        }
      });
      if (maxScore >= 0.5) {
        this.setVisibility(true);
        // reset rotation
        this.setGltfRotation(-this.lastRotation.z, 'Z');
        this.setGltfRotation(-this.lastRotation.y, 'Y');
        this.setGltfRotation(-this.lastRotation.x, 'X');
        // set scale
        this.setGltfScale(
          getDistance3D(
            {
              x: facemeshResult[maxScoreId].scaledMesh[234][0],
              y: facemeshResult[maxScoreId].scaledMesh[234][1],
              z: facemeshResult[maxScoreId].scaledMesh[234][2],
            },
            {
              x: facemeshResult[maxScoreId].scaledMesh[454][0],
              y: facemeshResult[maxScoreId].scaledMesh[454][1],
              z: facemeshResult[maxScoreId].scaledMesh[454][2],
            }
          ),
          getDistance3D(
            {
              x: facemeshResult[maxScoreId].scaledMesh[10][0],
              y: facemeshResult[maxScoreId].scaledMesh[10][1],
              z: facemeshResult[maxScoreId].scaledMesh[10][2],
            },
            {
              x: facemeshResult[maxScoreId].scaledMesh[152][0],
              y: facemeshResult[maxScoreId].scaledMesh[152][1],
              z: facemeshResult[maxScoreId].scaledMesh[152][2],
            }
          )
        );
        // rotate on X axis
        this.lastRotation.x =
          ((facemeshResult[maxScoreId].scaledMesh[10][2] > facemeshResult[maxScoreId].scaledMesh[152][2] ? -1 : 1) *
            getRadian2D(
              { x: facemeshResult[maxScoreId].scaledMesh[10][1], y: facemeshResult[maxScoreId].scaledMesh[10][2] },
              { x: facemeshResult[maxScoreId].scaledMesh[152][1], y: facemeshResult[maxScoreId].scaledMesh[152][2] },
              { x: facemeshResult[maxScoreId].scaledMesh[152][1], y: facemeshResult[maxScoreId].scaledMesh[10][2] }
            )) /
          1.5;
        this.setGltfRotation(this.lastRotation.x, 'X');
        // rotate on Y axis
        this.lastRotation.y =
          ((facemeshResult[maxScoreId].scaledMesh[234][2] > facemeshResult[maxScoreId].scaledMesh[454][2] ? 1 : -1) *
            getRadian2D(
              { x: facemeshResult[maxScoreId].scaledMesh[234][0], y: facemeshResult[maxScoreId].scaledMesh[234][2] },
              { x: facemeshResult[maxScoreId].scaledMesh[454][0], y: facemeshResult[maxScoreId].scaledMesh[454][2] },
              { x: facemeshResult[maxScoreId].scaledMesh[454][0], y: facemeshResult[maxScoreId].scaledMesh[234][2] }
            )) /
          1.3;
        this.setGltfRotation(this.lastRotation.y, 'Y');
        // rotate on Z axis
        this.lastRotation.z =
          ((facemeshResult[maxScoreId].scaledMesh[234][1] < facemeshResult[maxScoreId].scaledMesh[454][1] ? 1 : -1) *
            getRadian2D(
              { x: facemeshResult[maxScoreId].scaledMesh[234][0], y: facemeshResult[maxScoreId].scaledMesh[234][1] },
              { x: facemeshResult[maxScoreId].scaledMesh[454][0], y: facemeshResult[maxScoreId].scaledMesh[454][1] },
              { x: facemeshResult[maxScoreId].scaledMesh[454][0], y: facemeshResult[maxScoreId].scaledMesh[234][1] }
            )) /
          1;
        this.setGltfRotation(this.lastRotation.z, 'Z');
        this.setGltfPosition(facemeshResult[maxScoreId].scaledMesh);
      } else {
        this.setVisibility(false);
      }
    } else {
      this.setVisibility(false);
    }
    this.renderer.render(this.scene, this.camera);
  }

  // buildFaceMeshGeometry, buildFaceMesh, disposeFaceMesh, and updateFaceMesh is used for dynamic building of facemesh
  // user only have to use updateFaceMesh per frame

  buildFaceMeshGeometry(scaledMesh, part) {
    const geom = new Geometry();
    let vCnt = 0;
    geom.uvsNeedUpdate = true;
    part.forEach((e) => {
      const vectorA = new Vector3(
        ((this.facemeshResolution.width - scaledMesh[e[0]][0]) / this.facemeshResolution.width) * 2 - 1,
        ((this.facemeshResolution.height - scaledMesh[e[0]][1]) / this.facemeshResolution.height) * 2 - 1,
        -scaledMesh[e[0]][2] / this.facemeshResolution.height + 5
      );
      const vectorB = new Vector3(
        ((this.facemeshResolution.width - scaledMesh[e[1]][0]) / this.facemeshResolution.width) * 2 - 1,
        ((this.facemeshResolution.height - scaledMesh[e[1]][1]) / this.facemeshResolution.height) * 2 - 1,
        -scaledMesh[e[1]][2] / this.facemeshResolution.height + 5
      );
      const vectorC = new Vector3(
        ((this.facemeshResolution.width - scaledMesh[e[2]][0]) / this.facemeshResolution.width) * 2 - 1,
        ((this.facemeshResolution.height - scaledMesh[e[2]][1]) / this.facemeshResolution.height) * 2 - 1,
        -scaledMesh[e[2]][2] / this.facemeshResolution.height + 5
      );
      geom.vertices.push(vectorA);
      geom.vertices.push(vectorB);
      geom.vertices.push(vectorC);
      geom.faces.push(new Face3(vCnt + 0, vCnt + 1, vCnt + 2));
      geom.faceVertexUvs[0][vCnt / 3] = [
        new Vector2(Coord[e[0]].x, Coord[e[0]].y),
        new Vector2(Coord[e[1]].x, Coord[e[1]].y),
        new Vector2(Coord[e[2]].x, Coord[e[2]].y),
      ];
      vCnt += 3;
    });
    geom.computeFaceNormals();
    return geom;
  }

  buildFaceMesh(scaledMesh, part, material) {
    const geom = this.buildFaceMeshGeometry(scaledMesh, part);
    const mesh = new Mesh(geom, material);
    this.meshes.push(mesh);
    this.scene.add(mesh);
  }

  disposeFaceMesh() {
    this.meshes.forEach((e) => {
      e.geometry.dispose();
      this.scene.remove(e);
    });
  }

  updateFaceMesh(facemeshResult) {
    if (facemeshResult.length > 0) {
      let maxScoreId = 0;
      let maxScore = 0;
      facemeshResult.forEach((e, index) => {
        if (e.faceInViewConfidence > maxScore) {
          maxScoreId = index;
          maxScore = e.faceInViewConfidence;
        }
      });
      if (maxScore >= 0.5) {
        this.setVisibility(true);
        const { scaledMesh } = facemeshResult[maxScoreId];
        this.disposeFaceMesh();
        this.buildFaceMesh(scaledMesh, Facemesh.forehead, this.material);
        this.buildFaceMesh(scaledMesh, Facemesh.leftEye, this.material);
        this.buildFaceMesh(scaledMesh, Facemesh.rightEye, this.material);
        this.buildFaceMesh(scaledMesh, Facemesh.leftCheek, this.material);
        this.buildFaceMesh(scaledMesh, Facemesh.rightCheek, this.material);
        this.buildFaceMesh(scaledMesh, Facemesh.nose, this.material);
        this.buildFaceMesh(scaledMesh, Facemesh.mouth, this.material);
      } else {
        this.setVisibility(false);
      }
    } else {
      this.setVisibility(false);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
