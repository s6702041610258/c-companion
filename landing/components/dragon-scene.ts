import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export function createDragonScene(host:HTMLElement){
 const canvas=document.createElement('canvas');
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
 if(!gl)return null;
 const renderer=new THREE.WebGLRenderer({canvas,context:gl,alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1:1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 host.append(canvas);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,80);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);
 scene.environment=environment.texture;scene.environmentIntensity=.25;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xa0acc8,0x161020,.6));
 const key=new THREE.DirectionalLight(0xffdcc2,2.3);key.position.set(-3,5,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0xef352b,5);rim.position.set(4,1,-2);scene.add(rim);
 const warm=new THREE.DirectionalLight(0x718fca,1.3);warm.position.set(-4,-1,3);scene.add(warm);
 const sculpture=new THREE.Group();scene.add(sculpture);
 const dragon=new THREE.Group();sculpture.add(dragon);dragon.rotation.y=-.2;dragon.rotation.z=-.05;
 const jade=new THREE.MeshPhysicalMaterial({color:0x66ba7d,roughness:.4,metalness:.08,clearcoat:.4});
 const mint=new THREE.MeshPhysicalMaterial({color:0xd0e5ab,roughness:.36,metalness:.08,clearcoat:.4});
 const deep=new THREE.MeshPhysicalMaterial({color:0x19563e,roughness:.3,metalness:.25});
 const cream=new THREE.MeshStandardMaterial({color:0xefdfb3,roughness:.3});
 const white=new THREE.MeshPhysicalMaterial({color:0xfff9e2,roughness:.18,clearcoat:1});
 const pupil=new THREE.MeshStandardMaterial({color:0x081814,roughness:.13});
 const wingMat=new THREE.MeshPhysicalMaterial({color:0x69c4b0,side:THREE.DoubleSide,metalness:.35,roughness:.2,transparent:true,opacity:.88});
 const sphere=new THREE.SphereGeometry(1,32,24);
 function ball(material:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,parent:THREE.Object3D=dragon){const mesh=new THREE.Mesh(sphere,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh}
 ball(jade,0,-.36,0,.71,.86,.58);ball(mint,0,-.4,.44,.47,.61,.2);
 ball(jade,0,.58,.04,.88,.76,.67);ball(mint,0,.28,.6,.6,.33,.25);
 for(const side of [-1,1]){
  ball(white,side*.36,.72,.594,.25,.3,.15);ball(pupil,side*.32,.7,.735,.13,.19,.066);ball(white,side*.32-.035,.775,.789,.041,.057,.021);
  ball(deep,side*.22,.37,.827,.043,.029,.015);
  const horn=new THREE.Mesh(new THREE.ConeGeometry(.16,.58,24),cream);horn.position.set(side*.59,1.27,-.02);horn.rotation.z=-side*.3;dragon.add(horn);
  const ear=ball(jade,side*.78,.7,-.02,.25,.35,.11);ear.rotation.z=-side*.9;
  ball(jade,side*.49,-1.08,.28,.32,.2,.44);ball(mint,side*.49,-1.12,.58,.22,.1,.11);
  const arm=ball(jade,side*.6,-.25,.5,.24,.46,.26);arm.rotation.z=side*.43;
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.2,.65,.48,.84,.99,1.1);shape.lineTo(.86,.55);shape.quadraticCurveTo(.65,.63,.6,.23);shape.quadraticCurveTo(.39,.39,.28,.03);shape.lineTo(0,0);
  const wing=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.03,bevelThickness:.02}),wingMat);wing.position.set(side*.53,-.43,-.2);wing.scale.x=side;wing.rotation.y=side*.3;dragon.add(wing);
 }
 const smilePath=new THREE.CatmullRomCurve3([new THREE.Vector3(-.22,.19,.833),new THREE.Vector3(0,.12,.87),new THREE.Vector3(.22,.19,.833)]);
 dragon.add(new THREE.Mesh(new THREE.TubeGeometry(smilePath,24,.014,8,false),deep));
 const blush=new THREE.MeshStandardMaterial({color:0xd49681,roughness:.6});
 for(const side of [-1,1])ball(blush,side*.58,.36,.593,.12,.055,.035);
 for(let i=0;i<3;i++){const scale=new THREE.Mesh(new THREE.ConeGeometry(.17,.32,3),deep);scale.position.set(0,1.25-i*.14,-.08-i*.3);scale.rotation.x=-.4;dragon.add(scale)}
 const tailPath=new THREE.CatmullRomCurve3([new THREE.Vector3(.45,-.85,-.2),new THREE.Vector3(1.05,-1,-.2),new THREE.Vector3(1.39,-.65,.05),new THREE.Vector3(1.28,-.2,.12)]);
 const tail=new THREE.Mesh(new THREE.TubeGeometry(tailPath,36,.12,12,false),jade);dragon.add(tail);
 // An open book, custom geometry and texture made for this product.
 const book=new THREE.Group();book.position.set(0,-.48,.87);book.rotation.x=-.15;dragon.add(book);
 const paper=new THREE.MeshStandardMaterial({color:0xf1e5c8,roughness:.7});
 for(const side of [-1,1]){const half=new THREE.Group();half.position.x=side*.34;half.rotation.y=side*.18;book.add(half);const cover=new THREE.Mesh(new THREE.BoxGeometry(.67,.74,.06),deep);half.add(cover);const pages=new THREE.Mesh(new THREE.BoxGeometry(.59,.65,.065),paper);pages.position.z=.048;half.add(pages);
  for(let n=0;n<5;n++){const line=new THREE.Mesh(new THREE.BoxGeometry(n===4?.25:.39,.012,.008),jade);line.position.set(0,.2-n*.075,.087);half.add(line)}}
 // A book-shaped landscape: the mascot sits on an open C textbook.
 dragon.scale.setScalar(.76);dragon.position.set(.3,.12,0);
 const landscape=new THREE.Group();landscape.position.set(0,-1.1,0);landscape.rotation.y=-.12;sculpture.add(landscape);
 const pageMaterial=new THREE.MeshStandardMaterial({color:0xf7f7e8,roughness:.8});
 const coverMaterial=new THREE.MeshPhysicalMaterial({color:0x652829,roughness:.42,clearcoat:.35});
 const inkMaterial=new THREE.MeshStandardMaterial({color:0x9a8071,roughness:.8});
 for(const side of [-1,1]){
  const leaf=new THREE.Group();leaf.position.x=side*.93;leaf.rotation.z=side*.11;landscape.add(leaf);
  const cover=new THREE.Mesh(new THREE.BoxGeometry(1.92,.09,2.15),coverMaterial);leaf.add(cover);
  const stack=new THREE.Mesh(new THREE.BoxGeometry(1.82,.16,2.04),pageMaterial);stack.position.y=.115;leaf.add(stack);
  for(let line=0;line<7;line++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(line%3===0?.74:1.25,.008,.027),inkMaterial);mesh.position.set(-.1,.2,-.7+line*.17);leaf.add(mesh)}
  for(let page=0;page<4;page++){const seam=new THREE.Mesh(new THREE.BoxGeometry(1.82,.006,.007),inkMaterial);seam.position.set(0,.06+page*.033,1.024);leaf.add(seam)}
 }
 const ribbon=new THREE.Mesh(new THREE.BoxGeometry(.14,.012,1.48),new THREE.MeshStandardMaterial({color:0xd4a447}));ribbon.position.set(.2,.18,.65);landscape.add(ribbon);
 const ground=new THREE.Mesh(new THREE.CircleGeometry(3.1,64),new THREE.MeshBasicMaterial({color:0xaa2729,transparent:true,opacity:.18,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.46;sculpture.add(ground);
 // A corridor of twelve illuminated pages gives real foreground/background parallax.
 const corridor=new THREE.Group();scene.add(corridor);
 const pageGeo=new THREE.BoxGeometry(1.15,1.65,.025);
 const floatingPaper=new THREE.MeshStandardMaterial({color:0xe1c6a3,roughness:.85,side:THREE.DoubleSide});
 const redInk=new THREE.MeshBasicMaterial({color:0xb74b40});
 for(let i=0;i<12;i++){
  const side=i%2===0?-1:1,row=Math.floor(i/2),page=new THREE.Group();
  page.position.set(side*(3.2+row*.25),.5+Math.sin(i*1.7)*.6,5-row*2.2);
  page.rotation.set(-.13,side*-.42,side*(.12+row*.035));
  page.add(new THREE.Mesh(pageGeo,floatingPaper));
  for(let line=0;line<6;line++){const stroke=new THREE.Mesh(new THREE.BoxGeometry(line===0?.27:.7,.012,.004),redInk);stroke.position.set(line===0?-.22:0,.5-line*.16,.016);page.add(stroke)}
  corridor.add(page);
 }
 const emberGeometry=new THREE.SphereGeometry(.018,6,4),emberMaterial=new THREE.MeshBasicMaterial({color:0xff5636});
 const embers=new THREE.Group();scene.add(embers);
 // Deterministic positions; no ongoing animation or random flicker.
 for(let i=0;i<65;i++){const ember=new THREE.Mesh(emberGeometry,emberMaterial);ember.position.set(Math.sin(i*12.3)*6,Math.cos(i*7.7)*3+1,Math.sin(i*4.3)*7-1);embers.add(ember)}
 scene.fog=new THREE.FogExp2(0x111019,.038);
 const cameraPath=new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,3.1,11.8),new THREE.Vector3(-3.7,2.4,8.3),
  new THREE.Vector3(-2.6,1.8,6.2),new THREE.Vector3(2.2,1.65,6.5)
 ],false,'catmullrom',.35);
 const focusPath=new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,-.2,0),new THREE.Vector3(.2,-.65,0),
  new THREE.Vector3(.1,-.4,0),new THREE.Vector3(.1,.05,0)
 ]);
 const cameraPoint=new THREE.Vector3(),focusPoint=new THREE.Vector3();
 let width=1,height=1,progress=0,px=0,py=0,visible=true,disposed=false,frame=0;
 function render(){
  frame=0;if(disposed||!visible||document.hidden)return;
  cameraPath.getPoint(progress,cameraPoint);focusPath.getPoint(progress,focusPoint);
  // Portrait frames need a wider field without magnifying camera travel.
  const portrait=Math.max(0,Math.min(1,(1.4-width/height)));
  cameraPoint.z+=portrait*3;cameraPoint.x+=px*.3;cameraPoint.y+=py*.15;
  camera.position.copy(cameraPoint);camera.lookAt(focusPoint);
  camera.fov=33+Math.sin(progress*Math.PI)*7+portrait*4;camera.updateProjectionMatrix();
  sculpture.rotation.y=-.18;sculpture.rotation.x=0;sculpture.position.y=.1;
  corridor.rotation.y=progress*.12;embers.rotation.y=progress*.25;
  renderer.render(scene,camera);
 }
 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(render)}
 function resize(){width=host.clientWidth;height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();schedule()}
 const observer=new ResizeObserver(resize);observer.observe(host);
 const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)schedule()});intersection.observe(host);
 function visibility(){if(!document.hidden)schedule()}
 document.addEventListener('visibilitychange',visibility);
 const lost=(event:Event)=>{event.preventDefault();host.classList.remove('scene-ready')};canvas.addEventListener('webglcontextlost',lost);
 resize();render();host.classList.add('scene-ready');
 return {setProgress(value:number){progress=Math.max(0,Math.min(1,value));schedule()},setPointer(x:number,y:number){px=x;py=y;schedule()},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){geometries.add(obj.geometry);for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());environment.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();host.classList.remove('scene-ready')}};
}
