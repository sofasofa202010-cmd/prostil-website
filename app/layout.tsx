import type { Metadata } from 'next';
import { studio } from './data';
import './globals.css';
export const metadata: Metadata = {
 metadataBase: new URL(studio.origin),
 title:'ПроСтиль — Детейлинг в Новосибирске | Бронеплёнка, тонировка, полировка',
 description:'ПроСтиль — детейлинг-студия в Новосибирске. Оклейка бронеплёнкой, защита зон риска, тонировка, полировка, антихром и химчистка автомобиля. Зыряновская, 133к3. Запись: +7 (923) 510-79-77.',
 alternates:{canonical:'/'}, openGraph:{title:'ПроСтиль — Совершенство в каждой детали',description:'Защита, уход и эстетика вашего автомобиля в Новосибирске.',locale:'ru_RU',type:'website',images:[{url:'/images/hero.webp',width:1536,height:1024}]}, icons:{icon:'/favicon.svg'},
};
export default function Layout({children}:{children:React.ReactNode}) {
 return <html lang="ru"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'AutoRepair',name:studio.name,url:studio.origin,image:studio.origin+'/images/hero.webp',telephone:studio.phones[0],address:{'@type':'PostalAddress',streetAddress:studio.address,addressLocality:studio.city,addressCountry:'RU'},sameAs:[...studio.telegram,studio.instagram]})}} /></body></html>;
}

