import type { MetadataRoute } from 'next';
import { studio, services } from './data';
export default function sitemap():MetadataRoute.Sitemap{return ['','/uslugi-i-tseny',...services.map(s=>'/uslugi/'+s.id),'/privacy','/consent'].map(path=>({url:studio.origin+path,changeFrequency:'monthly' as const,priority:path===''?1:.7}))}
