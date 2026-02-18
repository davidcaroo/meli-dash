# MELI Dashboard - Mercado Libre Management

Un dashboard moderno y eficiente para la gestión de Mercado Libre, integrado directamente con Google Sheets.

## Características

- 📊 **Dashboard General**: Resumen de métricas clave de todas las secciones.
- 📦 **Gestión de Productos**: Tabla avanzada con filtros por estado, categoría y búsqueda. Sincronización de stock en tiempo real.
- 💰 **Ventas y Órdenes**: Seguimiento de ventas con gráficos dinámicos (Recharts), paginación y filtros de fecha.
- 💬 **Centro de Mensajes**: Gestión de preguntas y mensajes con indicadores de urgencia (>24h).
- 📜 **Logs de Sistema**: Monitoreo de automatizaciones n8n con resaltado de errores y copia de detalles.
- 🌓 **Modo Oscuro**: Soporte nativo para temas claro y oscuro.
- 📱 **Responsive**: Diseño optimizado para desktop y mobile (bottom navigation).
- 🔄 **Auto-refresh**: Actualización automática de datos cada 5 minutos.

## Requisitos Previos

Necesitas un Google Sheet con 4 hojas publicadas como CSV. La URL debe seguir este patrón:
`https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}`

## Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_SHEET_ID=tu_sheet_id_aqui
NEXT_PUBLIC_GID_PRODUCTOS=gid_de_la_hoja_productos
NEXT_PUBLIC_GID_ORDENES=gid_de_la_hoja_ordenes
NEXT_PUBLIC_GID_MENSAJES=gid_de_la_hoja_mensajes
NEXT_PUBLIC_GID_LOGS=gid_de_la_hoja_logs
```

## Estructura de las Hojas

### Hoja 1: PRODUCTOS
`id | titulo | precio | stock | estado | categoria | fecha_actualizacion | url`

### Hoja 2: ÓRDENES/VENTAS
`id | fecha | comprador | email | producto | cantidad | precio_unit | total | estado | envio`

### Hoja 3: MENSAJES/PREGUNTAS
`id | fecha | comprador | producto | mensaje | respondido | respuesta | fecha_respuesta`

### Hoja 4: LOGS DE N8N
`id | fecha | flujo | accion | estado | detalle | duracion_ms`

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy en Vercel

Simplemente conecta tu repositorio a Vercel y configura las variables de entorno mencionadas arriba.
