import { TrackingInfo, VariantesResponse } from './types';

const N8N_PRODUCTOS = process.env.NEXT_PUBLIC_N8N_PRODUCTOS_URL!;
const N8N_RESPONDER = process.env.NEXT_PUBLIC_N8N_RESPONDER_URL!;
const N8N_TRACKING = process.env.NEXT_PUBLIC_N8N_TRACKING_URL!;
const N8N_ETIQUETA = process.env.NEXT_PUBLIC_N8N_ETIQUETA_URL!;

async function callWebhook(url: string, body: object) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return await res.json().catch(() => ({ success: true }));
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado');
    }
    throw error;
  }
}

export const mlActions = {
  pausarProducto: (item_id: string) =>
    callWebhook(N8N_PRODUCTOS, { accion: 'pausar', item_id }),

  activarProducto: (item_id: string) =>
    callWebhook(N8N_PRODUCTOS, { accion: 'activar', item_id }),

  editarPrecio: (item_id: string, precio: number) =>
    callWebhook(N8N_PRODUCTOS, { accion: 'editar_precio', item_id, valor: precio }),

  editarStock: (item_id: string, stock: number, variation_id?: number) =>
    callWebhook(N8N_PRODUCTOS, { 
      accion: 'editar_stock', 
      item_id, 
      valor: stock,
      variation_id: variation_id || 0 
    }),

  responderPregunta: (question_id: string, respuesta: string) =>
    callWebhook(N8N_RESPONDER, { question_id, respuesta }),

  obtenerTracking: async (shipping_id: string): Promise<TrackingInfo> => {
    const data = await callWebhook(N8N_TRACKING, { shipping_id });
    return {
      estado_actual: data.estado_actual || '',
      fecha_estimada: data.fecha_estimada || '',
      historial: Array.isArray(data.historial) ? data.historial : []
    };
  },

  obtenerEtiqueta: async (shipping_id: string): Promise<Blob> => {
    const res = await fetch(N8N_ETIQUETA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_id }),
    });

    const contentType = res.headers.get('content-type');

    if (!res.ok || (contentType && contentType.includes('application/json'))) {
      let mensajeError = 'No se pudo generar el PDF';
      try {
        const errorData = await res.json();
        mensajeError = errorData.mensaje || errorData.error || mensajeError;
      } catch (e) {
        // Si no es JSON, intentamos leer como texto
        const textError = await res.text().catch(() => '');
        if (textError) mensajeError = textError.substring(0, 100);
      }
      throw new Error(mensajeError);
    }

    return await res.blob();
  },

  getVariantes: (item_id: string): Promise<VariantesResponse> => 
    callWebhook(N8N_PRODUCTOS, { accion: 'get_variantes', item_id }),

  editarStockVariante: (item_id: string, variation_id: number, nuevoStock: number): Promise<{ success: boolean; mensaje: string }> =>
    callWebhook(N8N_PRODUCTOS, {
      accion: 'editar_stock',
      item_id,
      variation_id,
      valor: nuevoStock
    }),
};
