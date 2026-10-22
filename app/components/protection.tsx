'use client';
import { useState } from 'react';
import { ArrowUpRight, Plus, ShieldCheck } from 'lucide-react';
import { images } from '../data';
import { protectionCanvas as canvas, protectionZones as zones } from '../protection-zones';

export function Protection({onBook}:{onBook:(service:string,comment?:string)=>void}){
  const [active,setActive]=useState('hood');
  const selected=zones.find(zone=>zone.id===active)!;
  // Draw large panels first so small zones (handles and mirrors) remain directly selectable.
  const drawOrder=[...zones].sort((a,b)=>Number(['handles','mirrors','sills'].includes(a.id))-Number(['handles','mirrors','sills'].includes(b.id)));
  return <section className="protection section" id="protection">
    <div className="container">
      <div className="section-intro reveal"><div><p className="eyebrow"><span>02</span>ТЕХНОЛОГИЯ ЗАЩИТЫ</p><h2>Невидимая защита.<br/><span>Видимый результат.</span></h2></div><div className="intro-side"><p>Защитная плёнка помогает сохранять внешний вид кузова и уменьшает риск повреждений от повседневной эксплуатации.</p></div></div>
      <div className="protection-grid">
        <div className="car-explorer protection-explorer reveal" role="group" aria-label="Интерактивная схема зон оклейки BMW M5 F90">
          <svg className="protection-canvas" viewBox={`0 0 ${canvas.width} ${canvas.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <image href={images.hero} {...canvas.image} preserveAspectRatio="xMinYMin meet"/>
            {drawOrder.map(zone=><g key={zone.id} className={'protection-zone '+(active===zone.id?'is-active':'')} data-zone={zone.id} onPointerEnter={()=>setActive(zone.id)} onClick={()=>setActive(zone.id)}>{zone.paths.map((path,index)=><path key={index} d={path}/>)}</g>)}
          </svg>
          {zones.map(zone=><button key={zone.id} className={'hotspot '+(active===zone.id?'active':'')} style={{left:`${zone.marker.x/canvas.width*100}%`,top:`${zone.marker.y/canvas.height*100}%`}} onPointerEnter={()=>setActive(zone.id)} onFocus={()=>setActive(zone.id)} onClick={()=>setActive(zone.id)} aria-label={'Зона оклейки: '+zone.name} aria-pressed={active===zone.id}><Plus size={14}/></button>)}
          <span className="explorer-label"><span className="live-dot"/>PPF / ЗОНЫ ОКЛЕЙКИ</span>
        </div>
        <div className="zone-info reveal">
          <span className="eyebrow">ВЫБЕРИТЕ ДЕТАЛЬ НА АВТОМОБИЛЕ</span>
          <div className="zone-tabs">{zones.map(zone=><button key={zone.id} className={active===zone.id?'active':''} onClick={()=>setActive(zone.id)} aria-pressed={active===zone.id}>{zone.name}</button>)}</div>
          <div className="zone-description" aria-live="polite"><ShieldCheck size={28}/><h3>{selected.name}</h3><p>{selected.text}</p></div>
          <p className="fine-print">Схема показывает возможные зоны оклейки. Состав каждого пакета согласовывается отдельно.</p>
          <button className="text-link" onClick={()=>onBook('zony-riska','Хочу уточнить состав пакета защиты. Интересующая зона: '+selected.name)}>Подобрать защиту<ArrowUpRight size={17}/></button>
        </div>
      </div>
    </div>
  </section>;
}
