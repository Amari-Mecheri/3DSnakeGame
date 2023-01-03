"use strict";
import * as THREE from "./three/three.module.js";
import { OrbitControls } from "./three/OrbitControls.js";
// import { setupGame, playGame } from './wasm/launchGame.js';
// import { wasmLoaded } from './wasm/initWsm.js';
import { Vector3 } from "./three/three.module.js";
import { Stats } from "./three/stats.module.js";
import scrolling from "./Elements/scroll.js";

export default class demo {
  constructor(options) {
    this.initWorker();
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      200
    );
    this.camera.position.z = 8.8;
    this.camera.position.y = 0.4;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.time = 0;
    this.playTime = 0;
    this.clock = new THREE.Clock();
    this.stats = this.createStats();
    document.body.appendChild(this.stats.domElement);
    this.scrolling = new scrolling(THREE, this.scene);

    this.listObj = {};
    this.lastDirection = { DX: 1, DY: 0 };
    [this.lastX, this.lastY] = [0, 0];
    [this.lastX1, this.lastY1] = [0, 0];
    this.textureLoader = new THREE.TextureLoader();
    this.snakeTexture = this.textureLoader.load("../img/gold_snake_skin.jpeg");
    this.snakeTexture.center.set(0.5, 0.5);
    this.snakeTexture.repeat.set(0.25, 0.25);
    this.snakeTexture.rotation = Math.PI / 2;
    this.sphereMat = new THREE.MeshStandardMaterial({ map: this.snakeTexture });
    this.cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.2);
    this.coneGeo = new THREE.CylinderGeometry(0.1, 0, 0.2);
    this.snakeHeadGeo = new THREE.DodecahedronGeometry(0.1);
    this.cylinderMat = new THREE.MeshStandardMaterial({
      map: this.snakeTexture,
    });
    this.fakeMesh = new THREE.Mesh(this.snakeHeadGeo, this.cylinderMat);

    this.addObjects();
    //this.launchGame();
    //wasmLoaded(()=>{setupGame(this.deleteTail, this.candy, this.snakePart, this.clearBoard)});
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.setupResize();
    // console.log(indexes.ListSprites);
    this.render();
  }

  initWorker() {
    this.worker = new Worker("js/Workers/game.js");
    const length = indexes.End;
    //console.log("length: ",length);
    this.sharedBuffer = new SharedArrayBuffer(
      Int32Array.BYTES_PER_ELEMENT * length
    );
    //console.log(this.sharedBuffer);
    this.sharedArray = new Int32Array(this.sharedBuffer);
    Atomics.store(this.sharedArray, indexes.State, workerState.Dirty);
    this.worker.postMessage(this.sharedBuffer);
    document.addEventListener("keydown", (e) => {
      let value = 0;
      const key = e.key;
      switch (key) {
        case "ArrowLeft":
          value = 1;
          break;

        case "ArrowRight":
          value = 2;
          break;

        case "ArrowUp":
          value = 3;
          break;

        case "ArrowDown":
          value = 4;
          break;

        case "Enter":
          value = 5;
          break;

        case " ":
          value = 6;
          break;

        case "d":
          value = 0;
          this.scrolling.debug();
          break;

        default:
          break;
      }
      if (value) Atomics.store(this.sharedArray, indexes.KeyDown, value);
    });
  }

  playGame() {
    if (Atomics.load(this.sharedArray, indexes.State) == workerState.Dirty) {
      if (Atomics.load(this.sharedArray, indexes.ClearBoard)) this.clearBoard();
      this.loadValues();
      this.displaySprites();
      Atomics.store(this.sharedArray, indexes.State, workerState.Ready);
      Atomics.notify(this.sharedArray, indexes.State, 1);
    }
  }

  loadValues = () => {
    this.SnakeSize = Atomics.load(this.sharedArray, indexes.SnakeSize);
    this.SnakeHead = {
      X: Atomics.load(this.sharedArray, indexes.SnakeHead),
      Y: Atomics.load(this.sharedArray, indexes.SnakeHead + 1),
    };
    this.SnakeTail = {
      X: Atomics.load(this.sharedArray, indexes.SnakeTail),
      Y: Atomics.load(this.sharedArray, indexes.SnakeTail + 1),
    };
    this.gameInProgress = Atomics.load(
      this.sharedArray,
      indexes.GameInProgress
    );
    this.score = Atomics.load(this.sharedArray, indexes.Score);
    this.highScore = Atomics.load(this.sharedArray, indexes.HighScore);
    this.round = Atomics.load(this.sharedArray, indexes.Round);
    this.direction = {
      DX: Atomics.load(this.sharedArray, indexes.SnakeDirection),
      DY: Atomics.load(this.sharedArray, indexes.SnakeDirection + 1),
    };
    this.candyChar = Atomics.load(this.sharedArray, indexes.Candy);
    this.snakeChar = Atomics.load(this.sharedArray, indexes.Snake);
    this.spaceChar = Atomics.load(this.sharedArray, indexes.Space);
  };

  displaySprites = () => {
    for (let i = 0; i < 3; i++) {
      //max sprite number is 3
      let sprite = Atomics.load(this.sharedArray, indexes.ListSprites + i * 3);
      switch (sprite) {
        case 0:
          i = 3;
          break;

        case this.candyChar:
          this.candy(
            Atomics.load(this.sharedArray, indexes.ListSprites + i * 3 + 1),
            Atomics.load(this.sharedArray, indexes.ListSprites + i * 3 + 2)
          );
          break;

        case this.snakeChar:
          this.snakePart(
            Atomics.load(this.sharedArray, indexes.ListSprites + i * 3 + 1),
            Atomics.load(this.sharedArray, indexes.ListSprites + i * 3 + 2),
            this.direction
          );
          break;

        case this.spaceChar:
          this.deleteTail(
            Atomics.load(this.sharedArray, indexes.ListSprites + i * 3 + 1),
            Atomics.load(this.sharedArray, indexes.ListSprites + i * 3 + 2)
          );
          break;

        default:
          i = 3;
          break;
      }
    }
  };

  clearBoard = () => {
    while (Object.keys(this.listObj).length > 0) {
      let xy = Object.keys(this.listObj)[0];
      let obj = this.listObj[xy];
      if (obj) {
        this.removeObj(obj);
      }
      delete this.listObj[xy];
    }
  };

  deleteObj(x, y) {
    let xy = this.getId(x, y);
    let obj = this.listObj[xy];
    if (obj) {
      this.removeObj(obj);
      delete this.listObj[xy];
    }
  }

  removeObj(obj) {
    if (obj.mesh) {
      if (!obj.mesh.parent) console.log(obj);
      else {
        obj.mesh.parent.remove(obj.mesh);
        obj.mesh.geometry.dispose();
        obj.mesh.material.dispose();
        obj = undefined;
      }
    }
  }

  // playGame(){
  //     this.work.postMessage({
  //         eventType: "PLAY"
  //     });
  // }

  createStats() {
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0";
    stats.domElement.style.top = "0";

    return stats;
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    window.requestAnimationFrame(this.render.bind(this));
    var timeStamp = this.clock.getDelta();
    if (timeStamp < 1) {
      this.time += 0.5 * timeStamp;
      this.scrolling.scroll(timeStamp);

      this.playTime += timeStamp * 1000;
      if (this.playTime >= 100) {
        this.playTime = 0;
      } else this.updateSnakeSize(this.playTime / 100);

      Atomics.store(this.sharedArray, indexes.SkipFrame, this.playTime);
      this.playGame();
    }

    this.renderer.render(this.scene, this.camera);
    this.stats.update();
  }

  addObjects() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
    this.directionalLight.castShadow = true;
    // this.directionalLight.shadow.bias = 0.0001;
    // this.directionalLight.shadow.mapSize.width = 2048;
    // this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.position.set(6, 4, 8);
    this.scene.add(this.directionalLight);

    // this.light = new THREE.SpotLight(0xffa95c,4);
    // this.light.position.set(-50,50,50);
    // this.light.castShadow = true;
    // this.scene.add( this.light );

    this.ground();
  }

  torus(x, y, angle) {
    let torusGeo = new THREE.TorusGeometry(0.1, 0.1, 16, 100, Math.PI / 2);
    torusGeo.center();
    torusGeo.computeBoundingBox();
    torusGeo.rotateY(-Math.PI / 2);
    torusGeo.rotateX(angle);
    let torusMesh = new THREE.Mesh(torusGeo, this.cylinderMat);
    torusMesh.position.x = -5.0 + 0.1 + 0.2 * x;
    torusMesh.position.z = -5.0 + 0.1 + 0.2 * y;
    torusMesh.position.y = 0.1;
    torusMesh.rotateZ(Math.PI / 2.0);

    torusMesh.rotateAroundWorldAxis(
      new Vector3(0, 0, 0),
      new Vector3(1, 0, 0),
      Math.PI / 4
    );
    this.scene.add(torusMesh);
    return torusMesh;
  }

  ground() {
    let groundGeo = new THREE.BoxBufferGeometry(10, 10, 0.6);
    let groundMat = new THREE.MeshStandardMaterial({
      color: 0x12ab32,
      map: this.textureLoader.load("../img/grass.jpeg"),
    });
    let groundMesh = new THREE.Mesh(groundGeo, groundMat);
    //groundMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0),new Vector3(1, 0, 0),Math.PI / 4.);
    groundMesh.position.z = -0.3;
    //groundMesh.rotateX(Math.PI/4);
    groundMesh.rotateAroundWorldAxis(
      new Vector3(0, 0, 0),
      new Vector3(1, 0, 0),
      -Math.PI / 4
    );
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);
    return groundMesh;
  }

  getId(x, y) {
    return (
      "spot" + x.toString().padStart(2, "0") + y.toString().padStart(2, "0")
    );
  }

  getXY(XY) {
    let x = parseInt(XY.substring(4, 6));
    let y = parseInt(XY.substring(6, 8));
    return { x: x, y: y };
  }

  addToListObj(x, y, obj) {
    obj.name = this.getId(x, y);
    if (this.listObj[obj.name]) this.removeObj(this.listObj[obj.name]);
    this.listObj[obj.name] = obj;
  }

  deleteTail = (x, y) => {
    this.deleteObj(x, y);
    if (this.SnakeSize > 2) {
      let tail = this.SnakeTail;
      let xy = this.getId(tail.X, tail.Y);
      let direction = this.listObj[xy].direction;
      this.deleteObj(tail.X, tail.Y);
      this.cone(tail.X, tail.Y, direction);
    }
  };

  updateSnakeSize(ratio) {
    if (this.gameInProgress) {
      //   Object.keys(this.listObj).forEach((xy) => {
      //     if (this.listObj[xy]) {
      //       let {x,y} = this.getXY(xy);
      //       let direction = this.listObj[xy].direction;
      //       if (direction) {
      //         this.fakeMesh.position.x =
      //           -5.0 + 0.1 + 0.2 * x + direction.DX * 0.2 * ratio;
      //         this.fakeMesh.position.z =
      //           -5.0 + 0.1 + 0.2 * y + direction.DY * 0.2 * ratio;
      //         this.fakeMesh.position.y = 0.1;
      //         this.fakeMesh.rotateX((direction.DY * -Math.PI) / 2.0);
      //         if (direction.DX == -1) {
      //           this.fakeMesh.rotateX(direction.DX * Math.PI);
      //         }
      //         this.fakeMesh.rotateAroundWorldAxis(
      //           new Vector3(0, 0, 0),
      //           new Vector3(1, 0, 0),
      //           Math.PI / 4
      //         );
      //         this.listObj[xy].mesh.position.x = this.fakeMesh.position.x;
      //         this.listObj[xy].mesh.position.z = this.fakeMesh.position.z;
      //         this.listObj[xy].mesh.position.y = this.fakeMesh.position.y;
      //         // console.log(this.listObj[xy].mesh.scale);
      //       }
      //       else console.log(this.listObj[xy].name);
      //     }
      //   });
      if (this.SnakeHead) {
        let head = this.SnakeHead;
        let xy = this.getId(head.X, head.Y);
        if (this.listObj[xy]) {
          let direction = this.listObj[xy].direction;
          this.fakeMesh.position.x =
            -5.0 + 0.1 + 0.2 * head.X + direction.DX * 0.2 * ratio;
          this.fakeMesh.position.z =
            -5.0 + 0.1 + 0.2 * head.Y + direction.DY * 0.2 * ratio;
          this.fakeMesh.position.y = 0.1;
          this.fakeMesh.rotateX((direction.DY * -Math.PI) / 2.0);
          if (direction.DX == -1) {
            this.fakeMesh.rotateX(direction.DX * Math.PI);
          }
          this.fakeMesh.rotateAroundWorldAxis(
            new Vector3(0, 0, 0),
            new Vector3(1, 0, 0),
            Math.PI / 4
          );
          this.listObj[xy].mesh.position.x = this.fakeMesh.position.x;
          this.listObj[xy].mesh.position.z = this.fakeMesh.position.z;
          this.listObj[xy].mesh.position.y = this.fakeMesh.position.y;
          // console.log(this.listObj[xy].mesh.scale);
        }
      }
      if (this.SnakeSize > 1) {
        let tail = this.SnakeTail;
        let xy = this.getId(tail.X, tail.Y);
        let direction = this.listObj[xy].direction;
        this.fakeMesh.position.x =
          -5.0 + 0.1 + 0.2 * tail.X + direction.DX * 0.2 * ratio;
        this.fakeMesh.position.z =
          -5.0 + 0.1 + 0.2 * tail.Y + direction.DY * 0.2 * ratio;
        this.fakeMesh.position.y = 0.1;
        this.fakeMesh.rotateX((direction.DY * -Math.PI) / 2.0);
        if (direction.DX == -1) {
          this.fakeMesh.rotateX(direction.DX * Math.PI);
        }
        this.fakeMesh.rotateAroundWorldAxis(
          new Vector3(0, 0, 0),
          new Vector3(1, 0, 0),
          Math.PI / 4
        );
        this.listObj[xy].mesh.position.x = this.fakeMesh.position.x;
        this.listObj[xy].mesh.position.z = this.fakeMesh.position.z;
        this.listObj[xy].mesh.position.y = this.fakeMesh.position.y;
      }
      if (this.SnakeSize > 2) {
        let xy = this.getId(this.lastX1, this.lastY1);
        let direction = this.listObj[xy].direction;
        this.fakeMesh.position.x =
          -5.0 + 0.1 + 0.2 * this.lastX1 + direction.DX * 0.2 * ratio;
        this.fakeMesh.position.z =
          -5.0 + 0.1 + 0.2 * this.lastY1 + direction.DY * 0.2 * ratio;
        this.fakeMesh.position.y = 0.1;
        this.fakeMesh.rotateX((direction.DY * -Math.PI) / 2.0);
        if (direction.DX == -1) {
          this.fakeMesh.rotateX(direction.DX * Math.PI);
        }
        this.fakeMesh.rotateAroundWorldAxis(
          new Vector3(0, 0, 0),
          new Vector3(1, 0, 0),
          Math.PI / 4
        );
        this.listObj[xy].mesh.position.x = this.fakeMesh.position.x;
        this.listObj[xy].mesh.position.z = this.fakeMesh.position.z;
        this.listObj[xy].mesh.position.y = this.fakeMesh.position.y;
      }
    }
  }

  snakePart = (x, y, direction) => {
    if (this.SnakeSize > 1) {
      if (JSON.stringify(this.lastDirection) !== JSON.stringify(direction)) {
        //let torusMesh = new THREE.Mesh( this.torusGeo, this.cylinderMat );
        this.deleteObj(this.lastX, this.lastY);
        let angle = 0;
        if (this.lastDirection.DX != 0)
          angle =
            new THREE.Vector2(
              this.lastDirection.DX + direction.DX,
              this.lastDirection.DY + direction.DY
            ).angle() -
            1.25 * Math.PI;
        else
          angle =
            new THREE.Vector2(
              this.lastDirection.DX + direction.DX,
              this.lastDirection.DY + direction.DY
            ).angle() -
            0.25 * Math.PI;
        let torusMesh = this.torus(this.lastX, this.lastY, angle);
        this.addToListObj(this.lastX, this.lastY, {
          mesh: torusMesh,
          direction: direction,
        });
      } else {
        this.deleteObj(this.lastX, this.lastY);
        this.cylinder(this.lastX, this.lastY, this.lastDirection);
      }
    }
    [this.lastX1, this.lastY1] = [this.lastX, this.lastY];
    this.snakeHead(x, y, direction);
    [this.lastX, this.lastY] = [x, y];
    this.lastDirection = direction;
  };

  cone(x, y, direction) {
    let coneMesh = new THREE.Mesh(this.coneGeo, this.cylinderMat);
    coneMesh.position.x = -5.0 + 0.1 + 0.2 * x;
    coneMesh.position.z = -5.0 + 0.1 + 0.2 * y;
    coneMesh.position.y = 0.1;
    coneMesh.castShadow = true;
    coneMesh.receiveShadow = true;
    coneMesh.rotateZ(Math.PI / 2.0);
    coneMesh.rotateX((direction.DY * Math.PI) / 2.0);
    if (direction.DX == 1) {
      coneMesh.rotateX(direction.DX * Math.PI);
    }

    coneMesh.rotateAroundWorldAxis(
      new Vector3(0, 0, 0),
      new Vector3(1, 0, 0),
      Math.PI / 4
    );
    this.scene.add(coneMesh);
    this.addToListObj(x, y, { mesh: coneMesh, direction: direction });
  }

  snakeHead(x, y, direction) {
    let snakeHeadMesh = new THREE.Mesh(this.snakeHeadGeo, this.cylinderMat);
    snakeHeadMesh.position.x = -5.0 + 0.1 + 0.2 * x;
    snakeHeadMesh.position.z = -5.0 + 0.1 + 0.2 * y;
    snakeHeadMesh.position.y = 0.1;
    snakeHeadMesh.castShadow = true;
    snakeHeadMesh.receiveShadow = true;
    snakeHeadMesh.rotateZ(Math.PI / 2.0);
    snakeHeadMesh.rotateX((direction.DY * -Math.PI) / 2.0);
    if (direction.DX == -1) {
      snakeHeadMesh.rotateX(direction.DX * Math.PI);
    }
    snakeHeadMesh.rotateAroundWorldAxis(
      new Vector3(0, 0, 0),
      new Vector3(1, 0, 0),
      Math.PI / 4
    );
    this.scene.add(snakeHeadMesh);
    this.addToListObj(x, y, { mesh: snakeHeadMesh, direction: direction });
  }

  cylinder(x, y, direction) {
    let cylinderMesh = new THREE.Mesh(this.cylinderGeo, this.cylinderMat);
    cylinderMesh.position.x = -5.0 + 0.1 + 0.2 * x;
    cylinderMesh.position.z = -5.0 + 0.1 + 0.2 * y;
    cylinderMesh.position.y = 0.1;
    cylinderMesh.castShadow = true;
    cylinderMesh.receiveShadow = true;
    cylinderMesh.rotateZ(Math.PI / 2.0);
    cylinderMesh.rotateX((direction.DY * Math.PI) / 2.0);

    cylinderMesh.rotateAroundWorldAxis(
      new Vector3(0, 0, 0),
      new Vector3(1, 0, 0),
      Math.PI / 4
    );
    this.scene.add(cylinderMesh);
    this.addToListObj(x, y, { mesh: cylinderMesh, direction: direction });
  }

  candy = (x, y) => {
    let candyGeo = new THREE.DodecahedronGeometry(0.1);
    let candyMat = new THREE.MeshStandardMaterial({
      color: 0xff70ff,
      metalness: 0.5,
      roughness: 0.5,
    });
    let candyMesh = new THREE.Mesh(candyGeo, candyMat);
    candyMesh.position.x = -5.0 + 0.1 + 0.2 * x;
    candyMesh.position.z = -5.0 + 0.1 + 0.2 * y;
    candyMesh.position.y = 0.1;
    candyMesh.castShadow = true;
    candyMesh.receiveShadow = true;
    candyMesh.rotateAroundWorldAxis(
      new Vector3(0, 0, 0),
      new Vector3(1, 0, 0),
      Math.PI / 4
    );
    this.scene.add(candyMesh);
    this.addToListObj(x, y, { mesh: candyMesh });
  };
}

THREE.Object3D.prototype.rotateAroundWorldAxis = (function () {
  var q = new THREE.Quaternion();

  return function rotateAroundWorldAxis(point, axis, angle) {
    q.setFromAxisAngle(axis, angle);
    this.applyQuaternion(q);
    this.position.sub(point);
    this.position.applyQuaternion(q);
    this.position.add(point);
    return this;
  };
})();

let v = new demo({
  dom: document.getElementById("container"),
});
