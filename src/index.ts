import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Scene3D, PhysicsLoader, Project, ExtendedObject3D, ThirdPersonControls} from 'enable3d';
import * as THREE from 'three'
import {updateStatus, getGlobalaStick} from "./gamepad";
export class ThreePhysicsComponent extends Scene3D {
  keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
    space: false
  }

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
    this.camera.position.set(13, 10, 23);
    this.camera.lookAt(0, 5, 0);
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

    // compound objects
    let group = new THREE.Group()
    group.position.z = 9
    group.position.y = 5
    group.rotation.z -= (startRot);

    // THREE.radToDeg(group);
    
    let c1 = this.add.box({ x: -1, y: -1 })
    let c2 = this.add.box({ x: -1, y: 0 })
    let c3 = this.add.box({ x: -1, y: 1 })
    let c4 = this.add.box({ y: 1 })
    let c7 = this.add.box({ x: -2, y: 1 })
    this.add.existing(group)
    group.add(c1 as any)
    group.add(c2 as any)
    group.add(c3 as any)
    group.add(c4 as any)
    group.add(c7 as any)
    this.physics.add.existing(group as any);

    const press = (e, isDown) => {
      e.preventDefault()
      const { code } = e
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

    const forwardForce = .05;
    const turnForce = 2;
    const eRot = this.scene.children[5].rotation;
    const matRot = this.scene.children[5].matrix;
		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

    // THREE.Vector4.applyMatrix4();
    // const Axis = THREE.Euler.setFromRotationMatrix();

    // const axis = new THREE.Vector4().setAxisAngleFromRotationMatrix(matRot);
    // const x = THREE.MathUtils.radToDeg(eRot.x);
    // const y = THREE.MathUtils.radToDeg(eRot.y);
    // const z = THREE.MathUtils.radToDeg(eRot.z);
    
    // console.log(eRot.x, eRot.y, eRot.z);

    // updateStatus();
    const stick = getGlobalaStick();

    console.log(stick);

    // //the angles i need
    // console.log(x + " " + y + " " + z);

    if (this.keys.w) {
    // console.log(this.scene.children[5].matrix);
      this.scene.children[5].body.applyForceX(forwardForce);
    } else if (this.keys.s) {
      this.scene.children[5].body.applyForceX(-forwardForce);
    } else {

    }

    if (this.keys.a) {
      this.scene.children[5].body.applyTorque(0, turnForce, 0);
    } else if (this.keys.d) {
      this.scene.children[5].body.applyTorque(0, -turnForce, 0);
    } else {
    }

    if (this.keys.q) {
      this.scene.children[5].body.applyTorque(0, 0, turnForce);
    } else if (this.keys.e) {
      this.scene.children[5].body.applyTorque(0, 0, -turnForce);
    }
  }
}

// set your project configs
const config = { scenes: [ThreePhysicsComponent], antialias: true, gravity: { x: 0, y: 0, z: 0 },  maxSubSteps: 4, fixedTimeStep: 1 / 120 }
PhysicsLoader('/ammo', () => new Project(config))
