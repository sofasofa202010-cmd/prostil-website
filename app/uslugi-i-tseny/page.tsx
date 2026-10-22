import type { Metadata } from 'next';
import { PricingPage } from '../studio';
export const metadata:Metadata={title:'Услуги и цены на детейлинг — ПроСтиль, Новосибирск',description:'Полный прайс ПроСтиль: бронеплёнка, полная оклейка, зоны риска, тонировка, полировка, антихром и химчистка.',alternates:{canonical:'/uslugi-i-tseny'}};
export default function Page(){return <PricingPage/>}

