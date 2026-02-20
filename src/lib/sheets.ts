import Papa from 'papaparse';
import { Log, Mensaje, Orden, Producto } from './types';

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID;
const GID_PRODUCTOS = process.env.NEXT_PUBLIC_GID_PRODUCTOS;
const GID_ORDENES = process.env.NEXT_PUBLIC_GID_ORDENES;
const GID_MENSAJES = process.env.NEXT_PUBLIC_GID_MENSAJES;
const GID_LOGS = process.env.NEXT_PUBLIC_GID_LOGS;

const getUrl = (gid: string) => 
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

async function fetchCSV<T = Record<string, unknown>>(gid: string): Promise<T[]> {
  if (!SHEET_ID || !gid) {
    console.error('Missing SHEET_ID or GID');
    return [];
  }

  const url = getUrl(gid);
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.statusText}`);
  }

  const csvText = await response.text();
  
  return new Promise<T[]>((resolve, reject) => {
    Papa.parse<T>(csvText, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error: Error) => reject(error),
    });
  });
}

export async function getProductos(): Promise<Producto[]> {
  const data = await fetchCSV<any>(GID_PRODUCTOS!);
  return data.map((item: any) => ({
    ...item,
    precio: Number(item.precio) || 0,
    stock: Number(item.stock) || 0,
    estado: String(item.estado || '').toLowerCase() || 'paused',
    fecha_actualizacion: String(item.fecha_actualizacion || ''),
  })) as Producto[];
}

export async function getOrdenes(): Promise<Orden[]> {
  const data = await fetchCSV<any>(GID_ORDENES!);
  return data.map((item: any) => {
    return {
      ...item,
      fecha: String(item.fecha || ''),
      cantidad: Number(item.cantidad) || 0,
      precio_unit: Number(item.precio_unit) || 0,
      total: Number(item.total) || 0,
      estado: String(item.estado || '').toLowerCase() || 'pending',
      envio: String(item.envio || ''),
      sku: String(item.sku || '').trim() || undefined,
    };
  }) as Orden[];
}

export async function getMensajes(): Promise<Mensaje[]> {
  const data = await fetchCSV<any>(GID_MENSAJES!);
  return data.map((item: any) => ({
    ...item,
    fecha: String(item.fecha || ''),
    respondido: item.respondido === 'true' || item.respondido === true || item.respondido === 'SI',
  })) as Mensaje[];
}

export async function getLogs(): Promise<Log[]> {
  const data = await fetchCSV<any>(GID_LOGS!);
  return data.map((item: any) => ({
    ...item,
    fecha: String(item.fecha || ''),
    estado: String(item.estado || '').toLowerCase() || 'info',
    duracion_ms: Number(item.duracion_ms) || 0,
  })) as Log[];
}
