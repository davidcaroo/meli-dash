# Contexto del Proyecto: Meli Integrador (Meli Dash)

Este documento proporciona una visión detallada del proyecto **Meli Integrador**, un centro de control unificado para gestionar integraciones con **Mercado Libre** y **Shopify**. 

## 🏗️ Arquitectura General
El sistema utiliza una arquitectura basada en **Next.js** conectada a fuentes de datos externas simplificadas y automatizaciones en la nube.

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4.
- **Persistencia de Datos**: Google Sheets (utilizado como base de datos técnica mediante exportaciones CSV en tiempo real).
- **Backend de Acciones**: n8n (flujos de automatización que reciben webhooks desde el dashboard).
- **Proxy API**: Rutas de API de Next.js para proteger/enrutar webhooks de Shopify hacia n8n.

---

## 📊 Módulos Implementados

### 1. Dashboard Principal (`/`)
Resumen ejecutivo del negocio que muestra:
- **Estadísticas de Productos**: Cantidad de productos activos, totales y sin stock.
- **Control Financiero**: Ingresos y salidas del mes (calculado desde las órdenes).
- **Resumen Shopify**: Pedidos nuevos y estado de despachos.
- **Estado de Atención**: Cantidad de preguntas pendientes de Mercado Libre.
- **Logs del Sistema**: Tasa de éxito de las automatizaciones diarias ejecutadas por n8n.

### 2. Gestión de Productos (`/productos`)
Interfaz avanzada para el control de inventario en Mercado Libre:
- **Visualización**: Tabla con imágenes, SKU, precios, stock y estado.
- **Acciones Directas**: Pausar/Activar publicaciones con un clic.
- **Edición**: Modals para editar precios y stock de forma masiva o individual.
- **Soporte de Variantes**: Capacidad de gestionar variantes de productos con stocks independientes.
- **Filtros**: Búsqueda por término y filtrado por estado (Activo/Pausado).

### 3. Centro de Mensajes (`/mensajes`)
Gestión de comunicación post-venta y pre-venta de Mercado Libre:
- **Vista de Preguntas**: Listado detallado de consultas de clientes.
- **Respuesta Integrada**: Campo de texto para responder directamente desde el dashboard.
- **Estados**: Indicador visual de si una pregunta ya fue respondida o está pendiente.
- **Multicuentas**: Soporte (si está configurado en el Sheets) para identificar de qué cuenta proviene cada consulta.

### 4. Órdenes y Envíos (`/ordenes`)
Control logístico de ventas de Mercado Libre:
- **Tracking en tiempo real**: Botón para consultar el estado actual del envío vía n8n.
- **Etiquetas**: Descarga de etiquetas de envío.
- **Detalle de Venta**: Visualización de comprador, productos y montos.

### 5. Integración Shopify (`/shopify`)
Seguimiento de pedidos realizados en Shopify:
- **Lectura desde Sheets**: Sincroniza pedidos importados previamente a Google Sheets.
- **Gestión de Estados**: Actualización del estado del pedido (Nuevo, Preparado, Despachado).
- **Visualización Logística**: Muestra EAN, cantidad de productos y dirección de entrega.

### 6. Logs de Automatización (`/logs`)
Bitácora de actividad del backend (n8n):
- Registro de cada acción ejecutada.
- Duración de la tarea y estado (success/error).
- Mensajes de error específicos para depuración.

---

## ⚙️ Conectividad y Webhooks

El frontend no se comunica directamente con las APIs de Mercado Libre o Shopify, sino que delega estas acciones a flujos de **n8n** mediante webhooks configurados en `.env.local`:

| Acción                          | Webhook URL (n8n)               | Función en Código                                         |
| :------------------------------ | :------------------------------ | :-------------------------------------------------------- |
| **Pausar/Activar/Precio/Stock** | `NEXT_PUBLIC_N8N_PRODUCTOS_URL` | `mlActions.pausarProducto`, `mlActions.editarStock`, etc. |
| **Responder Preguntas**         | `NEXT_PUBLIC_N8N_RESPONDER_URL` | `mlActions.responderPregunta`                             |
| **Consultar Tracking**          | `NEXT_PUBLIC_N8N_TRACKING_URL`  | `mlActions.obtenerTracking`                               |
| **Obtener Etiquetas**           | `NEXT_PUBLIC_N8N_ETIQUETA_URL`  | `mlActions.obtenerEtiqueta`                               |
| **Proxy Shopify**               | `NEXT_PUBLIC_N8N_WEBHOOK_URL`   | Route handlers en `/api/shopify/update`                   |

---

## 🎨 Identidad Visual y UI
El proyecto sigue una estética **Premium/Modern** con las siguientes características:

- **Paleta de Colores (OKLCH)**:
    - **Fondo**: Blanco puro / Gris muy oscuro (Dark Mode).
    - **Primario**: Charcoal/Negro (Profesional).
    - **Acción (Éxito)**: `Emerald` (Ingresos, Éxito).
    - **Alerta (Error)**: `Rose` (Pausado, Cancelado, Error).
    - **Atención**: `Orange` (Preguntas, Shopify).
    - **Productos**: `Violet/Purple`.
- **Componentes**: Utiliza **shadcn/ui** (Radix UI) con bordes redondeados (`0.625rem`) y efectos de hover sutiles.
- **Interactividad**: Micro-animaciones de carga (Skeletons y Spinners) y notificaciones emergentes con **Sonner**.

---

## ✅ Lo que Funciona vs ⚠️ Lo que Falta

### ✅ Funciona (Producción):
- Lectura masiva de datos desde Google Sheets vía CSV (muy rápido y eficiente).
- Dashboard con cálculos en tiempo real basados en la fecha actual.
- Interfaz de productos con estados dinámicos.
- Filtros de búsqueda y paginación en todas las tablas.
- Cambio de tema Claro/Oscuro.
- Proxy para actualizaciones de Shopify.

### ⚠️ Requiere Configuración/Lógica Externa:
- **n8n**: Todas las acciones interactivas (editar stock, responder, etc.) dependen de que el servidor n8n esté activo y tenga los workflows correctos recibiendo los JSON del dashboard.
- **Google Sheets**: Las hojas deben estar configuradas para ser visualizadas como CSV público o con permisos correctos.
- **Variables de Entorno**: Es crítico que el archivo `.env.local` contenga los `GID` (IDs de hojas) correctos para cada módulo.

---

## 🛠️ Tecnologías Principales
- **Framework**: `Next.js 16`
- **Lenguaje**: `TypeScript`
- **Estilos**: `Tailwind CSS 4`
- **Iconografía**: `Lucide React`
- **Gráficos**: `Recharts`
- **Parsing**: `Papaparse` (CSV Processor)
- **Fechas**: `Date-fns`
- **UI Base**: `Radix UI` / `shadcn`
