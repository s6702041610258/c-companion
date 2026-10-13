import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/** A full viewport learning studio. Model requests and GPU resources belong to this mount. */
export function createLearningScene(host:HTMLElement){
 const canvas=document.createElement('canvas');
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'low-power'});if(!gl)return null;
 const renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=innerWidth>750;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;host.append(canvas);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#10121b');scene.fog=new THREE.FogExp2('#10121b',.035);
 const camera=new THREE.PerspectiveCamera(38,1,.1,70);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.32;
 scene.add(new THREE.HemisphereLight(0xb3c8ed,0x38221d,1.25));
 const key=new THREE.DirectionalLight(0xffe2bc,3);key.position.set(-3,8,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-9,right:9,top:8,bottom:-8,near:.1,far:30});key.shadow.bias=-.0005;key.shadow.normalBias=.03;scene.add(key);
 const rim=new THREE.PointLight(0xff4632,42,18,2);rim.position.set(3,4,-3);scene.add(rim);
 const fill=new THREE.DirectionalLight(0xcbdfff,1.1);fill.position.set(4,3,6);scene.add(fill);
 const materials:THREE.Material[]=[];
 function material(color:string,roughness=.6,metalness=0){const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.push(m);return m}
 const stone=material('#323644',.58,.18),edge=material('#96654c',.4,.45),wood=material('#53372d',.75),dark=material('#111923',.45,.3),paper=material('#d4bb95',.85),red=material('#872e2a',.65);
 const glow=new THREE.MeshStandardMaterial({color:'#ff7655',emissive:'#e33320',emissiveIntensity:2});materials.push(glow);
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material,r=.04){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh}
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),material('#151923',.43,.2));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 // Architectural depth: real door frames and floor inlays, not floating sheets.
 for(let i=0;i<4;i++){
  const z=-4-i*4.2;
  box(.16,7,.2,-6,3.5,z,edge);box(.16,7,.2,6,3.5,z,edge);box(12,.16,.2,0,7,z,edge);
  if(i===0){box(.022,.012,36,-4,0.016,-8,glow,.002);box(.022,.012,36,4,.016,-8,glow,.002);}
 }
 for(let i=0;i<12;i++)box(24,.006,.016,0,.009,3-i*2,stone,.002);
 // Circular studio dais grounds the mascot with soft real-time contact shadows.
 const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(2.8,3,.17,80),stone);pedestal.position.set(1.7,.085,0);pedestal.receiveShadow=true;pedestal.castShadow=true;scene.add(pedestal);
 const band=new THREE.Mesh(new THREE.TorusGeometry(2.86,.018,8,100),glow);band.rotation.x=Math.PI/2;band.position.set(1.7,.12,0);scene.add(band);
 // A study desk and a working screen make the environment specific to learning C.
 box(3.1,.16,1.6,-2.8,1.25,-1.4,wood);for(const x of [-4.05,-1.55])box(.09,1.2,.95,x,.6,-1.4,edge);
 box(.6,.06,.4,-2.7,1.38,-1.8,dark);box(.07,.4,.07,-2.7,1.58,-1.8,edge);box(1.65,1.04,.08,-2.7,2.04,-1.8,dark);
 const screenCanvas=document.createElement('canvas');screenCanvas.width=768;screenCanvas.height=448;const ctx=screenCanvas.getContext('2d')!;
 ctx.fillStyle='#101923';ctx.fillRect(0,0,768,448);ctx.fillStyle='#a0acba';ctx.font='20px monospace';ctx.fillText('C COMPANION / learn.c',35,48);
 const lines=['#include <stdio.h>','','int main(void) {','  printf("Hello, Mongkoi!");','  return 0;','}'];ctx.font='25px monospace';lines.forEach((line,i)=>{ctx.fillStyle=i===0?'#ef9d70':i===3?'#eed2a7':'#a3cccf';ctx.fillText(line,35,115+i*46)});
 const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;const screenMat=new THREE.MeshBasicMaterial({map:screenTexture});materials.push(screenMat);
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.52,.89),screenMat);screen.position.set(-2.7,2.05,-1.749);scene.add(screen);
 box(1.3,.055,.43,-2.7,1.38,-1.02,dark);for(let row=0;row<3;row++)for(let col=0;col<10;col++)box(.09,.018,.07,-3.25+col*.12,1.415,-1.16+row*.1,stone,.007);
 // Warm reading lamp, a few tangible books, and a small plant.
 box(.38,.04,.3,-4,1.36,-1.5,edge);box(.045,.72,.045,-4,1.73,-1.5,edge);const shade=new THREE.Mesh(new THREE.ConeGeometry(.28,.22,32,1,true),edge);shade.position.set(-4,2.15,-1.5);scene.add(shade);const lamp=new THREE.PointLight(0xffbe7e,4,3);lamp.position.set(-4,2.04,-1.5);scene.add(lamp);
 for(let i=0;i<3;i++){box(.62,.13,.9,-1.8,1.42+i*.14,-1.35,i%2?red:paper).rotation.y=.15*i}
 const pot=new THREE.Mesh(new THREE.CylinderGeometry(.25,.18,.38,24),wood);pot.position.set(-4.7,.2,-.4);scene.add(pot);
 for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),material('#54664e'));leaf.scale.set(.08,.35,.045);leaf.position.set(-4.7+Math.sin(i*2.4)*.2,.55+Math.cos(i)*.12,-.4+Math.cos(i*2.4)*.18);leaf.rotation.z=Math.sin(i*2.4)*.7;scene.add(leaf)}
 // Backlit circular wall aperture and shelves.
 const disc=new THREE.Mesh(new THREE.CircleGeometry(3,80),new THREE.MeshBasicMaterial({color:'#7e2d2a'}));disc.position.set(3,3.7,-6);scene.add(disc);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(3.04,.025,8,100),glow);halo.position.copy(disc.position);scene.add(halo);
 for(let i=0;i<3;i++)box(4.3,.12,.85,3.8,1+i*1.45,-4.5,wood);
 for(const x of [1.6,6])box(.09,4.6,.8,x,2.35,-4.5,edge);
 let width=1,height=1,progress=0,px=0,py=0,visible=true,disposed=false,frame=0;
 const controller=new AbortController(),loader=new GLTFLoader();
 function disposeTree(object:THREE.Object3D){const geometry=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();object.traverse(o=>{if(o instanceof THREE.Mesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m)}});mats.forEach(m=>{for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);m.dispose()});geometry.forEach(g=>g.dispose());textures.forEach(t=>t.dispose())}
 async function loadModel(name:string){const response=await fetch(`/welcome/models/${name}`,{signal:controller.signal});if(!response.ok)throw new Error('Model unavailable');const model=await loader.parseAsync(await response.arrayBuffer(),'/welcome/models/');if(disposed){disposeTree(model.scene);return null}return model.scene}
 void loadModel('mongkoi-giraffe.glb').then(model=>{if(!model)return;model.position.set(1.7,.17,0);model.rotation.y=-.08;model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});scene.add(model);renderer.shadowMap.needsUpdate=true;host.classList.add('scene-ready');schedule()}).catch(()=>host.classList.remove('scene-ready'));
 if(innerWidth>750)void loadModel('library-books.gltf').then(model=>{if(!model)return;model.rotation.y=0;model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());const scale=Math.min(3.4/size.x,1.12/size.y,.65/size.z);model.scale.setScalar(scale);const center=bounds.getCenter(new THREE.Vector3());model.position.set(3.8-center.x*scale,1.08-bounds.min.y*scale,-4.4-center.z*scale);model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true}});scene.add(model);for(let i=1;i<3;i++){const clone=model.clone();clone.position.y+=i*1.45;scene.add(clone)}renderer.shadowMap.needsUpdate=true;schedule()}).catch(()=>{});
 const path=new THREE.CatmullRomCurve3([new THREE.Vector3(4.5,3.5,9),new THREE.Vector3(0,2.7,7.8),new THREE.Vector3(-1.5,2.8,6),new THREE.Vector3(4.5,3.3,6.8)],false,'catmullrom',.4);
 const focus=new THREE.CatmullRomCurve3([new THREE.Vector3(-.6,1.8,0),new THREE.Vector3(-.7,1.8,-.6),new THREE.Vector3(.15,1.9,0),new THREE.Vector3(.55,1.9,0)]);
 const position=new THREE.Vector3(),target=new THREE.Vector3();
 function render(){frame=0;if(disposed||!visible||document.hidden)return;path.getPoint(progress,position);focus.getPoint(progress,target);const mobile=width<751;
  if(mobile){position.set(3.5-progress*2,3,10);target.set(1.5,1.95,0);camera.fov=40}else camera.fov=38-Math.sin(progress*Math.PI)*2;
  position.x+=px*.22;position.y+=py*.1;camera.position.copy(position);camera.lookAt(target);camera.updateProjectionMatrix();renderer.render(scene,camera)}
 function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(render)}
 function resize(){width=host.clientWidth;height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();schedule()}
 const observer=new ResizeObserver(resize);observer.observe(host);const intersection=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)schedule()});intersection.observe(host);
 function visibility(){if(!document.hidden)schedule()}document.addEventListener('visibilitychange',visibility);
 const lost=(e:Event)=>{e.preventDefault();host.classList.remove('scene-ready')};canvas.addEventListener('webglcontextlost',lost);resize();
 return {setProgress(value:number){progress=Math.max(0,Math.min(1,value));schedule()},setPointer(x:number,y:number){px=x;py=y;schedule()},dispose(){disposed=true;controller.abort();cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);disposeTree(scene);env.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();host.classList.remove('scene-ready')}};
}
