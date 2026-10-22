import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { services, studio } from '../../data';
export const dynamic='force-dynamic';
const schema=z.object({name:z.string().trim().min(2).max(80),phone:z.string().max(22).transform(v=>v.replace(/\D/g,'')).refine(v=>/^[78]\d{10}$/.test(v),'Укажите российский номер телефона из 11 цифр.'),car:z.string().trim().min(2).max(120),service:z.string().refine(v=>services.some(s=>s.id===v)),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),comment:z.string().trim().max(1000).default(''),consent:z.literal('yes'),website:z.string().max(0).default(''),started:z.number().finite()});
function reply(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function admin(request:Request){if(!env.ADMIN_KEY)return false;const value=request.headers.get('Authorization')?.replace(/^Bearer /,'')||'';if(value.length>200)return false;return (await digest(value))===(await digest(env.ADMIN_KEY))}
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if(!origin||![new URL(request.url).origin,studio.origin].includes(origin))return reply({ok:false,error:'Недопустимый источник запроса.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return reply({ok:false,error:'Неверный формат запроса.'},415);
  if(Number(request.headers.get('content-length')||0)>10000)return reply({ok:false,error:'Слишком большой запрос.'},413);
  const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>10000)return reply({ok:false,error:'Слишком большой запрос.'},413);
  let body;try{body=JSON.parse(raw)}catch{return reply({ok:false,error:'Неверный формат данных.'},400)}
  const parsed=schema.safeParse(body);if(!parsed.success)return reply({ok:false,error:'Проверьте поля формы, номер телефона и согласие на обработку данных.'},400);
  const d=parsed.data;const now=Date.now();if(now-d.started<2000||now-d.started>86400000)return reply({ok:false,error:'Обновите форму и повторите отправку.'},400);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Novosibirsk',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const dt=new Date(d.date+'T00:00:00Z');if(!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==d.date||d.date<today||dt.getTime()>now+366*86400000)return reply({ok:false,error:'Выберите дату в пределах ближайшего года.'},400);
  if(!env.DB||!env.ADMIN_KEY)return reply({ok:false,error:'Приём заявок временно недоступен. Позвоните в студию или напишите в Telegram.'},503);
  const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-real-ip')||'local';const ipHash=await digest(ip+env.ADMIN_KEY);const id=crypto.randomUUID();
  const saved=await env.DB.prepare('INSERT INTO bookings (id,name,phone,car,service,date,comment,status,created_at,ip_hash,consent_version) SELECT ?,?,?,?,?,?,?,\'new\',?,?,? WHERE (SELECT COUNT(*) FROM bookings WHERE ip_hash=? AND created_at>?) < 3').bind(id,d.name,'+7'+d.phone.slice(1),d.car,d.service,d.date,d.comment,now,ipHash,'2026-10-22',ipHash,now-15*60*1000).run();
  if(!saved.meta.changes)return reply({ok:false,error:'Слишком много заявок. Повторите через 15 минут или свяжитесь с нами напрямую.'},429);
  if(env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID){try{const service=services.find(s=>s.id===d.service)?.name;const notified=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:`Новая заявка ПроСтиль\n${d.name}\n+7${d.phone.slice(1)}\n${d.car}\n${service}\nЖелаемая дата: ${d.date}\n${d.comment}\nID: ${id}`}),signal:AbortSignal.timeout(5000)});if(!notified.ok)console.error('Booking notification failed; booking retained.')}catch{console.error('Booking notification unavailable; booking retained.')}}
  return reply({ok:true,id},201);
 }catch{console.error('Booking request failed.');return reply({ok:false,error:'Сервер не смог сохранить заявку. Повторите отправку или свяжитесь со студией напрямую.'},500)}
}
export async function GET(request:Request){if(!await admin(request))return reply({error:'Неверный ключ доступа.'},401);if(!env.DB)return reply({error:'База данных недоступна.'},503);try{const url=new URL(request.url);const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('offset'))||0));const result=await env.DB.prepare('SELECT id,name,phone,car,service,date,comment,status,created_at FROM bookings ORDER BY created_at DESC LIMIT 50 OFFSET ?').bind(offset).all();return reply({bookings:result.results})}catch{return reply({error:'Не удалось загрузить заявки.'},500)}}
export async function PATCH(request:Request){if(!await admin(request))return reply({error:'Неверный ключ доступа.'},401);if(!env.DB)return reply({error:'База данных недоступна.'},503);try{const body=await request.json() as {id:string;status:string};if(!['new','contacted','confirmed','completed','cancelled'].includes(body.status)||typeof body.id!=='string'||body.id.length>50)return reply({error:'Неверные параметры.'},400);const result=await env.DB.prepare('UPDATE bookings SET status=? WHERE id=?').bind(body.status,body.id).run();if(!result.meta.changes)return reply({error:'Заявка не найдена.'},404);return reply({ok:true})}catch{return reply({error:'Не удалось обновить заявку.'},500)}}

