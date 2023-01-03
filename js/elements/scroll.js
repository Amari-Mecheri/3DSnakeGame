import { TextGeometry } from "../three/TextGeometry.js";
import { FontLoader } from "../three/FontLoader.js";
import { fragment } from "../shaders/fragment.js";
import { vertex } from "../shaders/vertex.js";
import { shadowFragment } from "../shaders/shadows.js";
import { shadowVertex } from "../shaders/shadows.js";

const completeText =
  "****  Welcome on board with Amari MECHERI's 3D Snake Game and Circle Scrolling :)  ****     " +
  " This demo is built with ThreeJS, JavaScript, WebAssembly and Pixel Shaders for the scrolling effects." +
  " //// The WebAssembly part holds the Snake Game logic which was developed with Go \\\\\\\\" +
  " At first the aim was to develop the scrolling but since I already had the Snake files from my other demos, I included them. " +
  " >>>> amari.mecheri@gmail.com <<<<     1+1 = 2  but  2+2 != 1      ";
const scrollTexts = [
  //   {
  //     speed: -2,
  //     pause: 0,
  //     text: completeText,
  //   },
  {
    speed: -6,
    pause: 4000,
    text: "Welcome",
  },
  {
    speed: -6,
    pause: 1000,
    text: "To",
  },
  {
    speed: -2,
    pause: 0,
    text: "Amari MECHERI's 3D Snake Game and Circle Scrolling :)          ",
  },
  {
    speed: -2,
    pause: 0,
    text: "This demo is built with                                                 ",
  },
  {
    speed: -6,
    pause: 2000,
    text: "ThreeJS",
  },
  {
    speed: -6,
    pause: 2000,
    text: "JavaScript",
  },
  {
    speed: -6,
    pause: 2000,
    text: "WebAssembly",
  },
  {
    speed: -6,
    pause: 2000,
    text: "Shared Buffers",
  },
  {
    speed: -6,
    pause: 2000,
    text: "Web Workers",
  },
  {
    speed: -6,
    pause: 2000,
    text: "Pixel Shaders",
  },
  {
    speed: -2,
    pause: 0,
    text: "//// The WebAssembly part holds the Snake Game logic which was developed with Go \\\\\\\\                             ",
  },
  {
    speed: -6,
    pause: 2000,
    text: "Press Space to Start",
  },
  {
    speed: -2,
    pause: 0,
    text: "Arrow keys to control the snake                         ",
  },
  {
    speed: -6,
    pause: 2000,
    text: "Grab the Candies!",
  },
];
const leftScrollPos = -13.0;
const rightScrollPos = 13.0;
var THREE;
export default class scrolling {
  constructor(_THREE, scene) {
    THREE = _THREE;
    this.scene = scene;
    this.timePaused = 0;
    this.currentScrollIndex = 0;
    this.currentScrollText = scrollTexts[this.currentScrollIndex].text;
    this.currentSpeed = scrollTexts[this.currentScrollIndex].speed;
    this.currentPause = scrollTexts[this.currentScrollIndex].pause;
    this.scrollPos = -1;
    this.listLetterMeshes = [];

    this.loader = new FontLoader();
    this.loader.load("js/three/fonts/helvetiker_bold.typeface.json", (font) => {
      this.font = font;
      this.setFontMaterial();
    });
  }

