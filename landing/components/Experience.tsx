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
   const mm=gsap.matchMedia();let lenis:InstanceType<typeof Lenis>|null=null;
   mm.add('(min-width: 901px)',()=>{
    lenis=new Lenis({duration:1.05,smoothWheel:true,anchors:true});lenis.on('scroll',ScrollTrigger.update);
    const tick=(time:number)=>lenis?.raf(time*1000);gsap.ticker.add(tick);
    const hero=document.querySelector('.hero')!;
    gsap.to('.hero-content',{y:-85,opacity:.2,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom 20%',scrub:true}});
    gsap.to('.glass-note',{y:-90,rotation:3,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1}});
    const track=document.querySelector<HTMLElement>('.mode-track')!;
    const distance=()=>Math.max(0,track.scrollWidth-document.querySelector('.mode-stage')!.clientWidth+64);
    gsap.to(track,{x:()=>-distance(),ease:'none',scrollTrigger:{id:'learning-gallery',trigger:'.mode-stage',start:'top top',end:()=>'+='+distance(),pin:true,scrub:1,invalidateOnRefresh:true,onUpdate:self=>{const bar=document.querySelector<HTMLElement>('.mode-progress span');if(bar)bar.style.transform=`scaleX(${self.progress})`}}});
    gsap.fromTo('.book-object',{rotateY:-28,rotateZ:-9},{rotateY:-8,rotateZ:0,ease:'none',scrollTrigger:{trigger:'.book-intro',start:'top bottom',end:'bottom top',scrub:1}});
    const stage=document.querySelector<HTMLElement>('.mode-stage')!;
    const focusCard=(event:FocusEvent)=>{const card=(event.target as HTMLElement).closest('.mode-card');if(!card)return;stage.scrollLeft=0;const index=Array.from(track.children).indexOf(card);const trigger=ScrollTrigger.getById('learning-gallery');if(!trigger)return;const target=trigger.start+(trigger.end-trigger.start)*index/Math.max(1,track.children.length-1);if(lenis)lenis.scrollTo(target,{immediate:true});else window.scrollTo(0,target)};
    stage.addEventListener('focusin',focusCard);
    return()=>{stage.removeEventListener('focusin',focusCard);gsap.ticker.remove(tick);lenis?.destroy();lenis=null};
   });
   const hero=document.querySelector<HTMLElement>('.hero-art')!,host=document.getElementById('dragon-scene')!;
   let scene:ReturnType<typeof import('./dragon-scene').createDragonScene>|null=null;
   const sceneTrigger=ScrollTrigger.create({trigger:'.hero',start:'top top',end:'bottom top',onUpdate:self=>scene?.setProgress(self.progress)});
   const pointer=(event:PointerEvent)=>{if(event.pointerType==='touch')return;const r=hero.getBoundingClientRect();scene?.setPointer(Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1)))};
   const leave=()=>scene?.setPointer(0,0);hero.addEventListener('pointermove',pointer);hero.addEventListener('pointerleave',leave);
   cleanup=()=>{sceneTrigger.kill();scene?.dispose();mm.revert();hero.removeEventListener('pointermove',pointer);hero.removeEventListener('pointerleave',leave);document.querySelector<HTMLElement>('.mode-progress span')?.style.removeProperty('transform')};
   try{const {createDragonScene}=await import('./dragon-scene');if(!cancelled)scene=createDragonScene(host)}catch{host.classList.remove('scene-ready')}
   if(cancelled)return;scene?.setProgress(sceneTrigger.progress);await document.fonts.ready;if(!cancelled)ScrollTrigger.refresh();
  }
  const timer=setTimeout(()=>{start().catch(()=>{cleanup();document.documentElement.dataset.motion='off'})},180);
  return()=>{cancelled=true;clearTimeout(timer);cleanup()};
 },[enabled,mounted]);
 return <button className="motion-control" aria-pressed={enabled} onClick={()=>{const next=!enabled;setEnabled(next);try{localStorage.setItem('cc-landing-motion',next?'on':'off')}catch{}}}>{enabled?<Pause size={13}/>:<Play size={13}/>}<span>{enabled?'ลดการเคลื่อนไหว':'เปิดการเคลื่อนไหว'}</span></button>;
}
