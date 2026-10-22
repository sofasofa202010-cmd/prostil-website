import type { Metadata } from 'next';
import Admin from './panel';
export const metadata:Metadata={title:'Заявки — ПроСтиль',robots:{index:false,follow:false},alternates:{canonical:'/admin'}};
export default function Page(){return <Admin/>}

