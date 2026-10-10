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
   const [{gsap},{ScrollTrigger},{default:Lenis}]=await Promise.all([import('gsap'),import('gsap/ScrollTrigger'),import('lenis')]);if(cancelled)return;
   gsap.registerPlugin(ScrollTrigger);
   const reading=gsap.to('.reading-progress',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
   const mm=gsap.matchMedia();let lenis:InstanceType<typeof Lenis>|null=null;
   mm.add('(min-width: 901px)',()=>{
    lenis=new Lenis({duration:.65,smoothWheel:true,anchors:true});lenis.on('scroll',ScrollTrigger.update);
    const tick=(time:number)=>lenis?.raf(time*1000);gsap.ticker.add(tick);
    const hero=document.querySelector('.hero')!;
    gsap.to('.hero-content',{y:-35,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom 20%',scrub:true}});
    gsap.to('.glass-note',{y:-90,rotation:3,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1}});
    gsap.fromTo('.book-object',{rotateY:-28,rotateZ:-9},{rotateY:-8,rotateZ:0,ease:'none',scrollTrigger:{trigger:'.book-intro',start:'top bottom',end:'bottom top',scrub:1}});
    return()=>{gsap.ticker.remove(tick);lenis?.destroy();lenis=null};
   });
   const hero=document.querySelector<HTMLElement>('.hero-art')!,host=document.getElementById('dragon-scene')!;
   let scene:ReturnType<typeof import('./dragon-scene').createDragonScene>|null=null;
   const sceneTrigger=ScrollTrigger.create({trigger:'.hero',start:'top top',end:'bottom top',onUpdate:self=>scene?.setProgress(self.progress)});
   const pointer=(event:PointerEvent)=>{if(event.pointerType==='touch')return;const r=hero.getBoundingClientRect();scene?.setPointer(Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1)))};
   const leave=()=>scene?.setPointer(0,0);hero.addEventListener('pointermove',pointer);hero.addEventListener('pointerleave',leave);
   cleanup=()=>{reading.scrollTrigger?.kill();reading.revert();sceneTrigger.kill();scene?.dispose();mm.revert();hero.removeEventListener('pointermove',pointer);hero.removeEventListener('pointerleave',leave);document.querySelector<HTMLElement>('.hero-art')?.style.removeProperty('--pointer-x')};
   try{const {createDragonScene}=await import('./dragon-scene');if(!cancelled)scene=createDragonScene(host)}catch{host.classList.remove('scene-ready')}
   if(cancelled)return;scene?.setProgress(sceneTrigger.progress);await document.fonts.ready;if(!cancelled)ScrollTrigger.refresh();
  }
  const timer=setTimeout(()=>{start().catch(()=>{cleanup();document.documentElement.dataset.motion='off'})},180);
  return()=>{cancelled=true;clearTimeout(timer);cleanup()};
 },[enabled,mounted]);
 return <><div className="reading-progress" aria-hidden="true"/><button className="motion-control" aria-pressed={enabled} onClick={()=>{const next=!enabled;setEnabled(next);try{localStorage.setItem('cc-landing-motion',next?'on':'off')}catch{}}}>{enabled?<Pause size={13}/>:<Play size={13}/>}<span>{enabled?'ลดการเคลื่อนไหว':'เปิดการเคลื่อนไหว'}</span></button></>;
}
