// A small bookshop garden for Alakazam. Scene composition and animation are original.
// Toon materials, depth ink, sky and trees adapt Sakura Crossing (MIT).
import * as THREE from 'three';
import { Pipeline } from './vendor/core/post.js';
import { cel, flat } from './vendor/core/toon.js';
import { buildSky, buildDistantHills } from './vendor/core/sky.js';
import { setOutlineResolution } from './vendor/core/outline.js';
import { bake, trs, rngKit, sagCurve } from './vendor/core/util.js';
import { buildSakura, buildGrove, buildShrubs } from './vendor/world/trees.js';
import { makeHouse } from './vendor/world/buildings.js';
import { makeBookshop } from './bookshop.js';

const host = document.querySelector('[data-toon-scene]');
if (host) {
  try { startGarden(host); }
  catch (error) {
    host.dataset.state = 'error';
    console.error('Bookshop scene:', error);
  }
}

function startGarden(host) {
  const canvas = host.querySelector('[data-toon-canvas]');
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({canvas, antialias:false, stencil:false, powerPreference:'low-power'});
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe6ecf7, 42, 155);
  const camera = new THREE.PerspectiveCamera(42, 1, .25, 600);
  const cameraHome = new THREE.Vector3(10.8, 5.8, 17);
  const target = new THREE.Vector3(.7, 2.65, -1.6);
  camera.position.copy(cameraHome);
  camera.lookAt(target);

  const hemi = new THREE.HemisphereLight(0xdcecff, 0xb6a6c6, 1.12);
  const sun = new THREE.DirectionalLight(0xfff1d8, 2.25);
  sun.position.set(-32, 42, 34);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {left:-26,right:26,top:26,bottom:-26,near:1,far:125});
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.bias = -.0004;
  sun.shadow.normalBias = .035;
  const fill = new THREE.DirectionalLight(0xa9bdf5, 1.08);
  fill.position.set(36,22,-30);
  const bounce = new THREE.DirectionalLight(0xd8cbe8,.34);
  bounce.position.set(10,-18,40);
  scene.add(hemi,sun,sun.target,fill,bounce);
  const sky = buildSky(scene,500);
  buildDistantHills(scene);

  // Keep a handful of shared materials and merge the fixed architecture by material.
  const C = {
    grass:0x8aa886, lawn:0xabc49e, stone:0xe3d8cc, curb:0xd0c4c3,
    timber:0x877068, rail:0x635d6f, ballast:0xb6abb4, steel:0x7f8390,
    cream:0xf4ecda, teal:0x43827e, coral:0xc96873, leaf:0x678d74,
  };
  const materials = new Map();
  const parts = new Map();
  const mat = (color) => {
    if(!materials.has(color)) materials.set(color,cel({color,bands:3,tint:0x6b648e}));
    return materials.get(color);
  };
  function part(color,geometry,matrix) {
    if(!parts.has(color)) parts.set(color,[]);
    parts.get(color).push({geometry,matrix});
  }
  function box(color,x,y,z,w,h,d,ry=0) {
    part(color,new THREE.BoxGeometry(w,h,d),trs(x,y,z,0,ry,0));
  }
  function pole(color,a,b,r=.04,segments=8) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
    const mx = new THREE.Matrix4().compose(start.add(end).multiplyScalar(.5),q,new THREE.Vector3(1,1,1));
    part(color,new THREE.CylinderGeometry(r,r,delta.length(),segments),mx);
  }
  function flush() {
    parts.forEach((list,color) => {
      const mesh = new THREE.Mesh(bake(list),mat(color));
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
      new Set(list.map(p=>p.geometry)).forEach(g=>g.dispose());
    });
    parts.clear();
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700,700),mat(C.grass));
  ground.rotation.x=-Math.PI/2;
  ground.position.y=-.045;
  ground.receiveShadow=true;
  scene.add(ground);
  // A diagonal walk and a pale forecourt draw the eye towards the shop's door.
  box(C.stone,-1.8,.015,18.6,7.4,.08,46,-.24);
  box(0xece2d8,3.2,.07,-.1,10,.18,8);
  box(C.lawn,-7,.008,1.7,9,.04,8);

  // Railway at the rear: one shared sleeper mesh, two rails and a modest platform.
  box(C.ballast,0,.08,-8.6,78,.2,3.2);
  for(let i=-39;i<40;i++) box(C.timber,i,.23,-8.6,.24,.14,2.65);
  for(const z of [-9.35,-7.85]) {
    box(C.rail,0,.33,z,78,.17,.13);
    box(0xb8b5c0,0,.42,z,78,.025,.12);
  }
  box(C.curb,-6,.28,-11.2,21,.6,1.3);
  box(0xe5cf87,-6,.59,-10.65,21,.025,.2);
  for(let x=-21;x<=21;x+=1.4) {
    box(C.cream,x,.74,-6.5,.09,1.4,.09);
  }
  box(C.cream,0,1.12,-6.5,44,.09,.09);
  box(C.cream,0,.62,-6.5,44,.07,.07);

  // Poles and suspended cables make perspective visible without a game camera.
  for(const x of [-13,12]) {
    pole(C.timber,[x,0,-6.7],[x,8.2,-6.7],.105);
    pole(C.timber,[x-1.05,7.7,-6.7],[x+1.05,7.7,-6.7],.065);
    for(const dx of [-.8,.8]) {
      pole(0xddd5cf,[x+dx,7.62,-6.7],[x+dx,8,-6.7],.075);
    }
  }
  for(const y of [7.78,8.03]) {
    part(C.rail,new THREE.TubeGeometry(sagCurve(new THREE.Vector3(-13,y,-6.7),new THREE.Vector3(12,y,-6.7),1.05,24),40,.014,4,false),new THREE.Matrix4());
  }

  const bookshop = makeBookshop();
  bookshop.group.position.set(3.8,0,-2);
  scene.add(bookshop.group);
  for(const [x,z,wall,roof] of [[-10,-19,1,0],[1,-23,4,2],[13,-21,2,1]]) {
    const home = makeHouse({x,y:0,z,w:5.5,d:5.4,floors:2,face:'z+',seed:Math.abs(x*11)+5,wall,roof,roofKind:'gable'});
    scene.add(home);
  }

  // Seeded blossom clusters and coloured shadows are the upstream art method.
  const trees = buildSakura({add:obj=>scene.add(obj)},[
    {x:-7.2,z:2.3,y:0,scale:1.55,seed:123,collide:false},
    {x:10.3,z:-4.8,y:0,scale:1.25,seed:97,collide:false},
    {x:-15,z:-12,y:0,scale:1.15,seed:32,collide:false},
    {x:2,z:-16,y:0,scale:1.1,seed:54,collide:false},
    {x:16,z:-16,y:0,scale:1.2,seed:61,collide:false},
  ]);
  buildGrove({add:obj=>scene.add(obj)},[
    {x:-20,z:-19,y:0,scale:1.45,seed:87,collide:false},
    {x:22,z:-23,y:0,scale:1.5,seed:56,collide:false},
  ]);
  buildShrubs({add:obj=>scene.add(obj)},[
    {x:-9,z:3,r:.65,spread:5,count:18,seed:21},
    {x:-7,z:6,r:.55,spread:3,count:10,seed:25},
    {x:9,z:1.2,r:.55,spread:2,count:8,seed:31},
    {x:-4,z:-5.4,r:.55,spread:4,count:14,seed:74},
    {x:9,z:-15,r:1.15,spread:16,count:34,seed:41},
  ]);

  // Bench, a few stepping stones and low flower beds leave the path open.
  for(const x of [-6.6,-4.2]) {
    pole(C.rail,[x,0,.1],[x,.55,.1],.055);
    pole(C.rail,[x,0,1],[x,.55,1],.055);
  }
  for(let i=0;i<4;i++) box(C.timber,-5.4,.6,.16+i*.22,2.95,.13,.19);
  for(let i=0;i<3;i++) box(C.timber,-5.4,.94+i*.2,.06,2.95,.16,.12);
  for(const x of [-6.6,-4.2]) pole(C.rail,[x,.5,.06],[x,1.5,.06],.05);
  const rng=rngKit(4001);
  for(let i=0;i<18;i++) {
    const x=rng.range(-12,-3.5), z=rng.range(3,10);
    part(i%2 ? 0xc4d1ae:0xb4c29f,new THREE.DodecahedronGeometry(rng.range(.1,.25),0),trs(x,.055,z,0,rng.range(0,3),0,1,.35,1));
  }
  for(const [x,z] of [[-8.8,-1],[9.2,1.8],[-3.8,-4.2]]) {
    box(C.curb,x,.2,z,1.6,.4,.8);
    box(0x887d6d,x,.4,z,1.45,.05,.64);
    for(let i=0;i<12;i++) {
      const fx=x+rng.range(-.65,.65),fz=z+rng.range(-.25,.25),fy=rng.range(.64,.94);
      pole(C.leaf,[fx,.4,fz],[fx,fy,fz],.016,4);
      part(i%2 ? 0xf1c9cd:0xf3e0ab,new THREE.IcosahedronGeometry(.11,0),trs(fx,fy,fz));
    }
  }
  flush();

  const train = makeTrain();
  train.position.set(-14,.46,-8.6);
  scene.add(train);
  const petals = makePetals();
  scene.add(petals.mesh);
  const shopLamp = new THREE.PointLight(0xffc686,0,7,2);
  shopLamp.position.set(3.8,2.5,1.15);
  scene.add(shopLamp);
  const pipeline = new Pipeline(renderer,scene,camera,{pixelBudget:1200000});
  pipeline.grade.mat.uniforms.uVignette.value = .08;
  pipeline.ink.mat.uniforms.uSens.value=.009;
  pipeline.ink.mat.uniforms.uConcave.value=.035;

  // V20「一束光」：光照只跟随 <html data-time>，暂停只跟随舞台的 data-paused（按钮在 gen.js／skin-scenes.js 里）。
  const root = document.documentElement;
  const stageBox = host.closest('[data-stage]');
  const isPaused = () => stageBox.dataset.paused === 'true';
  let visible=false, raf=0, last=0, elapsed=0, lightMode='day', width=0, height=0;
  let desiredX=0, desiredY=0, driftX=0, driftY=0;
  const abort = new AbortController();
  const on=(obj,event,fn)=>obj.addEventListener(event,fn,{signal:abort.signal});
  function setLighting(mode) {
    lightMode=mode;
    host.dataset.light=mode;
    const night=mode==='night';
    sun.color.set(night ? 0xa9c5ef:0xfff1d8);
    sun.intensity=night ? .62:2.25;
    fill.intensity=night ? .4:1.08;
    hemi.intensity=night ? .68:1.12;
    bounce.intensity=night ? .18:.34;
    hemi.color.set(night ? 0x8598c6:0xdcecff);
    scene.fog.color.set(night ? 0x647598:0xe6ecf7);
    const su=sky.dome.material.uniforms;
    su.uTop.value.set(night ? 0x263e69:0x8fbdea);
    su.uMid.value.set(night ? 0x7087b0:0xd4e8fa);
    su.uHaze.value.set(night ? 0xc0a9bc:0xfbe7e9);
    shopLamp.intensity=night ? 7:0;
    bookshop.lanterns.forEach(m=>{m.emissiveIntensity=night ? 1.8:.25;});
    draw();
  }
  function draw() {
    if(!width||!height)return;
    sky.dome.position.copy(camera.position);
    sky.clouds.position.copy(camera.position);
    pipeline.render();
  }
  function resize() {
    const rect=stage.getBoundingClientRect();
    width=Math.round(rect.width);height=Math.round(rect.height);
    if(!width||!height)return;
    camera.aspect=width/height;
    camera.position.copy(cameraHome);
    // Keep the complete composition at narrower aspect ratios rather than crop the shop.
    camera.fov=width/height < 1.4 ? 51:42;
    camera.updateProjectionMatrix();
    pipeline.setSize(width,height);
    setOutlineResolution(pipeline.size.x,pipeline.size.y);
    draw();
  }
  function frame(now) {
    const dt=Math.min((now-last)/1000,.05);
    last=now;elapsed+=dt;
    driftX+=(desiredX-driftX)*(1-Math.exp(-2.2*dt));
    driftY+=(desiredY-driftY)*(1-Math.exp(-2.2*dt));
    camera.position.copy(cameraHome);
    camera.position.x+=driftX*.65;camera.position.y+=driftY*.28;
    camera.lookAt(target);
    train.position.x=((elapsed*.95+17)%66)-31;
    petals.update(elapsed);
    sky.clouds.rotation.y=elapsed*.0018;
    draw();
    raf=requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf);raf=0;
    const active=visible&&!document.hidden&&document.documentElement.dataset.skin==='sakura';
    host.dataset.motion=active&&!isPaused()?'running':'paused';
    if(active) {
      resize();
      if(!isPaused()) {last=performance.now();raf=requestAnimationFrame(frame);}
    }
  }
  const watcher=new MutationObserver(records=>{
    records.forEach(r=>{if(r.target===root)setLighting(root.dataset.time==='night'?'night':'day');else sync();});
  });
  watcher.observe(root,{attributes:true,attributeFilter:['data-time']});
  watcher.observe(stageBox,{attributes:true,attributeFilter:['data-paused']});
  on(canvas,'pointermove',e=>{
    if(isPaused())return;
    const r=canvas.getBoundingClientRect();
    desiredX=(e.clientX-r.left)/r.width*2-1;
    desiredY=.5-(e.clientY-r.top)/r.height;
  });
  on(canvas,'pointerleave',()=>{desiredX=desiredY=0;});
  on(document,'visibilitychange',sync);
  on(document,'kx:skin',sync);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0});
  intersection.observe(stage);
  const resizer=new ResizeObserver(resize);
  resizer.observe(stage);
  on(window,'pagehide',e=>{
    cancelAnimationFrame(raf);
    if(e.persisted)return;
    intersection.disconnect();resizer.disconnect();watcher.disconnect();abort.abort();
    const geometries=new Set(),mats=new Set(),textures=new Set();
    scene.traverse(obj=>{
      if(obj.geometry)geometries.add(obj.geometry);
      if(obj.material)(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>mats.add(m));
    });
    mats.forEach(m=>{Object.values(m).forEach(v=>{if(v&&v.isTexture)textures.add(v);});m.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
    pipeline.dispose();renderer.dispose();
  });
  on(window,'pageshow',sync);
  resize();setLighting(root.dataset.time==='night'?'night':'day');
  host.dataset.state='ready';

  function makeTrain() {
    const g=new THREE.Group();
    const body=cel({color:0xf1e4d3,bands:3}), stripe=cel({color:0x5f938c,bands:3});
    const glass=flat({color:0x526f84}), roof=cel({color:0x8d8a9a,bands:3});
    function cube(material,x,y,z,w,h,d) {
      const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
      m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
    }
    for(let car=0;car<2;car++) {
      const cx=car*6.5;
      cube(body,cx,1.23,0,6.2,2.1,1.8);
      cube(roof,cx,2.35,0,6.3,.22,1.9);
      for(const side of [-1,1]) {
        cube(stripe,cx,.76,side*.912,6.2,.35,.035);
        for(let win=0;win<6;win++) cube(glass,cx-2.4+win*.94,1.69,side*.917,.7,.72,.035);
      }
      cube(glass,cx-3.115,1.7,0,.035,.7,1.35);
      for(const wheel of [-2,2])cube(roof,cx+wheel,.19,0,.7,.45,1.6);
    }
    return g;
  }
  function makePetals() {
    const count=48, rand=rngKit(90), dummy=new THREE.Object3D();
    const geometry=new THREE.SphereGeometry(.048,4,2);geometry.scale(1,.24,1.5);
    const material=cel({color:0xf8cee1,bands:'soft',side:THREE.DoubleSide});
    const mesh=new THREE.InstancedMesh(geometry,material,count);
    const seeds=Array.from({length:count},()=>({x:rand.range(-11,6),z:rand.range(-3,9),y:rand.range(0,7),a:rand.range(0,6.28),speed:rand.range(.16,.35)}));
    function update(t) {
      seeds.forEach((s,i)=>{
        dummy.position.set(s.x+Math.sin(t*.24+s.a)*.72,(s.y+7-t*s.speed%7)%7,s.z+Math.sin(t*.17+s.a)*.4);
        dummy.rotation.set(t*.45+s.a,0,t*.32+s.a);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate=true;
    }
    update(0);return {mesh,update};
  }
}
