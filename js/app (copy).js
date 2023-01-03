"use strict";
import * as THREE from './three/three.module.js';
import {OrbitControls} from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import {TextGeometry} from './three/TextGeometry.js';
import { FontLoader } from './three/FontLoader.js';
import { fragment } from './shaders/fragment.js';
import { vertex } from './shaders/vertex.js';
import { shadowFragment } from './shaders/shadows.js';
import { shadowVertex } from './shaders/shadows.js';
import { setupGame, playGame } from './wasm/launchGame.js';
import { wasmLoaded } from './wasm/initWsm.js';
import { Vector3,Box3 } from './three/three.module.js';
import { Stats } from './three/stats.module.js'

const scrollText = "****  Welcome on board with Amari MECHERI's 3D Snake Game and Circle Scrolling :)  ****     "+
" This demo is built with ThreeJS, JavaScript, WebAssembly and Pixel Shaders for the scrolling effects."+
" //// The WebAssembly part holds the Snake Game logic which was developed with Go \\\\\\\\"+
" At first the aim was to develop the scrolling but since I already had the Snake files from my other demos, I included them. "+
" >>>> amari.mecheri@gmail.com <<<<     1+1 = 2  but  2+2 != 1      ";
const leftScrollPos = -13.0;
const rightScrollPos = 13.0;

