import type { MetadataRoute } from 'next';
import { studio } from './data';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/admin']},sitemap:studio.origin+'/sitemap.xml'}}
