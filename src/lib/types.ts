export interface Producto {
  id: string;
  titulo: string;
  precio: number;
  stock: number;
  estado: "activo" | "pausado" | "cerrado";
  categoria: string;
  fecha_actualizacion: string;
  url: string;
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
  estado: "pagado" | "pendiente" | "cancelado" | "en_proceso" | "enviado";
  envio: string;
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
}