export default class demo{
    constructor(options){
        this.stats = this.createStats();
        document.body.appendChild( this.stats.domElement );

        this.container = options.dom;
        this.scene = new THREE.Scene();
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        console.log(this.width," ",this.height);
        this.camera = new THREE.PerspectiveCamera( 70, 
            this.width / this.height, 0.01, 50 );
        this.camera.position.z = 8.8;
        this.camera.position.y = 0.4;

        this.renderer = new THREE.WebGLRenderer( { antialias: false } );
        this.renderer.setSize( this.width, this.height );
        this.container.appendChild( this.renderer.domElement );
    }
    render2(){
        var time =Date.now();
        this.renderer.render( this.scene, this.camera );
        window.requestAnimationFrame(this.render2.bind(this))
        this.stats.update();
        console.log(Date.now()-time);
    }
    createStats = () => {
        var stats = new Stats();
        stats.setMode(0);
  
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0';
        stats.domElement.style.top = '0';
  
        return stats;
    }
    construct(options){
        this.time = 0.;
        this.clock = new THREE.Clock();
        this.stats = this.createStats();
        document.body.appendChild( this.stats.domElement );
        this.scrollPos = -1;
        this.listObj = {};
        this.lastDirection = {"DX": 1, "DY": 0 };
        [this.lastX,this.lastY] = [0,0];
        this.listLetterMeshes = [];
        this.container = options.dom;
        this.scene = new THREE.Scene();
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.textureLoader = new THREE.TextureLoader();
        this.sphereGeo = new THREE.SphereGeometry(0.1);
        this.snakeTexture = this.textureLoader.load('../img/gold_snake_skin.jpeg');
        this.snakeTexture.center.set(.5, .5);
        this.snakeTexture.repeat.set(0.25, 0.25);
        this.snakeTexture.rotation = Math.PI/2.;
        this.sphereMat = new THREE.MeshStandardMaterial({map: this.snakeTexture});
        this.cylinderGeo = new THREE.CylinderGeometry(0.1,0.1,0.2);
        this.coneGeo = new THREE.CylinderGeometry(0.1,0.,0.2);
        this.snakeHeadGeo = new THREE.DodecahedronGeometry(0.1);


        this.cylinderMat = new THREE.MeshStandardMaterial({map: this.snakeTexture});

        // let angle = new THREE.Vector2(1,-1).angle()-1.25*Math.PI;
        // this.torus(26,25,angle); // -0.5PI (1,0) (0,-1)    0   1.5PI  = 0.5 PI
        // angle = new THREE.Vector2(1,1).angle()-1.25*Math.PI;
        // this.torus(26,26,angle); // 0.5PI (1,0) (0,1)       0   PI/2  = PI
        // angle = new THREE.Vector2(-1,-1).angle()-1.25*Math.PI;
        // this.torus(24,25,angle); // 0.5PI (-1,0) (0,-1)           PI  1.5PI = 0
        // angle = new THREE.Vector2(-1,1).angle()-1.25*Math.PI;
        // this.torus(24,26,angle); // -05PI (-1,0) (0,1)   PI  PI/2 = -0.5 PI ou 1.5PI

        this.camera = new THREE.PerspectiveCamera( 70, 
            this.width / this.height, 0.01, 200 );
        this.camera.position.z = 8.8;
        this.camera.position.y = 0.4;

        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setSize( this.width, this.height );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.container.appendChild( this.renderer.domElement );
        this.scene.castShadow = true;
        //var ambientLight = new THREE.AmbientLight( 0xffffff, 1.0 );
        //this.scene.add( ambientLight );
        // const loader = new GLTFLoader();
        // loader.load( '../img/snakeHead4.glb', (function ( gltf ) {
        //     //console.log(gltf.scene);
	    //     this.snakeHeadMesh=gltf.scene.children[0];
        //     this.snakeHeadMesh.geometry.computeBoundingBox();
        //     // let bx = new Box3()
        //     // let ax = bx.setFromObject(this.snakeHeadMesh);
        //     // let sz = ax.getSize(new Vector3()) 
        //     //console.log(sz);
        //     //this.snakeHeadMesh.scale.set(0.2/sz.x, 0.2/sz.y, 0.2/sz.z ); //{ x: 0.009523809523809525, y: 0.013203081603799393, z: 0.006666666666666667 }
        //     console.log(this.snakeHeadMesh);
        //     //this.snakeHeadMesh.position.y = 0.1;
        //     this.snakeHeadMesh.rotateY(Math.PI/2.);
        //     //this.snakeHeadMesh.scale.set(0.2, 0.2, 0.2 );
        //     //this.scene.add(this.snakeHead);
        //     let snakeHeadMesh = this.snakeHeadMesh.clone();        
        //     snakeHeadMesh.material = this.cylinderMat;
        //     snakeHeadMesh.position.x = -5.0 + 0.1 + 0.2 * 25;
        //     snakeHeadMesh.position.z = -5.0 +0.15 + 0.2 * 25;
        //     snakeHeadMesh.position.y = 0.1;
        //     snakeHeadMesh.castShadow = true;
        //     snakeHeadMesh.receiveShadow = true;
        //     snakeHeadMesh.rotateZ(Math.PI / 2.0);
    
        //     snakeHeadMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0), new Vector3(1, 0, 0), Math.PI / 4.);
        //     this.scene.add(snakeHeadMesh);   
        // }).bind(this), undefined, function ( error ) {
        //     console.error( error );
        // } );
        this.addObjects();
        wasmLoaded(()=>{setupGame(this.deleteTail, this.candy, this.snakePart)});

        this.controls = new OrbitControls(this.camera,this.renderer.domElement);
        this.loader = new FontLoader();
        this.loader.load( 'js/three/fonts/helvetiker_bold.typeface.json',(font)=>{
            this.font = font;
            this.setFontMaterial();
        });
        this.setupResize();
        //this.controls = new DragControls(this.ground, this.camera, this.renderer.domElement)
        //console.log(this.listObj);
        this.render();    
    }