  setFontMaterial() {
    let r = 4.2;
    let PIr = Math.PI * r;
    let uniforms = {
      time: { value: 0 },
      r: { value: r },
      p: { value: 2 * PIr },
      m: { value: PIr },
      hPI: { value: Math.PI / 2 },
      PI: { value: Math.PI },
      PIop: { value: 1 / (2 * r) },
    };
    this.textMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      side: THREE.DoubleSide,
      fragmentShader: fragment,
      vertexShader: vertex,
      wireframe: false,
    });
    this.shadowMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      fragmentShader: shadowFragment,
      vertexShader: shadowVertex,
    });
  }

  scroll(timeStamp) {
    if (this.textMaterial) {
      this.setUniforms(timeStamp*0.5);
      this.currentPos = rightScrollPos;

      this.listLetterMeshes.forEach((i) => {
        i[0].position.x += this.currentSpeed * timeStamp;
        this.currentPos = i[0].position.x + i[1];
      });

      this.skipLetter = false;

      if (this.scrollPos >= this.currentScrollText.length - 1) {
        let last = this.listLetterMeshes.length - 1;
        let first =
          this.listLetterMeshes.length - this.currentScrollText.length;
        if (first >= 0) {
          if (
            this.listLetterMeshes[last][0].position.x +
              this.listLetterMeshes[first][0].position.x <=
            0
          ) {
            this.pause();
          } else this.skipLetter = true;
        }
      }

      if (
        !this.skipLetter &&
        !this.inPause &&
        this.currentPos <= rightScrollPos
      )
        this.addNextLetter();

      while (
        this.listLetterMeshes.length > 0 &&
        this.listLetterMeshes[0][0].position.x < leftScrollPos
      ) {
        this.removeObj(this.listLetterMeshes.shift()[0]);
      }
    }
  }

  pause() {
    if (this.timePaused == 0) {
      this.timePaused = Date.now();
      this.currentSpeed = 0;
      this.inPause = true;
    }
    if (Date.now() - this.timePaused > this.currentPause) {
      this.inPause = false;
      this.timePaused = 0;
    }
  }

  addNextLetter() {
    let newLetter = this.getNextLetter();
    if (newLetter) this.listLetterMeshes.push(newLetter);
  }

  setUniforms(time) {
    this.textMaterial.uniforms.time.value = time;
    //this.shadowMaterial.uniforms.time.value = time;
  }

  getNextLetter() {
    this.setNextIndex();

    if (this.timePaused == 0) {
      let letter = this.currentScrollText.charAt(this.scrollPos);
      let newEntry = this.createLetter(letter, this.currentPos + 0.05);
      newEntry[0].name = letter + this.currentPos.toString();
      if (letter == " ") {
        newEntry[1] = 0.35;
      }
      return newEntry;
    }
  }

  setNextIndex() {
    this.scrollPos += 1;
    if (this.scrollPos >= this.currentScrollText.length) {
      this.scrollPos = 0;
      this.currentScrollIndex += 1;
      this.currentPos = rightScrollPos;
      if (this.currentScrollIndex >= scrollTexts.length){
        this.currentScrollIndex = 0;
      }
      this.currentScrollText = scrollTexts[this.currentScrollIndex].text;
      this.currentSpeed = scrollTexts[this.currentScrollIndex].speed;
      this.currentPause = scrollTexts[this.currentScrollIndex].pause;
    }
  }

  createLetter(letter, posX) {
    let textGeo = new TextGeometry(letter, {
      font: this.font,
      size: 0.5,
      height: 0.1,
      curveSegments: 12,
      bevelEnabled: false,
      bevelThickness: 10.0,
      bevelSize: 1.0,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    let mesh3 = new THREE.Mesh(textGeo, this.textMaterial);
    mesh3.position.x = posX;
    mesh3.position.y = 1.4;
    mesh3.position.z = 2;
    mesh3.castShadow = true;
    mesh3.receiveShadow = false;
    textGeo.computeBoundingBox();
    let offsetX = textGeo.boundingBox.max.x;
    mesh3.customDepthMaterial = this.shadowMaterial;
    this.scene.add(mesh3);
    return [mesh3, offsetX];
  }

  removeObj(obj) {
    if (obj.mesh) {
      if (!obj.mesh.parent) console.log(obj);
      obj.mesh.parent.remove(obj.mesh);
      obj.mesh.geometry.dispose();
      obj.mesh.material.dispose();
      obj = undefined;
    }
  }

  debug() {
    console.log("scolling debug");
    console.log("length ", this.listLetterMeshes.length);
    this.listLetterMeshes.forEach((i) => console.log(i[0].position.x));
    console.log("currentPos ", this.currentPos);
  }
}
