//https://enable3d.io/docs.html

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Scene3D, PhysicsLoader, Project, ExtendedObject3D, ThirdPersonControls} from 'enable3d';
import * as THREE from 'three';
import {updateStatus, getGlobalStick} from "./gamepad";
export class ThreePhysicsComponent extends Scene3D {
  keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
    z: false,
    c: false,
    caps: false,
    lshift: false,
    space: false,
    ctrl: false
  }

  brakeDirection = new THREE.Vector3(0, 0, 0);
  setVel = false;
  

  constructor() {
    super()
  }

  async init() {
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  async preload() {

  }

  async create() {
    // set up scene (light, ground, grid, sky, orbitControls)
    // const { lights, camera, orbitControls } = await this.warpSpeed('ground', '-orbitControls');
    this.warpSpeed()

    // position camera
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, 110);
    // orbitControls.target.set(0, 5, 0);

    //this.haveSomeFun()
    // enable physics debug
    if (this.physics.debug) {
      this.physics.debug.enable()
    }
    
    // const box = this.physics.add.box(
    //   { x: 1, y: 2, z: 10, width: 5, height: 3, depth: 1, mass: 2, collisionFlags: 0 },
    //   { lambert: { color: 'red', transparent: true, opacity: 0.5 } }
    // )

    const startRot = THREE.MathUtils.degToRad(90);

    let group = new THREE.Group()
    group.position.z = 20
    group.position.y = 2
    group.rotation.z -= (startRot);

    // THREE.radToDeg(group);
    
    // let c1 = this.add.box({ x: 1, y: 0, z: -1 })
    let c2 = this.add.box({ x: 1, y: 0, z: 0 })
    this.add.existing(group)
    // group.add(c1)
    group.add(c2)
    group.add(this.camera)
    this.physics.add.existing(group);

    const press = (e, isDown) => {
      e.preventDefault()
      const { code } = e;
      switch (code) {
        case 'KeyW':
          this.keys.w = isDown;
          break;
        case 'KeyA':
          this.keys.a = isDown;
          break;
        case 'KeyS':
          this.keys.s = isDown;
          break;
        case 'KeyD':
          this.keys.d = isDown;
          break;
        case 'KeyQ':
          this.keys.q = isDown;
          break;
        case 'KeyE':
          this.keys.e = isDown;
          break;
        case 'KeyZ':
          this.keys.z = isDown;
          break;
        case 'KeyC':
          this.keys.c = isDown;
          break;
        case 'CapsLock':
          this.keys.caps = isDown;
          break;
        case 'ShiftLeft':
          this.keys.lshift = isDown;
          break;
        case 'ControlLeft':
          this.keys.ctrl = isDown;
          break;
        case 'Space':
          this.keys.space = isDown;
          break;
      }
    }

    document.addEventListener('keydown', e => press(e, true))
    document.addEventListener('keyup', e => press(e, false))

    // this.controls = new ThirdPersonControls(this.camera, c1, {
    //   offset: new THREE.Vector3(0, 1, 0),
    //   targetRadius: 3
    // })

    // // set initial view to 90 deg theta
    // this.controls.theta = 90

    // /**
    //  * Add Pointer Lock and Pointer Drag
    //  */
    // if (!isTouchDevice) {
    //   let pl = new PointerLock(this.canvas)
    //   let pd = new PointerDrag(this.canvas)
    //   pd.onMove(delta => {
    //     if (pl.isLocked()) {
    //       this.controls.update(delta.x * 2, delta.y * 2)
    //     }
    //   })
    // }
  }


  update() {
    // const pos = this.scene.children[5].body.position;
    // console.log(pos);
    // this.camera.lookAt(pos[0], pos[1], pos[2]);

    const stick = getGlobalStick();
    const turnForce = .25;
    const angularBrakeForce = .5;
    const linearBrakeForce = .01;
    const group = this.scene.children[5];
    const eRot = group.rotation;
    const matRot = group.matrix;
    const YAW = 0;
    const PITCH = 1;
    const ROLL = 5;
    let forwardForce = 2;
    let throttle = stick[6]; //for some reason up is negative

    if(throttle == undefined || throttle == null || throttle == NaN){
      throttle = 0;
    }

    throttle*=-1;

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

    // THREE.Vector4.applyMatrix4();
    // const Axis = THREE.Euler.setFromRotationMatrix();
    // const axis = new THREE.Vector4().setAxisAngleFromRotationMatrix(matRot);
    
    // //the angles i need
    let x = eRot.x;
    let y = eRot.y;
    let z = eRot.z;
    x = THREE.MathUtils.radToDeg(x);
    y = THREE.MathUtils.radToDeg(y);
    z = THREE.MathUtils.radToDeg(z);
    x = (x/90);
    y = (y/90);
    z = (z/90); 
    x = parseFloat(x).toFixed(15);
    y = parseFloat(y).toFixed(15);
    z = parseFloat(z).toFixed(15);

    // console.log(x, y, z);
    // console.log(stick[YAW] + " " + stick[PITCH] + " " + stick[ROLL]);
    // stick[YAW] = 0;
    // stick[PITCH] = 0;
    // stick[ROLL] = 0;

  let appliedTorque;
  const tx = stick[YAW] * turnForce;
  const ty = stick[PITCH] * turnForce;
  const tz = -stick[ROLL] * turnForce;
  appliedTorque = new THREE.Vector3(tx, ty, tz);

  const notNullDef = (n)=>{
    if((n !=undefined) && (n !=null) && !isNaN(n)){
      return true;
    };
  };
  
  const v = group.body;
  const angVel = group.body.angularVelocity;
  const linVel = group.body.velocity;
  group.body.setLinearFactor(1, 1 , 1);
  group.body.setAngularFactor(1, 1 , 1);
  

  if (this.keys.lshift) {
    if(this.setVel == false){
      this.brakeDirection['x'] = x;
      this.brakeDirection['y'] = y;
      this.brakeDirection['z'] = z;
      this.setVel = true;
    } else {

    }
    let brakeVel = new THREE.Vector3(0, 0, 0);
    // brakeVel['x'] = this.brakeDirection['x'] - x;
    // brakeVel['y'] = this.brakeDirection['y'] - y;
    // brakeVel['z'] = this.brakeDirection['z'] - z;

    console.log(x);
    // console.log(brakeVel);
    
    group.body.applyLocalTorque( brakeVel['x'] * angularBrakeForce, 
                                 brakeVel['y'] * angularBrakeForce, 
                                -brakeVel['z'] * angularBrakeForce);

    // group.body.setAngularFactor(0, 0 , 0);
  } else {
    if(notNullDef(appliedTorque['x']) && notNullDef(appliedTorque['y']) && notNullDef(appliedTorque['z'])){
      group.body.applyLocalTorque(appliedTorque['x'] * turnForce, appliedTorque['y'] * turnForce, appliedTorque['z'] * turnForce);
    }
    this.setVel = false;
  }

  if (this.keys.ctrl) {
    group.body.applyForce(linearBrakeForce * -linVel['x'], linearBrakeForce *  -linVel['y'], linearBrakeForce * -linVel['z'] );
    group.body.setLinearFactor(0, 0 , 0);
  } else {
  }

  var anchorPos = new THREE.Vector3().copy( group.position );
  let anchorRot = group.rotation;

  this.camera.position.set(.25, 0, .5);
  this.camera.rotation.set(0, 0, 3.14/2);
  var mat = group.matrix;
    
  //https://threejs.org/docs/#api/en/core/Object3D
  // console.log(group.getWorldDirection(v));
  // console.log(group.rotation);

  if (this.keys.space) {
    forwardForce *= 3;
  }

  if (this.keys.w) {
    // console.log(group);
    // console.log(group.setRotationFromEuler(vec3)); //main function I need
    // console.log(group.rotateOnAxis(vec3)); //localRot
    // console.log(group.rotateOnWorldAxis(vec3)); //localRot
    // console.log(group.rotation);
    // console.log(group.quaternion);
    // console.log(group.worldToLocal);
    // console.log(group.matrix); //localRot
    // console.log(group.matrixWorld); //globalRot
    // console.log(group.localToWorld(vec3)); //localRot
    // console.log(group.setRotationFromAxisAngle(vec3)); //localRot
    // console.log(group.body); //globalRot
      
    group.body.applyCentralLocalForce(0, 0 , (throttle +1 ) * -forwardForce);
  } else if (this.keys.s) {
    group.body.applyCentralLocalForce(0, 0 , throttle * -forwardForce);
  } else {
  } 

  // this.camera.rotation.set(anchorRot.x, anchorRot.y, anchorRot.z);

  }
}

// set your project configs
const config = { scenes: [ThreePhysicsComponent], antialias: true, gravity: { x: 0, y: 0, z: 0 },  maxSubSteps: 4, fixedTimeStep: 1 / 120 }
PhysicsLoader('/ammo', () => new Project(config))
