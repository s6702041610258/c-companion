import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {studioTeam} from './studio-team';

/** A recessed gallery with original photographs, inset mounts and engraved nameplates. */
export function addStudioGallery(scene:THREE.Scene,onLoaded:()=>void){
 const group=new THREE.Group();group.name='Five-person portrait gallery';scene.add(group);
 let disposed=false;
 const bronze=new THREE.MeshStandardMaterial({color:'#ab8860',metalness:.72,roughness:.32});
 const charcoal=new THREE.MeshStandardMaterial({color:'#22232a',roughness:.8});
 const linen=new THREE.MeshStandardMaterial({color:'#e6decc',roughness:.95});
 const innerEdge=new THREE.MeshStandardMaterial({color:'#5a4735',metalness:.5,roughness:.42});
 const warm=new THREE.MeshStandardMaterial({color:'#ffe4b8',emissive:'#ffd39a',emissiveIntensity:1.6});
 function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,parent=group){
  const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,.018),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 }
 const labels:{canvas:HTMLCanvasElement,texture:THREE.CanvasTexture,text:string,size:number}[]=[];
 function textLabel(text:string,w:number,h:number,size:number,x:number,y:number,z:number,parent=group){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  labels.push({canvas,texture,text,size});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
  mesh.position.set(x,y,z);parent.add(mesh);
 }
 function paintLabels(){
  if(disposed)return;
  for(const {canvas,texture,text,size} of labels){
   const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#ead6b3';ctx.font=`500 ${size}px "Noto Sans Thai", sans-serif`;
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,canvas.width/2,canvas.height/2,canvas.width*.94);texture.needsUpdate=true;
  }
  onLoaded();
 }
 // Layered perimeter, inset panel and projecting lower ledge catch light naturally.
 box(5.72,5.72,.24,3.9,2.95,-5.28,innerEdge);
 box(5.5,5.52,.18,3.9,2.95,-5.12,charcoal);
 for(const x of [1.2,6.6])box(.025,5.42,.03,x,2.95,-5.01,bronze);
 for(let i=0;i<10;i++)box(.012,4.78,.022,1.3+i*.57,2.61,-5.01,innerEdge);
 box(5.35,.12,.64,3.9,.39,-4.92,bronze);
 box(5.1,.22,.48,3.9,.2,-4.97,charcoal);
 box(5.05,.025,.025,3.9,.31,-4.68,warm);
 for(const x of [1.52,6.28])box(.07,.27,.35,x,.14,-4.95,innerEdge);
 textLabel('สร้างโดย',2.4,.43,142,3.9,5.36,-4.99);
 box(1.05,.016,.016,1.94,5.36,-4.99,bronze);
 box(1.05,.016,.016,5.86,5.36,-4.99,bronze);
 const loader=new THREE.TextureLoader();
 for(const {id,name,x,y} of studioTeam){
  const frame=new THREE.Group();frame.name='Portrait '+name;frame.position.set(x,y,-4.84);group.add(frame);
  box(1.4,1.78,.14,0,0,0,charcoal,frame);
  box(1.29,1.67,.035,0,0,.085,innerEdge,frame);
  box(1.23,1.61,.025,0,0,.11,linen,frame);
  for(const side of [-1,1]){
   box(.045,1.78,.065,side*.68,0,.102,bronze,frame);
   box(1.4,.045,.065,0,side*.867,.102,bronze,frame);
  }
  const mat=new THREE.MeshBasicMaterial({toneMapped:false});
  const photo=new THREE.Mesh(new THREE.PlaneGeometry(1.07,1.4),mat);
  photo.position.z=.13;photo.name='Original portrait '+name;frame.add(photo);
  const texture=loader.load('/welcome/portraits/'+id+'.webp',()=>{
   if(disposed){texture.dispose();return}
   const ratio=texture.image.width/texture.image.height;
   photo.scale.set(Math.min(1,ratio/(1.07/1.4)),Math.min(1,(1.07/1.4)/ratio),1);onLoaded();
  });
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;mat.map=texture;
  // A narrow glazing highlight leaves every face unobscured.
  const shine=new THREE.Mesh(new THREE.PlaneGeometry(.022,1.35),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.1,depthWrite:false}));
  shine.position.set(-.516,0,.134);frame.add(shine);
  box(1.14,.23,.035,0,-1.035,.04,innerEdge,frame);
  box(1.09,.19,.018,0,-1.035,.066,charcoal,frame);
  textLabel(name,1.02,.19,139,0,-1.027,.08,frame);
 }
 // Modeled lamp arms and diffusers; only one unshadowed light for the whole board.
 for(const x of [2.2,3.9,5.6]){
  box(.1,.12,.04,x,4.92,-4.98,bronze);
  box(.025,.025,.26,x,4.92,-4.84,bronze);
  box(.65,.05,.12,x,4.9,-4.69,bronze);
  box(.56,.012,.085,x,4.867,-4.69,warm);
 }
 const wash=new THREE.PointLight(0xffd8a8,7,7,2);wash.position.set(3.9,5.2,-3.75);group.add(wash);
 paintLabels();
 // Canvas labels must also use the loaded Thai font on a cold page load.
 void document.fonts.load('500 36px "Noto Sans Thai"').then(paintLabels);
 // Geometry/material/texture disposal is owned by the scene; guard late callbacks here.
 return ()=>{disposed=true};
}