    torus(x,y,angle){
        let torusGeo = new THREE.TorusGeometry(0.1, 0.1, 16,100, Math.PI/2);
        torusGeo.center();
        torusGeo.computeBoundingBox();
        torusGeo.rotateY(-Math.PI/2.);
        // console.log("xy: ",new THREE.Vector2(1,1).angle()/Math.PI); // 0 //0.25
        // console.log("-xy: ",new THREE.Vector2(-1,1).angle()/Math.PI); // PI //0.75
        // console.log("-x-y: ",new THREE.Vector2(-1,-1).angle()/Math.PI); // PI/2 //1.25
        // console.log("x-y: ",new THREE.Vector2(1,-1).angle()/Math.PI); // 1.5PI //1.75
        //this.torusGeo.rotateX(new THREE.Vector2(0,-1).angle() -new THREE.Vector2(-1,0).angle());
        torusGeo.rotateX(angle);
        let torusMesh = new THREE.Mesh( torusGeo, this.cylinderMat );
        torusMesh.position.x = -5.0+0.1+0.2*x;
        torusMesh.position.z = -5.0+0.1+0.2*y;
        torusMesh.position.y = 0.1; 
        torusMesh.rotateZ(Math.PI/2.0);
        //torusMesh.rotateX(-this.lastDirection.DY*Math.PI/2.0);

        torusMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0),new Vector3(1, 0, 0),Math.PI / 4.);
        this.scene.add( torusMesh );
        return torusMesh;
    }

    setupResize(){
        window.addEventListener('resize',this.resize.bind(this));
    }

    resize(){
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize( this.width, this.height );
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix(); 
    }

    render(){
        var timeStamp = this.clock.getDelta();
        if(timeStamp<1.){
            this.time += .5*timeStamp;
            this.scroll(this.time, timeStamp);
            playGame();    
        } else console.log(timeStamp);
        this.renderer.render( this.scene, this.camera );
        this.stats.update();
        window.requestAnimationFrame(this.render.bind(this))
    }

    setFontMaterial(){
        this.textMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: {value:0.},
                r: {value:0.},
                p: {value:0.},
                m: {value:0.},
                hPI: {value:Math.PI/2.},
                PI: {value:Math.PI},
                PIop: {value:0.},
            },
            side: THREE.DoubleSide,
            fragmentShader: fragment,
            vertexShader: vertex,
            wireframe: false,
        });
        this.shadowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: {value:0},
            },
            fragmentShader: shadowFragment,
            vertexShader: shadowVertex,
        });

    }

    addObjects(){
        this.directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
        this.directionalLight.castShadow = true;
        // //this.directionalLight.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 10, 2500 ) );
        this.directionalLight.shadow.bias = 0.0001;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.position.set(0,6,6);
        //this.directionalLight.target.position.set(0,0,0);
        this.scene.add( this.directionalLight );

        this.ground();
    }

    ground = () => {        
     
        // const material = new THREE.MeshBasicMaterial({
        //   color: 0xFF8844,
        //   map: loader.load('resources/images/wall.jpg'),
        // });
        let groundGeo = new THREE.PlaneBufferGeometry( 10,10,50,50);
        let groundMat = new THREE.MeshStandardMaterial({color: 0x12AB32,map: this.textureLoader.load('../img/grass.jpeg')});
        // groundMat = new THREE.ShaderMaterial({
        //     uniforms: {
        //         time: {value:0},
        //     },
        //     side: THREE.DoubleSide,
        //     fragmentShader: oceanFragment,
        //     vertexShader: oceanVertex,
        //     wireframe: false,
        // });

        let groundMesh = new THREE.Mesh( groundGeo, groundMat );
        groundMesh.rotateX(-Math.PI/4);
        //groundMesh.rotateX(-Math.PI/2);
        groundMesh.receiveShadow = true;
        this.scene.add( groundMesh );
        return groundMesh;
    }

    getId = (x,y) => {
        return "spot"+x.toString().padStart(2,"0")+y.toString().padStart(2,"0");
    }

    addToListObj(x, y, obj) {
        obj.name=this.getId(x, y);
        if(this.listObj[obj.name])
            this.removeObj(this.listObj[obj.name]);
        this.listObj[obj.name] = obj;
    }

    deleteTail = (x,y) => {
        this.deleteObj(x,y);
        if( SnakeSize() > 2 ){
            let tail = JSON.parse(SnakeTail());
            let xy = this.getId(tail.X,tail.Y);
            let direction = this.listObj[xy].direction
            this.deleteObj(tail.X,tail.Y);
            this.cone(tail.X,tail.Y,direction);
        }
    }

    deleteObj = (x,y) => {
        let xy = this.getId(x,y);
        let obj = this.listObj[xy];
        if(obj){
            this.removeObj(obj);
            delete this.listObj[xy];
        }
    }

    removeObj = (obj) => {
        if(obj.mesh) {
            if(!obj.mesh.parent)
                console.log(obj);
            obj.mesh.parent.remove(obj.mesh);
            obj.mesh.geometry.dispose();
            obj.mesh.material.dispose();
            obj = undefined;
        }
    }

    snakePart = (x,y, direction) => {
        //console.log(this.lastDirection," ", direction);
        if( SnakeSize()>1){
            if (JSON.stringify(this.lastDirection) !== JSON.stringify(direction)){
                //let torusMesh = new THREE.Mesh( this.torusGeo, this.cylinderMat );
                this.deleteObj(this.lastX,this.lastY);
                let angle = 0.;
                if(this.lastDirection.DX!=0)
                    angle = new THREE.Vector2(this.lastDirection.DX+direction.DX,this.lastDirection.DY+direction.DY).angle()-1.25*Math.PI;
                else
                    angle = new THREE.Vector2(this.lastDirection.DX+direction.DX,this.lastDirection.DY+direction.DY).angle()-0.25*Math.PI;
                let torusMesh = this.torus(this.lastX, this.lastY,angle);
                this.addToListObj(this.lastX, this.lastY, {"mesh":torusMesh,"direction":direction}); 
                // torusMesh.position.x = -5.0+0.1+0.2*this.lastX;
                // torusMesh.position.z = -5.0+0.1+0.2*this.lastY;
                // torusMesh.position.y = 0.1; 
                // torusMesh.castShadow = true;
                // torusMesh.receiveShadow = true;
                // torusMesh.rotateZ(Math.PI/2.0);
                // torusMesh.rotateX(-this.lastDirection.DY*Math.PI/2.0);
        
                // torusMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0),new Vector3(1, 0, 0),Math.PI / 4.);
                // this.scene.add( torusMesh );
                // this.addToListObj(this.lastX, this.lastY, torusMesh);
            }
            else{
                this.deleteObj(this.lastX,this.lastY);
                this.cylinder(this.lastX,this.lastY, this.lastDirection);
            }
        }
        this.snakeHead(x, y, direction);    
        [this.lastX, this.lastY] = [x, y];
        this.lastDirection = direction;
    }

    cone(x, y, direction) {
        let coneMesh = new THREE.Mesh(this.coneGeo, this.cylinderMat);
        coneMesh.position.x = -5.0 + 0.1 + 0.2 * x;
        coneMesh.position.z = -5.0 + 0.1 + 0.2 * y;
        coneMesh.position.y = 0.1;
        coneMesh.castShadow = true;
        coneMesh.receiveShadow = true;
        coneMesh.rotateZ(Math.PI / 2.0);
        coneMesh.rotateX(direction.DY * Math.PI / 2.0);
        if(direction.DX==1){
            coneMesh.rotateX(direction.DX * Math.PI);
        }

        coneMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0), new Vector3(1, 0, 0), Math.PI / 4.);
        this.scene.add(coneMesh);        
        this.addToListObj(x, y, { "mesh": coneMesh, "direction": direction });
    }

    snakeHead(x, y, direction) {
        let snakeHeadMesh = new THREE.Mesh( this.snakeHeadGeo, this.cylinderMat );
        snakeHeadMesh.position.x = -5.0+0.1+0.2*x;
        snakeHeadMesh.position.z = -5.0+0.1+0.2*y;
        snakeHeadMesh.position.y = 0.1;
        snakeHeadMesh.castShadow = true;
        snakeHeadMesh.receiveShadow = true;
        snakeHeadMesh.rotateZ(Math.PI / 2.0);
        snakeHeadMesh.rotateX(direction.DY * - Math.PI / 2.0);
        if(direction.DX==-1){
            snakeHeadMesh.rotateX(direction.DX * Math.PI);
        }
        snakeHeadMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0),new Vector3(1, 0, 0),Math.PI / 4.);
        this.scene.add( snakeHeadMesh );
        this.addToListObj(x, y, {"mesh":snakeHeadMesh,"direction": direction });
    }

    cylinder(x, y, direction) {
        // if(this.helperBox)
        //     this.scene.remove( this.helperBox );
        let cylinderMesh = new THREE.Mesh(this.cylinderGeo, this.cylinderMat);
        cylinderMesh.position.x = -5.0 + 0.1 + 0.2 * x;
        cylinderMesh.position.z = -5.0 + 0.1 + 0.2 * y;
        cylinderMesh.position.y = 0.1;
        cylinderMesh.castShadow = true;
        cylinderMesh.receiveShadow = true;
        cylinderMesh.rotateZ(Math.PI / 2.0);
        cylinderMesh.rotateX(direction.DY * Math.PI / 2.0);

        cylinderMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0), new Vector3(1, 0, 0), Math.PI / 4.);
        this.scene.add(cylinderMesh);        
        this.addToListObj(x, y, { "mesh": cylinderMesh, "direction": direction });
        // let v1 = new Vector3(cylinderMesh.position.x-0.1,cylinderMesh.position.y+0.1,cylinderMesh.position.z-0.1);
        // let v2 = new Vector3(cylinderMesh.position.x+0.1,cylinderMesh.position.y+0.3,cylinderMesh.position.z+0.1);
        
        // this.bx = new Box3(v1,v2);
        // console.log(this.bx);
        // var mat4 = new THREE.Matrix4();
        // mat4.extractRotation( cylinderMesh.matrixWorld );
        // this.bx.applyMatrix4( mat4 );
        // //this.bx.rotation.copy(cylinderMesh.rotation);
        // this.helperBox = new THREE.Box3Helper( this.bx, 0xffff00 );
        // this.scene.add( this.helperBox );
    }
    
    sphere = (x,y) => {
        let sphereMesh = new THREE.Mesh( this.sphereGeo, this.sphereMat );
        sphereMesh.position.x = -5.0+0.1+0.2*x;
        sphereMesh.position.z = -5.0+0.1+0.2*y;
        sphereMesh.position.y = 0.1;        
        sphereMesh.castShadow = true;
        sphereMesh.receiveShadow = true;
        sphereMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0),new Vector3(1, 0, 0),Math.PI / 4.);
        this.scene.add( sphereMesh );
        this.addToListObj(x, y, {"mesh":sphereMesh,"direction":direction});
    }

    candy = (x,y) => {
        let candyGeo = new THREE.DodecahedronGeometry(0.1);
        let candyMat = new THREE.MeshStandardMaterial({color:0xFF70FF,metalness: 0.5, roughness: 0.5});
        let candyMesh = new THREE.Mesh( candyGeo, candyMat );
        candyMesh.position.x = -5.0+0.1+0.2*x;
        candyMesh.position.z = -5.0+0.1+0.2*y;
        candyMesh.position.y = 0.1;
        candyMesh.castShadow = true;
        candyMesh.receiveShadow = true;
        candyMesh.rotateAroundWorldAxis(new Vector3(0, 0, 0),new Vector3(1, 0, 0),Math.PI / 4.);
        this.scene.add( candyMesh );
        this.addToListObj(x, y, {"mesh":candyMesh});
    }

    afficheString = () => {
        let posX = -6.5;
        for(let i=0; i<scrollText.length; i++) {
            let [m,offsetX] = this.createLetter(scrollText.charAt(i), posX);
            posX += offsetX;
        };
    }

    scroll = (time,timeStamp) => {
        if(this.textMaterial){
            let r = 4.2;
            this.textMaterial.uniforms.time.value = time;
            //this.textMaterial.uniforms.PI.value = Math.PI;
            this.textMaterial.uniforms.r.value = r;
            this.textMaterial.uniforms.p.value = 2.*Math.PI*r;
            this.textMaterial.uniforms.m.value = Math.PI*r;
            //this.textMaterial.uniforms.hPI.value = Math.PI/2.;
            this.textMaterial.uniforms.PIop.value = Math.PI/(2.*Math.PI*r);
            this.shadowMaterial.uniforms.time.value = time;
            let pop = false;
            let currentPos = rightScrollPos;
            this.listLetterMeshes.forEach((i)=>{
                i[0].position.x += -2.*timeStamp;
                currentPos = i[0].position.x+i[0].geometry.boundingBox.max.x;
                if(i[0].position.x<leftScrollPos)
                    pop = true;        
            });
            if (pop)
                this.removeObj(this.listLetterMeshes.shift()[0]);
                
            if (currentPos <= rightScrollPos){
                this.listLetterMeshes.push(this.getNextLetter(currentPos));
            }
        }
        // this.onlyMeshes = [];
        // this.listMeshes.forEach((i)=>{
        //     this.onlyMeshes.push(i[0] );
        // });
        // if(this.onlyMeshes.length>0)
        //     this.controls = new DragControls(this.onlyMeshes, this.camera, this.renderer.domElement)
    }

    getNextLetter = (currentPos) => {
        this.scrollPos += 1;
        if( this.scrollPos >= scrollText.length)
            this.scrollPos = 0;
        let letter = scrollText.charAt(this.scrollPos);
        if(letter == ' ')
            return this.getNextLetter(currentPos+0.35);
        else {
            let newEntry = this.createLetter(scrollText.charAt(this.scrollPos),currentPos+0.05);
            newEntry[0].name= letter + currentPos.toString();
            return newEntry;
        }
    }

    createLetter = (letter,posX) => {
        let textGeo = new TextGeometry( letter, {
                font: this.font,
                size: 0.5,
                height: 0.1,
                curveSegments: 12,
                bevelEnabled: false,
                bevelThickness: 10.0,
                bevelSize: 1.0,
                bevelOffset: 0,
                bevelSegments: 5
            });
            
            let mesh3 = new THREE.Mesh( textGeo,this.textMaterial );
            mesh3.position.x = posX;
            mesh3.position.y = 1.4;
            mesh3.position.z = 2.;
            mesh3.castShadow = true;
            mesh3.receiveShadow = true;
            textGeo.computeBoundingBox();
            let offsetX = textGeo.boundingBox.max.x;
            mesh3.castShadow = true;
            mesh3.customDepthMaterial = this.shadowMaterial;
            this.scene.add( mesh3 );
        return [mesh3,offsetX];
    }

}

THREE.Object3D.prototype.rotateAroundWorldAxis = function() {

    // rotate object around axis in world space (the axis passes through point)
    // axis is assumed to be normalized
    // assumes object does not have a rotated parent

    var q = new THREE.Quaternion();

    return function rotateAroundWorldAxis( point, axis, angle ) {

        q.setFromAxisAngle( axis, angle );

        this.applyQuaternion( q );

        this.position.sub( point );
        this.position.applyQuaternion( q );
        this.position.add( point );

        return this;

    }

}();

Box3.prototype.rotateAroundWorldAxis = function() {

    // rotate object around axis in world space (the axis passes through point)
    // axis is assumed to be normalized
    // assumes object does not have a rotated parent

    var q = new THREE.Quaternion();

    return function rotateAroundWorldAxis( point, axis, angle ) {

        q.setFromAxisAngle( axis, angle );

        this.applyQuaternion( q );

        this.position.sub( point );
        this.position.applyQuaternion( q );
        this.position.add( point );

        return this;

    }

}();


let v = new demo({
    dom: document.getElementById('container')
});
v.render2();
