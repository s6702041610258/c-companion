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
 scene.environment=environment.texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xbefce1,0x132947,.75));
 const key=new THREE.DirectionalLight(0xd8ffe4,2.4);key.position.set(-3,5,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0x668aff,2);rim.position.set(4,1,-2);scene.add(rim);
 const warm=new THREE.DirectionalLight(0xffd4a0,.65);warm.position.set(-4,-1,3);scene.add(warm);
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
 const ringMat=new THREE.MeshPhysicalMaterial({color:0x74c8b8,metalness:.88,roughness:.19,clearcoat:1,emissive:0x102f29,emissiveIntensity:.3});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.05,.075,20,160,Math.PI*1.68),ringMat);ring.rotation.set(.27,-.4,.46);ring.position.z=-.6;sculpture.add(ring);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(2.18,.012,8,128,Math.PI*1.6),new THREE.MeshBasicMaterial({color:0x82b9ca,transparent:true,opacity:.6}));inner.rotation.set(.27,-.4,.46);inner.position.z=-.6;sculpture.add(inner);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.17,.075,64),new THREE.MeshPhysicalMaterial({color:0x395e62,metalness:.8,roughness:.25,transparent:true,opacity:.65}));base.position.set(0,-1.56,0);sculpture.add(base);
 let width=1,height=1,progress=0,px=0,py=0,visible=true,disposed=false,frame=0;
 function render(){frame=0;if(disposed||!visible||document.hidden)return;const mobile=width<500;camera.position.set(progress*.5,progress*.25,(mobile?9.7:8.6)-Math.sin(progress*Math.PI)*2.1);camera.lookAt(0,.05,0);sculpture.rotation.y=-.18+px*.28+progress*.9;sculpture.rotation.x=py*.1;sculpture.position.y=.1-progress*.26;ring.rotation.z=.46+progress*.45;renderer.render(scene,camera)}
 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(render)}
 function resize(){width=host.clientWidth;height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();schedule()}
 const observer=new ResizeObserver(resize);observer.observe(host);
 const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)schedule()});intersection.observe(host);
 function visibility(){if(!document.hidden)schedule()}
 document.addEventListener('visibilitychange',visibility);
 const lost=(event:Event)=>{event.preventDefault();host.classList.remove('scene-ready')};canvas.addEventListener('webglcontextlost',lost);
 resize();render();host.classList.add('scene-ready');
 return {setProgress(value:number){progress=value;schedule()},setPointer(x:number,y:number){px=x;py=y;schedule()},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){geometries.add(obj.geometry);for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());environment.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();host.classList.remove('scene-ready')}};
}
