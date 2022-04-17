//https://enable3d.io/docs.html

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Scene3D,
  PhysicsLoader,
  Project,
  ExtendedObject3D,
  ThirdPersonControls,
} from "enable3d";
import * as THREE from "three";
import { updateStatus, getGlobalStick } from "./gamepad";

function threeQuat(quat){
  return new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w)
}

function threeVector(vec){
    return new THREE.Vector3(vec.x, vec.y, vec.z);
}

function dot(v1, v2){
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

const notNullDef = (n) => {
  if (n != undefined && n != null && !isNaN(n)) {
    return true;
  }
};

const setMass = (body, mass) => {
  body['mass'] = mass;
  body.ammo.setMassProps(mass, new threeVector(0,0,0));
  body.ammo.getCollisionShape().calculateLocalInertia( mass, new threeVector(0,0,0))
};

const getMass = (body) => {
  return body.mass;
  // console.log( body.ammo);
  // console.log( body.ammo.getCenterOfMassTransform().getOrigin());
  // console.log( body.ammo.getCenterOfMassTransform());
  // console.log( body.ammo.setMassProps(.01, new threeVector(0,0,0)));
  // console.log( body.ammo.setDamping);
};

let zeroOut = (x) =>{
  if(!notNullDef(x)){
    return 0;
  } else {
    return x;
  }
}
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
    ctrl: false,
  };

  brakeDirection = new THREE.Vector3(0, 0, 0);
  setVel = false;

  lastVel = {};
  lastAngVel = {};
  forwardMult = 0;
  dirMult = 0;

  constructor() {
    super();
  }

  async init() {
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  async preload() {}

  async create() {
    // set up scene (light, ground, grid, sky, orbitControls)
    // const { lights, camera, orbitControls } = await this.warpSpeed('ground', '-orbitControls');
    this.warpSpeed();

    // position camera

    // enable physics debug
    if (this.physics.debug) {
      this.physics.debug.enable();
    }

    const box = this.physics.add.box(
      { x: 0, y: 2, z: -5, width: 1, height: 1, depth: 3, mass :1, collisionFlags: 0 },
      { lambert: { color: 'red', transparent: true, opacity: 0.5 } }
    );

   const vert1 = this.physics.add.box(
        { x: 5, y: 2, z: -5, width: .5, height: .5, depth: .5, mass :0, collisionFlags: 6 },
        { lambert: { color: 'red', transparent: true, opacity: 0 } }
    )

    let c2 = this.add.box(
      { x: 1, y: 0, z: 0, mass: 5, collisionFlags: 0 },
      { lambert: { color: 'red', transparent: true, opacity: 0.0} 
    });
    
    this.scene.vertex = vert1;

    let startRot = THREE.MathUtils.degToRad(90);
    startRot = 0;

    // let group2 = new THREE.Group();
    let group = new THREE.Group();

    // group2.position.x = 0;
    // group2.position.y = 2;
    // group2.position.z = -5;

    group.position.z = 20;
    group.position.y = 2; 

    this.add.existing(group);
    // this.add.existing(group2);
    group.add(c2);
    group.add(this.camera)
    c2.add(vert1);
    // group.add(vert1);
    this.physics.add.existing(group);
    // this.scene.add(vert1);



    const press = (e, isDown) => {
      e.preventDefault();
      const { code } = e;
      switch (code) {
        case "KeyW":
          this.keys.w = isDown;
          break;
        case "KeyA":
          this.keys.a = isDown;
          break;
        case "KeyS":
          this.keys.s = isDown;
          break;
        case "KeyD":
          this.keys.d = isDown;
          break;
        case "KeyQ":
          this.keys.q = isDown;
          break;
        case "KeyE":
          this.keys.e = isDown;
          break;
        case "KeyZ":
          this.keys.z = isDown;
          break;
        case "KeyC":
          this.keys.c = isDown;
          break;
        case "CapsLock":
          this.keys.caps = isDown;
          break;
        case "ShiftLeft":
          this.keys.lshift = isDown;
          break;
        case "ControlLeft":
          this.keys.ctrl = isDown;
          break;
        case "Space":
          this.keys.space = isDown;
          break;
      }
    };

    document.addEventListener("keydown", (e) => press(e, true));
    document.addEventListener("keyup", (e) => press(e, false));

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
  

  update(var1, var2) {
    const stick = getGlobalStick();
    const turnForce = 0.25;
    const angularBrakeForce = 0.5;
    const linearBrakeForce = 0.01;
    const group = this.scene.children[6];
    const eRot = group.rotation;
    const matRot = group.matrix;
    const YAW = 0;
    const PITCH = 1;
    const ROLL = 5;
    let forwardForce = 12;
    let throttle = stick[6]; //for some reason up is negative
    let body = group.body;

    if (throttle == undefined || throttle == null || throttle == NaN) {
      throttle = 0;
    } else
    throttle *= -1;

    //this code will fix the issue of the object moving too fast through other objects
// // Enable CCD if the object moves more than 1 meter in one simulation frame
// object.body.setCcdMotionThreshold(1)

// // Set the radius of the embedded sphere such that it is smaller than the object
// object.body.setCcdSweptSphereRadius(0.2)


    // //the angles i need
    let x = eRot.x;
    let y = eRot.y;
    let z = eRot.z;
    x = THREE.MathUtils.radToDeg(x);
    y = THREE.MathUtils.radToDeg(y);
    z = THREE.MathUtils.radToDeg(z);
    x = x / 90;
    y = y / 90;
    z = z / 90;
    x = parseFloat(x).toFixed(15);
    y = parseFloat(y).toFixed(15);
    z = parseFloat(z).toFixed(15);

    let appliedTorque;
    const tx = stick[PITCH] * turnForce;
    const ty = -stick[YAW] * turnForce;
    const tz = -stick[ROLL] * turnForce;

    // const tx = stick[YAW] * turnForce;
    // const ty = stick[PITCH] * turnForce;
    // const tz = -stick[ROLL] * turnForce;
    appliedTorque = new THREE.Vector3(tx, ty, tz);

    const quat = group.quaternion;
    const angVel = body.ammo.getAngularVelocity();

		let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
		let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
		let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    
    const aFact = body.ammo.getAngularFactor();
 
    var anchorPos = new THREE.Vector3().copy(group.position);
    let anchorRot = group.rotation;
    let dragForce = new THREE.Vector3(0, 0, 0);
    let dragMult = new THREE.Vector3(0, 0, 0);
    let totalForce = new THREE.Vector3(0, 0, 0);
    let aDamp = 0;
    let lDamp = 0;
    let mass = 1;
    let ax = angVel.x();
    let ay = angVel.y();
    let az = angVel.z();
    let angularSpeed;
		let currentSpeed;
		let maxCurSpeed = 1000;
    let vel = body.velocity; 
    let radius;
    let upAcc;
    let velSquared;
    let vertPos = new THREE.Vector3(0, 0, 0);
    let acc = new THREE.Vector3(0, 0, 0);
    let minInputStrength = .0125;
     
		setMass(body, mass); //huh? why is the mass changing
 
    let turnX = tx/Math.abs(tx);
    let turnY = ty/Math.abs(ty);
    let changeVel;
    let changeAngVel;

    let cForce;
    let vert = this.scene.vertex;
    let groupPos = group.position; 
    
    let lastSpeed = Math.sqrt((this.lastVel.x * this.lastVel.x) + (this.lastVel.y * this.lastVel.y) + (this.lastVel.z * this.lastVel.z));
    let lastAngSpeed = Math.sqrt((this.lastAngVel.x* this.lastAngVel.x) + (this.lastAngVel.y *this.lastAngVel.y) + (this.lastAngVel.z * this.lastAngVel.z));

    currentSpeed = Math.sqrt((vel.x * vel.x) + (vel.y * vel.y) + (vel.z * vel.z));

  
    if(isNaN(currentSpeed)){
      currentSpeed = 0;
    }
    
    angularSpeed = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    radius = Math.abs(currentSpeed/angularSpeed); 
    
    acc.x = (this.lastVel.x - vel.x)/var2;
    acc.y = (this.lastVel.y - vel.y)/var2;
    acc.z = (this.lastVel.z - vel.z)/var2;

    // currentSpeed = dot( vel, forward);
    // // currentSpeed = dot( vel, vel );
    // angularSpeed = dot( av, av );
    // radius = 5;

    changeVel = Math.abs(currentSpeed - lastSpeed);
    changeAngVel = Math.abs(angularSpeed - lastAngSpeed);

    if (this.keys.space) {
      forwardForce *= 3;
    }
  
    const increaseForwardForce = () => {
      this.forwardMult *= 1.005;

      if(this.forwardMult >= 2){
        this.forwardMult = 2;
      } else if (this.forwardMult == 0 ){
        this.forwardMult = .5;
      }
    }

    if (this.keys.w) {
      increaseForwardForce();
      this.dirMult = 1;
    } else if (this.keys.s) { 
      increaseForwardForce();
      this.dirMult = -1;
    } else {
      this.forwardMult *= .9925;

      if(this.forwardMult <= .1){
        this.forwardMult = 0;
      }
    }

    vert.body.checkCollisions = false;
    

    if(currentSpeed > maxCurSpeed){
      currentSpeed = maxCurSpeed;
    }
    if(isNaN(radius)){
      radius = 0;
    }
    if(!notNullDef(upAcc)){
      upAcc = 0;
    }
    if(!notNullDef(radius)){
      radius = 0;
    } else if (!isFinite(radius)) {
      radius = currentSpeed;
    }
    if(radius == 0){
      // currentSpeed = maxCurSpeed;
      cForce = 0;
    } else {
      cForce = (currentSpeed)/radius;
    }
    if(isNaN(cForce)){
      cForce = 0;
    }
    if(isNaN(turnY) || Math.abs(tx) < minInputStrength){
      turnY = 0;
    }

    if(isNaN(turnX) || Math.abs(tx) < minInputStrength){
      turnX = 0;
    }

    // let combo = new THREE.Vector3();
    // combo.x = Math.sqrt((Math.abs(up.x) + Math.abs(right.x)) /2);
    // combo.y = Math.sqrt((Math.abs(up.y) + Math.abs(right.y)) /2);
    // combo.z = Math.sqrt((Math.abs(up.z) + Math.abs(right.z)) /2);
  
    // groupPos.x += up.x * radius * turnX;
    // groupPos.y += up.y * radius * turnX;
    // groupPos.z += up.z * radius * turnX;
    let lAccel = changeVel/var2;

    acc.x = zeroOut(acc.x);
    acc.y = zeroOut(acc.y);
    acc.z = zeroOut(acc.z);

    vertPos.x += this.dirMult * right.x * radius * turnY;
    vertPos.y += this.dirMult * right.y * radius * turnY;
    vertPos.z += this.dirMult * right.z * radius * turnY;

    groupPos.x += vertPos.x;
    groupPos.y += vertPos.y;
    groupPos.z += vertPos.z;

    forwardForce *= this.forwardMult;

		totalForce.x = (this.dirMult * (forwardForce * forward.x) * -.15);
		totalForce.y = (this.dirMult * (forwardForce * forward.y) * -.15);
		totalForce.z = (this.dirMult * (forwardForce * forward.z) * -.15);

    totalForce.x += ( vertPos.x * cForce * .015);
    totalForce.y += ( vertPos.y * cForce * .015); 
    totalForce.z += ( vertPos.z * cForce * .015); 

    vert.position.set(groupPos.x, groupPos.y, groupPos.z);
    vert.body.needUpdate = true;

    let backward = {};
    let backwardForce = {};
    let velDir = {};
    let inertia = {};
    
    backward.x = forward.x;
    backward.y = forward.y;
    backward.z = forward.z;

    velDir.x = Math.abs(vel.x)/vel.x;
    velDir.y = Math.abs(vel.y)/vel.y;
    velDir.z = Math.abs(vel.z)/vel.z;
    
    backward.x = 1 - Math.abs(backward.x);
    backward.y = 1 - Math.abs(backward.y);
    backward.z = 1 - Math.abs(backward.z);

    //get current acceleration on the frame
    //stop applying force in directions not facing movement vector
    //apply deceleration in directions not faacing movement vector 

    inertia.x =  vel.x / currentSpeed;
    inertia.y =  vel.y / currentSpeed;
    inertia.z =  vel.z / currentSpeed;
    
    if(isNaN(inertia.x)){
      inertia.x = 0;
    }
    
    if(isNaN(inertia.y)){
      inertia.y = 0;
    }
    
    if(isNaN(inertia.z)){
      inertia.z = 0;
    }
    
    backwardForce.x = inertia.x * .085 * currentSpeed;
    backwardForce.y = inertia.y * .085 * currentSpeed;
    backwardForce.z = inertia.z * .085 * currentSpeed;
        
    totalForce.x -= backwardForce.x;
    totalForce.y -= backwardForce.y;
    totalForce.z -= backwardForce.z; 

    body.setRestitution(1);

    // console.log( Math.abs(forward.x) + Math.abs(forward.z) );
    // console.log( Math.pow(forward.x, 2) + Math.pow(forward.z, 2));
    // console.log( backwardForce.x, backwardForce.y, backwardForce.z);
    // console.log( inertia )
    // console.log( Math.pow(forward.x, 2) + Math.pow(forward.z, 2) );

    aDamp = .99;
    if (this.keys.lshift) {
      // console.log( forward.x, forward.y, forward.z, y )

      // if(.50 - Math.abs(y) < .005 ){
        aDamp = 21;
      // }
      
      if (this.setVel == false) {
        //drift
        this.setVel = true;
      } else {
      }
      // group.body.ammo.setDamping(.5, .5);
      // group.body.setAngularFactor(0, 0 , 0);
    } else {
      this.setVel = false;
    }

    appliedTorque['x'] *= 4;
    appliedTorque['y'] *= 2;
    appliedTorque['z'] *= 6; 

    console.log(appliedTorque);

    if (
      notNullDef(appliedTorque["x"]) &&
      notNullDef(appliedTorque["y"]) &&
      notNullDef(appliedTorque["z"])
    ) {
      // group.body.applyLocalTorque(
      //   0,
      //   appliedTorque["y"],
      //   0,
      // );
      group.body.applyLocalTorque(
        appliedTorque["x"],
        appliedTorque["y"],
        appliedTorque["z"],
      );
    }


    if (this.keys.ctrl) {
    } else {
    }
    
    // group.body.setLinearFactor(1, 1, 1);
    // group.body.setAngularFactor(.5, .5, .5);
    group.body.ammo.setDamping( 0, aDamp);
    // group.body.setVelocity(totalForce.x, totalForce.y, totalForce.z);
    group.body.applyForce(totalForce.x, totalForce.y, totalForce.z);

    this.lastVel = vel;
    this.lastAngVel= {};
    this.lastAngVel.x = ax;
    this.lastAngVel.y = ay;
    this.lastAngVel.z = az;

    // this.camera.rotation.set(anchorRot.x, anchorRot.y, anchorRot.z);
    this.camera.position.set(0, 0, .5);
    // this.camera.position.set(0.25, 20, 30);
    // this.camera.position.set(0.25, 100, 30);
    
    var mat = group.matrix;
  }
}

// set your project configs
const config = {
  scenes: [ThreePhysicsComponent],
  antialias: true,
  gravity: { x: 0, y: 0, z: 0 },
  maxSubSteps: 4,
  fixedTimeStep: 1 / 120,
};
PhysicsLoader("/ammo", () => new Project(config));
