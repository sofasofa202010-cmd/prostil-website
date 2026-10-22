import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { services } from '../../data';
import { ServicePage } from '../../studio';
export function generateStaticParams(){return services.map(s=>({slug:s.id}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const s=services.find(s=>s.id===slug);return {title:s?`${s.name} в Новосибирске — ПроСтиль`:'Услуга не найдена',description:s?.description,alternates:{canonical:'/uslugi/'+slug}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const s=services.find(s=>s.id===slug);if(!s)notFound();return <ServicePage service={s}/>}

