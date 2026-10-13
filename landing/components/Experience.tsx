'use client';
import {useEffect,useState} from 'react';
import {Pause,Play} from 'lucide-react';
export function Experience(){
 const [enabled,setEnabled]=useState(false),[mounted,setMounted]=useState(false);
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');let saved:string|null=null;try{saved=localStorage.getItem('cc-landing-motion')}catch{}const device=navigator as Navigator&{connection?:{saveData?:boolean},deviceMemory?:number};const constrained=device.connection?.saveData||!!device.deviceMemory&&device.deviceMemory<=2;setEnabled(!mq.matches&&saved!=='off'&&(!constrained||saved==='on'));setMounted(true);const change=()=>setEnabled(!mq.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change)},[]);
 useEffect(()=>{
  if(!mounted)return;document.documentElement.dataset.motion=enabled?'on':'off';
  if(!enabled)return;
  let cancelled=false,cleanup=()=>{};
  async function start(){
   const [{gsap},{ScrollTrigger}]=await Promise.all([import('gsap'),import('gsap/ScrollTrigger')]);if(cancelled)return;
   gsap.registerPlugin(ScrollTrigger);
   const reading=gsap.to('.reading-progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
   const mm=gsap.matchMedia();
   mm.add('(min-width: 901px)',()=>{
    const timeline=gsap.timeline({scrollTrigger:{trigger:'.cinematic-stage',start:'top top',end:'bottom bottom',scrub:.65}});
    timeline.to('.hero-wordmark',{scale:1.6,y:-200,opacity:0,duration:.3,ease:'power1.in'},0)
     .to('.hero-content',{y:-60,autoAlpha:0,duration:.22,ease:'none'},0)
     .fromTo('[data-scene-caption="1"]',{y:70,opacity:0},{y:0,opacity:1,duration:.16},.28)
     .to('[data-scene-caption="1"]',{y:-55,opacity:0,duration:.15},.57)
     .fromTo('[data-scene-caption="2"]',{y:60,opacity:0},{y:0,opacity:1,duration:.22},.73);
    // Explicit duration keeps the scroll rig and copy on the same 0–1 clock.
    timeline.to('.scene-meter i',{scaleX:1,duration:1,ease:'none'},0);
    gsap.to('.red-moon',{x:-130,y:100,scale:1.25,ease:'none',scrollTrigger:{trigger:'.cinematic-stage',start:'top top',end:'bottom bottom',scrub:1}});
    gsap.fromTo('.book-object',{rotateY:-28,rotateZ:-9},{rotateY:12,rotateZ:3,ease:'none',scrollTrigger:{trigger:'.book-intro',start:'top bottom',end:'bottom top',scrub:1}});
   });
   const hero=document.querySelector<HTMLElement>('.hero-art')!,host=document.getElementById('learning-scene')!;
   let scene:ReturnType<typeof import('./learning-scene').createLearningScene>|null=null;
   const meter=document.querySelector('.scene-meter b');
   const driver={progress:0};
   const cameraMotion=gsap.to(driver,{progress:1,ease:'none',onUpdate:()=>{scene?.setProgress(driver.progress);if(meter)meter.textContent=`0${Math.min(3,1+Math.floor(driver.progress*3))} / 03`},scrollTrigger:{trigger:'.cinematic-stage',start:'top top',end:()=>innerWidth>900?'bottom bottom':'bottom top',scrub:.65}});
   const sceneTrigger=cameraMotion.scrollTrigger!;
   const pointer=(event:PointerEvent)=>{if(event.pointerType==='touch')return;const r=hero.getBoundingClientRect();scene?.setPointer(Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1)))};
   const leave=()=>scene?.setPointer(0,0);hero.addEventListener('pointermove',pointer);hero.addEventListener('pointerleave',leave);
   let loading=false,attempted=false;
   const visible=()=>{const r=host.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight};
   async function loadScene(){if(cancelled||loading||attempted||!visible())return;loading=true;try{const {createLearningScene}=await import('./learning-scene');if(!cancelled&&visible()){attempted=true;scene=createLearningScene(host);scene?.setProgress(sceneTrigger.progress)}}catch{host.classList.remove('scene-ready')}finally{loading=false}}
   const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))void loadScene()});observer.observe(host);
   cleanup=()=>{observer.disconnect();reading.scrollTrigger?.kill();reading.revert();sceneTrigger.kill();cameraMotion.kill();scene?.dispose();mm.revert();hero.removeEventListener('pointermove',pointer);hero.removeEventListener('pointerleave',leave)};
   await document.fonts.ready;if(!cancelled)ScrollTrigger.refresh();
  }
  const timer=setTimeout(()=>{start().catch(()=>{cleanup();document.documentElement.dataset.motion='off'})},180);
  return()=>{cancelled=true;clearTimeout(timer);cleanup()};
 },[enabled,mounted]);
 return <><div className="reading-progress" aria-hidden="true"/><button className="motion-control" aria-pressed={enabled} onClick={()=>{const next=!enabled;setEnabled(next);try{localStorage.setItem('cc-landing-motion',next?'on':'off')}catch{}}}>{enabled?<Pause size={13}/>:<Play size={13}/>}<span>{enabled?'ลดการเคลื่อนไหว':'เปิดการเคลื่อนไหว'}</span></button></>;
}
