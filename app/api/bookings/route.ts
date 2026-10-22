import { getStore } from '@netlify/blobs';
import { z } from 'zod';
import { services, studio } from '../../data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Booking = {id:string; name:string; phone:string; car:string; service:string; date:string; comment:string; status:string; created_at:number; ip_hash:string; consent_version:string};
const schema = z.object({
 name:z.string().trim().min(2).max(80),
 phone:z.string().max(22).transform(v=>v.replace(/\D/g,'')).refine(v=>/^[78]\d{10}$/.test(v),'Укажите российский номер телефона из 11 цифр.'),
 car:z.string().trim().min(2).max(120),
 service:z.string().refine(v=>services.some(s=>s.id===v)),
 date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 comment:z.string().trim().max(1000).default(''),
 consent:z.literal('yes'),website:z.string().max(0).default(''),started:z.number().finite()
});
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const store=()=>getStore({name:'prostil-bookings',consistency:'strong'});
async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function admin(request:Request){const secret=process.env.ADMIN_KEY;if(!secret||secret.length<16)return false;const value=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';if(!value||value.length>200)return false;return (await digest(value))===(await digest(secret))}
async function allBookings(){const blobs=(await store().list({prefix:'booking/'})).blobs;const results=await Promise.all(blobs.map(b=>store().get(b.key,{type:'json',consistency:'strong'}) as Promise<Booking|null>));return results.filter((r):r is Booking=>!!r).sort((a,b)=>b.created_at-a.created_at)}
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if(!origin||![new URL(request.url).origin,studio.origin].includes(origin))return reply({ok:false,error:'Недопустимый источник запроса.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return reply({ok:false,error:'Неверный формат запроса.'},415);
  if(Number(request.headers.get('content-length')||0)>10000)return reply({ok:false,error:'Слишком большой запрос.'},413);
  const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>10000)return reply({ok:false,error:'Слишком большой запрос.'},413);
  let body:unknown;try{body=JSON.parse(raw)}catch{return reply({ok:false,error:'Неверный формат данных.'},400)}
  const parsed=schema.safeParse(body);if(!parsed.success)return reply({ok:false,error:'Проверьте поля формы, номер телефона и согласие на обработку данных.'},400);
  const d=parsed.data,now=Date.now();if(now-d.started<2000||now-d.started>86400000)return reply({ok:false,error:'Обновите форму и повторите отправку.'},400);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Novosibirsk',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dt=new Date(d.date+'T00:00:00Z');if(!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==d.date||d.date<today||dt.getTime()>now+366*86400000)return reply({ok:false,error:'Выберите дату в пределах ближайшего года.'},400);
  if(!process.env.ADMIN_KEY||process.env.ADMIN_KEY.length<16)return reply({ok:false,error:'Приём заявок пока не настроен. Позвоните в студию или напишите в Telegram.'},503);
  const ip=request.headers.get('x-nf-client-connection-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const ipHash=await digest(ip+process.env.ADMIN_KEY);
  const recent=(await allBookings()).filter(b=>b.ip_hash===ipHash&&b.created_at>now-15*60*1000);
  if(recent.length>=3)return reply({ok:false,error:'Слишком много заявок. Повторите через 15 минут или свяжитесь с нами напрямую.'},429);
  const id=crypto.randomUUID();const booking:Booking={id,name:d.name,phone:'+7'+d.phone.slice(1),car:d.car,service:d.service,date:d.date,comment:d.comment,status:'new',created_at:now,ip_hash:ipHash,consent_version:'2026-10-22'};
  await store().setJSON('booking/'+id,booking,{onlyIfNew:true});
  const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_CHAT_ID;
  if(token&&chat){try{const service=services.find(s=>s.id===d.service)?.name;const notified=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:`Новая заявка ПроСтиль\n${d.name}\n${booking.phone}\n${d.car}\n${service}\nЖелаемая дата: ${d.date}\n${d.comment}\nID: ${id}`}),signal:AbortSignal.timeout(5000)});if(!notified.ok)console.error('Booking notification failed; booking retained.')}catch{console.error('Booking notification unavailable; booking retained.')}}
  return reply({ok:true,id},201);
 }catch(e){console.error('Booking request failed:',e instanceof Error?e.message:'unknown');return reply({ok:false,error:'Сервер не смог сохранить заявку. Повторите отправку или свяжитесь со студией напрямую.'},500)}
}
export async function GET(request:Request){if(!await admin(request))return reply({error:'Неверный ключ доступа.'},401);try{const offset=Math.max(0,Math.min(100000,Number(new URL(request.url).searchParams.get('offset'))||0));const bookings=(await allBookings()).slice(offset,offset+50).map(({ip_hash,consent_version,...row})=>row);return reply({bookings})}catch{return reply({error:'Не удалось загрузить заявки.'},500)}}
export async function PATCH(request:Request){if(!await admin(request))return reply({error:'Неверный ключ доступа.'},401);try{const body=await request.json() as {id?:string;status?:string};if(!body.status||!['new','contacted','confirmed','completed','cancelled'].includes(body.status)||typeof body.id!=='string'||!/^[a-f0-9-]{36}$/.test(body.id))return reply({error:'Неверные параметры.'},400);const current=await store().get('booking/'+body.id,{type:'json',consistency:'strong'}) as Booking|null;if(!current)return reply({error:'Заявка не найдена.'},404);await store().setJSON('booking/'+body.id,{...current,status:body.status});return reply({ok:true})}catch{return reply({error:'Не удалось обновить заявку.'},500)}}
