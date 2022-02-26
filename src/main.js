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
};

const getMass = (body) => {
  return body.mass;
  // console.log( body.ammo);
  // console.log( body.ammo.getCenterOfMassTransform().getOrigin());
  // console.log( body.ammo.getCenterOfMassTransform());
  // console.log( body.ammo.setMassProps(.01, new threeVector(0,0,0)));
  // console.log( body.ammo.setDamping);
};
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

  lastVel;

  brakeDirection = new THREE.Vector3(0, 0, 0);
  setVel = false;

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
    )


    let startRot = THREE.MathUtils.degToRad(90);
    startRot = 0;

    let group = new THREE.Group();
    group.position.z = 20;
    group.position.y = 2;
    group.rotation.z -= startRot;

    // let c1 = this.add.box({ x: 1, y: 0, z: -1, mass: 1555 });
    let c2 = this.add.box(
        { x: 1, y: 0, z: 0, mass: 5, collisionFlags: 0 },
        { lambert: { color: 'red', transparent: true, opacity: 0.25 } 
      });
      
    // console.log(c2);

    this.add.existing(group);
    // group.add(c1)
    group.add(c2);
    // group.add(this.camera);
    this.physics.add.existing(group);

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
    const group = this.scene.children[5];
    const eRot = group.rotation;
    const matRot = group.matrix;
    const YAW = 0;
    const PITCH = 1;
    const ROLL = 5;
    let forwardForce = 2;
    let upForce = 2;
    let throttle = stick[6]; //for some reason up is negative
    let body = group.body;

    if (throttle == undefined || throttle == null || throttle == NaN) {
      throttle = 0;
    } else
    throttle *= -1;
    let enginePower = throttle;

    //this code will fix the issue of the object moving too fast through other objects
// // Enable CCD if the object moves more than 1 meter in one simulation frame
// object.body.setCcdMotionThreshold(1)

// // Set the radius of the embedded sphere such that it is smaller than the object
// object.body.setCcdSweptSphereRadius(0.2)

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
    x = x / 90;
    y = y / 90;
    z = z / 90;
    x = parseFloat(x).toFixed(15);
    y = parseFloat(y).toFixed(15);
    z = parseFloat(z).toFixed(15);

    let appliedTorque;
    const tx = stick[YAW] * turnForce;
    const ty = stick[PITCH] * turnForce;
    const tz = -stick[ROLL] * turnForce;
    appliedTorque = new THREE.Vector3(tx, ty, tz);

    const quat = group.quaternion;
    const angVel = body.ammo.getAngularVelocity();
    const linVel = body.velocity;

		let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
		let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
		let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    

    // let vel = group.body.velocity; 
    // let velLength = Math.sqrt((vel.x * vel.x) + (vel.y * vel.y) + (vel.z * vel.z));
		// const currentSpeed = dot( threeVector(vel), threeVector(forward));
		// let flightModeInfluence = currentSpeed / 10;
		// flightModeInfluence = THREE.MathUtils.clamp(flightModeInfluence, 0, 1);
		// let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
		// let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
		// let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
    // let vel = group.body.velocity; 
    // let velLength = Math.sqrt((vel.x * vel.x) + (vel.y * vel.y) + (vel.z * vel.z));
		// const currentSpeed = dot( threeVector(vel), threeVector(forward));
		// let flightModeInfluence = currentSpeed / 10;
		// flightModeInfluence = THREE.MathUtils.clamp(-flightModeInfluence, 0, 1);
    // let angVel = new THREE.Vector3(0,0,0);

    // group.body.setLinearFactor(1, 1, 1);
    // group.body.setAngularFactor(1, 1, 1);

    const aVel = body.ammo.getAngularVelocity();
    const aFact = body.ammo.getAngularFactor();
 
    var anchorPos = new THREE.Vector3().copy(group.position);
    let anchorRot = group.rotation;
    let dragForce = new THREE.Vector3(0, 0, 0);
    let dragMult = new THREE.Vector3(0, 0, 0);
    let totalForce = new THREE.Vector3(0, 0, 0);
    // let radius = new THREE.Vector3(0, 0, 0);
    let dirMult = 0;
    let aDamp = 0;
    let lDamp = 0;
    let floatAcc = 8;
    let curVel = new THREE.Vector3(body.ammo.getLinearVelocity().x(), body.ammo.getLinearVelocity().y(), body.ammo.getLinearVelocity().z());
    let mass = .05;
    upForce = new THREE.Vector3(0, 0, 0);
    let ax = angVel.x();
    let ay = angVel.y();
    let az = angVel.z();
    let velLength;
    let angleLength;
		let currentSpeed;
    let vel = body.velocity; 
    let radius;
    let upAcc;
    let velSquared;
		// setMass(body, mass); //huh? why is the mass changing

    if (this.keys.space) {
      forwardForce *= 3;
    }

    if (this.keys.w) {
      dirMult = 1;
    } else if (this.keys.s) { 
      dirMult = -1;
    }

    let strength = .05;
    
		totalForce.x = dirMult * (forwardForce * forward.x) * .1;
		totalForce.y = dirMult * (forwardForce * forward.y) * .1;
		totalForce.z = dirMult * (forwardForce * forward.z) * .1;

    currentSpeed = Math.sqrt((vel.x * vel.x) + (vel.y * vel.y) + (vel.z * vel.z));
    angleLength = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    // currentSpeed = dot( threeVector(vel), threeVector(forward));
    radius = currentSpeed/angleLength;
    velSquared = dot(currentSpeed, currentSpeed);
    upAcc = velSquared/radius;

    if(!notNullDef(upAcc)){
      upAcc = 0;
    }

    upForce.x +=  upAcc * up.x * 100;
    upForce.y +=  upAcc * up.y * 100;
    upForce.z +=  upAcc * up.z * 100;

    totalForce.x += upForce.x;
    totalForce.y += upForce.y;
    totalForce.z += upForce.z;

    console.log(upForce);
    // console.log(currentSpeed);
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


    appliedTorque['x'] *= 4;
    appliedTorque['y'] *= 4;
    appliedTorque['z'] *= 4;

    if (this.keys.lshift) {
        
      aDamp = 21;
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

    if (
      notNullDef(appliedTorque["x"]) &&
      notNullDef(appliedTorque["y"]) &&
      notNullDef(appliedTorque["z"])
    ) {
    group.body.applyLocalTorque(
        0,
        appliedTorque["y"],
        0,
      );
    }

    if (this.keys.ctrl) {
      lDamp = 1;
      group.body.setLinearFactor(0, 0, 0);
    } else {
      lDamp = 0;
      // group.body.applyForce(linearBrakeForce * -linVel['x'], linearBrakeForce *  -linVel['y'], linearBrakeForce * -linVel['z'] );
    }

    // this.camera.lookAt(0, 0, 110);
    this.camera.position.set(0.25, 50, 10);
    var mat = group.matrix;

    // group.body.setLinearFactor(1, 1, 1);

    // group.body.setAngularFactor(.5, .5, .5);
    // group.body.ammo.setDamping( lDamp, .5 + aDamp);
    group.body.applyForce(totalForce.x, totalForce.y, totalForce.z);

      // group.body.applyCentralLocalForce(0, 0, -forwardForce );

    // this.camera.rotation.set(anchorRot.x, anchorRot.y, anchorRot.z);

    this.lastVel = velLength;
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
