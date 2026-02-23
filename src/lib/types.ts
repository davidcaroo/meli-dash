export interface Producto {
  id: string;
  titulo: string;
  precio: number;
  stock: number;
  estado: 'active' | 'paused' | 'closed' | 'under_review' | 'inactive';
  categoria: string;
  fecha_actualizacion: string;
  url: string;
  imagen?: string;
}

export interface Orden {
  id: string;
  fecha: string;
  comprador: string;
  email: string;
  producto: string;
  cantidad: number;
  precio_unit: number;
  total: number;
  estado: 'paid' | 'pending' | 'cancelled' | 'in_process' | 'shipped' | 'delivered';
  envio: string;
  sku?: string;
  shipping_id?: string;
}

export interface Mensaje {
  id: string;
  fecha: string;
  comprador: string;
  producto: string;
  mensaje: string;
  respondido: boolean;
  respuesta: string;
  fecha_respuesta: string;
}

export interface Log {
  id: string;
  fecha: string;
  flujo: string;
  accion: string;
  estado: "success" | "error" | "warning";
  detalle: string;
  duracion_ms: number;
}

export interface ShopifyOrder {
  id: string; // Internal ID for keys
  cliente: string;
  telefono: string;
  direccion: string;
  producto: string;
  ean: string;
  detalles: string;
  cantidad: number;
  estado: 'Nuevo' | 'Preparado' | 'Despachado' | 'Entregado';
  guia: string;
  fecha: string;
  total: number;
  rowIndex: number;
}

export interface DashboardStats {
  productos: {
    total: number;
    activos: number;
    sinStock: number;
    pausados: number;
  };
  ventas: {
    hoy: number;
    mes: number;
    ingresosMes: number;
    salidasMes: number;
    pendientes: number;
  };
  mensajes: {
    sinResponder: number;
  };
  logs: {
    ejecucionesHoy: number;
    erroresHoy: number;
    tasaExito: number;
  };
  shopify: {
    nuevosHoy: number;
    ingresosMes: number;
    pendientesDespacho: number;
    nuevosTotal: number;
  };
}

export interface TrackingEvent {
  fecha: string;
  descripcion: string;
  estado: 'handling' | 'ready_to_ship' | 'shipped' | 'delivered' | 'not_delivered' | 'cancelled';
}

export interface TrackingInfo {
  estado_actual: string;
  fecha_estimada: string;
  historial: TrackingEvent[];
}

export interface Reputacion {
  fecha: string;
  nivel: 'green' | 'light_green' | 'yellow' | 'orange' | 'red';
  ventas_completadas: number;
  cancelaciones: number;
  reclamos: number;
  calificacion_positiva: number;
  calificacion_negativa: number;
  calificacion_neutra: number;
  potencia: 'Normal' | 'Silver' | 'Gold' | 'Platinum';
}

