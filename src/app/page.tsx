'use client';

import { 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  History,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingDown,
  ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { useEffect, useState } from 'react';
import { getProductos, getOrdenes, getMensajes, getLogs, getShopifyOrders } from '@/lib/sheets';
import { DashboardStats } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isSameDay, isSameMonth } from 'date-fns';

export default function DashboardPage() {
  const { lastRefresh } = useAutoRefresh(300000); // 5 minutes
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const [productos, ordenes, mensajes, logs, shopify] = await Promise.all([
          getProductos(),
          getOrdenes(),
          getMensajes(),
          getLogs(),
          getShopifyOrders()
        ]);

        const now = new Date();

        setStats({
          productos: {
            total: productos.length,
            activos: productos.filter(p => p.estado === 'active').length,
            sinStock: productos.filter(p => p.stock === 0).length,
            pausados: productos.filter(p => p.estado === 'paused').length,
          },
          ventas: {
            hoy: ordenes.filter(o => {
              try {
                if (!o.fecha) return false;
                return isSameDay(parseISO(o.fecha), now);
              } catch { return false; }
            }).length,
            mes: ordenes.filter(o => {
              try {
                if (!o.fecha) return false;
                return isSameMonth(parseISO(o.fecha), now);
              } catch { return false; }
            }).length,
            ingresosMes: ordenes
              .filter(o => {
                try {
                  if (!o.fecha) return false;
                  return isSameMonth(parseISO(o.fecha), now) && o.estado === 'paid';
                } catch { return false; }
              })
              .reduce((acc, o) => acc + o.total, 0),
            salidasMes: ordenes
              .filter(o => {
                try {
                  if (!o.fecha) return false;
                  return isSameMonth(parseISO(o.fecha), now) && o.estado === 'cancelled';
                } catch { return false; }
              })
              .reduce((acc, o) => acc + o.total, 0),
            pendientes: ordenes.filter(o => o.estado === 'pending' || o.estado === 'in_process').length,
          },
          mensajes: {
            sinResponder: mensajes.filter(m => !m.respondido).length,
          },
          logs: {
            ejecucionesHoy: logs.filter(l => {
              try {
                if (!l.fecha) return false;
                return isSameDay(parseISO(l.fecha), now);
              } catch { return false; }
            }).length,
            erroresHoy: logs.filter(l => {
              try {
                if (!l.fecha) return false;
                return isSameDay(parseISO(l.fecha), now) && l.estado === 'error';
              } catch { return false; }
            }).length,
            tasaExito: logs.length > 0 
              ? (logs.filter(l => l.estado === 'success').length / logs.length) * 100 
              : 100,
          },
          shopify: {
            nuevosHoy: shopify.filter((o: any) => {
              try {
                return o.fecha && isSameDay(parseISO(o.fecha), now) && o.estado === 'Nuevo';
              } catch { return false; }
            }).length,
            ingresosMes: shopify
              .filter((o: any) => {
                try {
                  return o.fecha && isSameMonth(parseISO(o.fecha), now);
                } catch { return false; }
              })
              .reduce((acc: number, o: any) => acc + o.total, 0),
            pendientesDespacho: shopify.filter((o: any) => o.estado === 'Nuevo' || o.estado === 'Preparado').length,
            nuevosTotal: shopify.filter((o: any) => o.estado === 'Nuevo').length
          }
        });
      } catch (err: any) {
        console.error(err);
        setError('Error al cargar los datos. Verifica las variables de entorno o la conexión.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [lastRefresh]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-1" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold">{error}</h3>
        <p className="text-muted-foreground mt-2">
          Asegúrate de haber configurado las variables de entorno en .env.local y que el Google Sheet sea público.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Resumen General</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
              <Package className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.productos.activos}</div>
              <p className="text-xs text-muted-foreground">
                Total: {stats?.productos.total} productos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${stats?.ventas.ingresosMes.toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.ventas.mes} órdenes pagadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salidas Mes</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">
                ${stats?.ventas.salidasMes.toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-muted-foreground">
                Devoluciones por cancelaciones
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shopify</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats?.shopify.nuevosHoy ?? 0}
                {stats && stats.shopify.nuevosTotal > 0 && (
                  <Badge className="bg-rose-500 text-[10px] h-4">+{stats.shopify.nuevosTotal}</Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Ingresos: ${stats?.shopify.ingresosMes.toLocaleString('es-CO')}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Pendientes: {stats?.shopify.pendientesDespacho}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preguntas Pendientes</CardTitle>
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats?.mensajes.sinResponder}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren respuesta inmediata
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs de Hoy</CardTitle>
              <History className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.logs.ejecucionesHoy}</div>
              <p className="text-xs text-muted-foreground">
                Tasa de éxito: {stats?.logs.tasaExito.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Estado de Operaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Ventas hoy</p>
                <p className="text-sm text-muted-foreground">{stats?.ventas.hoy} órdenes recibidas hoy</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Pendientes de envío</p>
                <p className="text-sm text-muted-foreground">{stats?.ventas.pendientes} órdenes esperando procesamiento</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Productos sin stock</p>
                <p className="text-sm text-muted-foreground">{stats?.productos.sinStock} publicaciones pausadas por falta de stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Rendimiento del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="relative h-32 w-32">
                 {/* Simplified Chart Indicator */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-3xl font-bold">{stats?.logs.tasaExito.toFixed(0)}%</div>
                 </div>
                 <svg className="h-full w-full" viewBox="0 0 36 36">
                    <path
                      className="text-muted stroke-current"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 stroke-current"
                      strokeWidth="3"
                      strokeDasharray={`${stats?.logs.tasaExito}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                 </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Tasa de éxito en automatizaciones</p>
                <p className="text-xs text-muted-foreground mt-1">Basado en las ejecuciones de hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
