var THREE;
export default class snake {
  constructor(_THREE, scene) {
    THREE = _THREE;
    this.scene = scene;
    this.listObj = {};
    this.lastDirection = { DX: 1, DY: 0 };
    [this.lastX, this.lastY] = [0, 0];
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

  }
}