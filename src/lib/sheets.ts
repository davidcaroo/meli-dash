import Papa from 'papaparse';
import { Log, Mensaje, Orden, Producto, ShopifyOrder, Reputacion } from './types';

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID;
const GID_PRODUCTOS = process.env.NEXT_PUBLIC_GID_PRODUCTOS;
const GID_ORDENES = process.env.NEXT_PUBLIC_GID_ORDENES;
const GID_MENSAJES = process.env.NEXT_PUBLIC_GID_MENSAJES;
const GID_LOGS = process.env.NEXT_PUBLIC_GID_LOGS;

// Shopify
const SHOPIFY_SHEET_ID = process.env.NEXT_PUBLIC_SHOPIFY_SHEET_ID;
const GID_SHOPIFY = process.env.NEXT_PUBLIC_GID_SHOPIFY;

// Reputacion
const GID_REPUTACION = process.env.NEXT_PUBLIC_GID_REPUTACION;

const getUrl = (gid: string, customSheetId?: string) => 
  `https://docs.google.com/spreadsheets/d/${customSheetId || SHEET_ID}/export?format=csv&gid=${gid}`;

async function fetchCSV<T = Record<string, unknown>>(gid: string, customSheetId?: string): Promise<T[]> {
  const currentSheetId = customSheetId || SHEET_ID;
  if (!currentSheetId || !gid) {
    console.error('Missing SHEET_ID or GID');
    return [];
  }

  const url = getUrl(gid, customSheetId);
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
      shipping_id: String(item.shipping_id || item.envio || '').trim(),
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

export async function getShopifyOrders(): Promise<ShopifyOrder[]> {
  const data = await fetchCSV<any>(GID_SHOPIFY!, SHOPIFY_SHEET_ID);
  return data.map((item: any, index: number) => {
    // Parse "Total Pagado" like "$56,410.00"
    const rawTotal = String(item["Total Pagado"] || '0');
    const cleanTotal = rawTotal.replace(/[$,]/g, '');
    const total = parseFloat(cleanTotal) || 0;

    // Parse Date "dd/mm/yyyy" to ISO "yyyy-mm-dd" for easier processing
    const rawDate = String(item["Fecha"] || '').trim();
    let isoDate = '';
    
    if (rawDate) {
      // Handle dd/mm/yyyy
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      } 
      // Handle yyyy-mm-dd (if already in ISO)
      else if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        isoDate = rawDate;
      }
    }

    return {
      id: `shopify-${index}`,
      cliente: item["Nombre Cliente"] || '',
      telefono: item["Telefono"] || '',
      direccion: item["Direccion"] || '',
      producto: item["Nombre de productos"] || '',
      ean: item["EAN"] || '',
      detalles: item["Otros Detalles"] || '',
      cantidad: parseInt(item["Cantidad Pares"]) || 0,
      estado: item["Listado"] || 'Nuevo',
      guia: item["No Guia"] || '',
      fecha: isoDate || rawDate,
      total,
      rowIndex: index + 2
    };
  }) as ShopifyOrder[];
}

export async function getReputacion(): Promise<Reputacion[]> {
  const data = await fetchCSV<any>(GID_REPUTACION!);
  return data.map((item: any) => ({
    ...item,
    ventas_completadas: Number(item.ventas_completadas) || 0,
    cancelaciones: Number(item.cancelaciones) || 0,
    reclamos: Number(item.reclamos) || 0,
    calificacion_positiva: parseFloat(item.calificacion_positiva) || 0,
    calificacion_negativa: parseFloat(item.calificacion_negativa) || 0,
    calificacion_neutra: parseFloat(item.calificacion_neutra) || 0,
  })) as Reputacion[];
}
