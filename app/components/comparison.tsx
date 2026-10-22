'use client';

import { useEffect, useRef, useState } from 'react';
import { services } from '../data';
import { ArrowDown, ArrowUpRight, MoveHorizontal } from 'lucide-react';

export const comparisonCases = [
  {id:'polish',service:'polirovka',title:'Полировка',subtitle:'Снова видеть глубину цвета.',description:'Мелкие следы мойки рассеивают свет и делают лак мутным. Полировка помогает скорректировать дефекты и вернуть отражениям чёткость.',before:'Микроцарапины и мутные отражения',after:'Чистые линии и глубокий блеск'},
  {id:'chrome',service:'antikhrom',title:'Антихром',subtitle:'Характер решают детали.',description:'Светлая решётка меняет настроение автомобиля. Чёрные элементы собирают экстерьер в цельный, сдержанный образ.',before:'Хромированные элементы',after:'Глянцевый чёрный'},
  {id:'interior',service:'khimchistka-salona',title:'Химчистка',subtitle:'Вернуть ощущение чистоты.',description:'Уход за сиденьями и обивкой начинается с оценки материалов и загрязнений. Объём очистки и необходимость разбора согласовываем отдельно.',before:'Пыль и повседневные загрязнения',after:'Чистая поверхность и естественная фактура'},
  {id:'film',service:'broneplenka',title:'Бронеплёнка',subtitle:'Защита, которая не спорит с формой.',description:'Прозрачная защитная плёнка повторяет геометрию кузова. После нанесения она помогает беречь покрытие, сохраняя внешний вид автомобиля.',before:'Нанесение прозрачной плёнки',after:'Готовая поверхность'},
];

export function Comparison({onBook}:{onBook:(service:string,comment?:string)=>void}) {
  const [selected,setSelected]=useState(0);
  const [position,setPosition]=useState(50);
  const current=comparisonCases[selected];
  const isFilm=current.id==='film';
  const section=useRef<HTMLElement>(null);
  const service=services.find(item=>item.id===current.service)!;
  const displayPrice=current.id==='chrome'?service.rows[0].value:service.price;
  useEffect(()=>{const node=section.current;if(!node)return;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){comparisonCases.forEach(item=>["before","after"].forEach(state=>{const image=new Image();image.decoding="async";image.src="/images/comparison/"+item.id+"-"+state+".webp"}));observer.disconnect()}},{rootMargin:"350px"});observer.observe(node);return()=>observer.disconnect()},[]);

  return <section ref={section} className="section comparison-v2" id="results">
    <div className="container">
      <div className="results-heading">
        <div><p className="eyebrow"><span>03</span>РАЗНИЦА В ДЕТАЛЯХ</p><h2>Разница, которую<br/><span>можно рассмотреть.</span></h2></div>
        <p>Один ракурс. Два состояния.<br/>Двигайте разделитель, чтобы сравнить.</p>
      </div>

      <div className="results-tabs" role="tablist" aria-label="Услуга для сравнения">
        {comparisonCases.map((item,index)=><button key={item.id} id={'result-tab-'+item.id} type="button" role="tab" aria-selected={selected===index} aria-controls="result-panel" tabIndex={selected===index?0:-1} onClick={()=>{setSelected(index);setPosition(50)}} onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const next=(selected+(event.key==='ArrowRight'?1:-1)+comparisonCases.length)%comparisonCases.length;setSelected(next);setPosition(50);document.getElementById('result-tab-'+comparisonCases[next].id)?.focus()}}} className={selected===index?'active':''}><small>0{index+1}</small>{item.title}<ArrowUpRight size={16}/></button>)}
      </div>

      <div className="results-layout" id="result-panel" role="tabpanel" aria-labelledby={'result-tab-'+current.id}>
        <div className="results-media">
          <div className="results-canvas">
            <img className="results-photo" src={'/images/comparison/'+current.id+'-after.webp'} alt={'Демонстрационный результат: '+current.after} width="1536" height="1024" loading="lazy"/>
            <div className="results-before" style={{clipPath:`inset(0 ${100-position}% 0 0)`}}>
              <img className="results-photo" src={'/images/comparison/'+current.id+'-before.webp'} alt={'Демонстрационное исходное состояние: '+current.before} width="1536" height="1024" loading="lazy"/>
            </div>
            <span className="results-corner results-corner-left">{isFilm?'НАНЕСЕНИЕ':'ДО'}</span>
            <span className="results-corner results-corner-right">{isFilm?'РЕЗУЛЬТАТ':'ПОСЛЕ'}</span>
            <div className="results-handle" style={{left:position+'%'}}><span><MoveHorizontal size={21}/></span></div>
            <input className="results-range" type="range" min="0" max="100" value={position} onChange={e=>setPosition(+e.target.value)} aria-label="Сравнить исходное состояние и результат" aria-valuetext={`${position}% исходного состояния`}/>
          </div>
          <div className="results-captions"><span>{current.before}</span><ArrowDown size={14}/><span>{current.after}</span></div>
        </div>

        <aside className="results-story" key={current.id}>
          <span className="results-story-index">0{selected+1} / 04</span>
          <div><p className="results-service">{current.title}</p><h3>{current.subtitle}</h3><p className="results-description">{current.description}</p></div>
          <div className="results-story-bottom"><div className="results-price"><span>СТОИМОСТЬ ПО ПРАЙСУ</span><strong>{displayPrice}</strong></div><button className="button button-red" onClick={()=>onBook(current.service,'Интересует услуга из блока сравнения: '+current.title)}>Обсудить услугу<ArrowUpRight size={18}/></button><a href={'/uslugi/'+current.service} className="results-more">Подробнее об услуге<ArrowUpRight size={15}/></a></div>
        </aside>
      </div>
      <p className="results-demo-note"><span/>Иллюстрация эффекта, созданная с помощью AI. Это демонстрация, а не фотографии работ ПроСтиль.</p>
    </div>
  </section>;
}


