'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrdenes } from '@/lib/sheets';
import { Orden } from '@/lib/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { SalesChart } from '@/components/sales-chart';
import { cn } from '@/lib/utils';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO, isSameDay, isSameMonth } from 'date-fns';

const ITEMS_PER_PAGE = 20;

const statusColors: Record<string, string> = {
  paid:        "bg-emerald-500 hover:bg-emerald-600",
  cancelled:   "bg-rose-500 hover:bg-rose-600",
  pending:     "bg-amber-500 hover:bg-amber-600",
  in_process:  "bg-sky-500 hover:bg-sky-600",
  shipped:     "bg-violet-500 hover:bg-violet-600",
  delivered:   "bg-teal-500 hover:bg-teal-600",
};

const statusLabel: Record<string, string> = {
  paid:        "PAGADO",
  cancelled:   "CANCELADO",
  pending:     "PENDIENTE",
  in_process:  "EN PROCESO",
  shipped:     "ENVIADO",
  delivered:   "ENTREGADO",
};

export default function OrdenesPage() {
  const { lastRefresh } = useAutoRefresh();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getOrdenes();
        // Sort by date desc
        setOrdenes(data.sort((a, b) => new Date(String(b.fecha)).getTime() - new Date(String(a.fecha)).getTime()));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lastRefresh]);

  const filteredOrdenes = useMemo(() => {
    return ordenes.filter(o => {
      const matchesSearch = 
        o.comprador?.toLowerCase().includes(search.toLowerCase()) || 
        o.producto?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || o.estado === statusFilter;
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const orderDate = new Date(String(o.fecha));
        const from = dateFrom ? startOfDay(new Date(dateFrom)) : new Date(0);
        const to = dateTo ? endOfDay(new Date(dateTo)) : new Date(8640000000000000);
        matchesDate = isWithinInterval(orderDate, { start: from, end: to });
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [ordenes, search, statusFilter, dateFrom, dateTo]);

  const paginatedOrdenes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrdenes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrdenes, currentPage]);

  const totalPages = Math.ceil(filteredOrdenes.length / ITEMS_PER_PAGE);

  const chartData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    return last14Days.map(date => {
      const dayOrders = ordenes.filter(o => {
        try {
          return format(new Date(o.fecha), 'yyyy-MM-dd') === date;
        } catch { return false; }
      });
      return {
        date,
        total: dayOrders.reduce((acc, o) => acc + o.total, 0),
        count: dayOrders.length,
      };
    });
  }, [ordenes]);

  const stats = useMemo(() => {
    const now = new Date();

    return {
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
            return isSameMonth(parseISO(o.fecha), now);
          } catch { return false; }
        })
        .reduce((acc, o) => acc + o.total, 0),
      pendientes: ordenes.filter(o => o.estado === 'pending' || o.estado === 'in_process').length,
    };
  }, [ordenes]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.ingresosMes.toLocaleString('es-AR')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendientes}</div>
          </CardContent>
        </Card>
      </div>

      <SalesChart data={chartData} />

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="space-y-2">
            <label className="text-xs font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Comprador o producto..."
                className="pl-8"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Estado</label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">Todos</option>
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelado</option>
              <option value="in_process">En Proceso</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Desde</label>
            <Input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Hasta</label>
            <Input 
              type="date" 
              value={dateTo} 
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDateFrom('');
              setDateTo('');
              setCurrentPage(1);
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Comprador</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Cant.</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Envío</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrdenes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrdenes.map((orden) => (
                <TableRow key={orden.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {(() => {
                      try {
                        return format(parseISO(String(orden.fecha)), 'dd/MM/yy HH:mm');
                      } catch {
                        return 'Fecha inválida';
                      }
                    })()}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{orden.comprador}</span>
                      <span className="text-[10px] text-muted-foreground">{orden.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{orden.producto}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {orden.sku ?? '—'}
                  </TableCell>
                  <TableCell>{orden.cantidad}</TableCell>
                  <TableCell className="font-semibold">
                    ${orden.total.toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px] text-white", statusColors[orden.estado] || "bg-gray-500 hover:bg-gray-600")}>
                      {statusLabel[orden.estado] || orden.estado.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{orden.envio}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-xs text-muted-foreground">
              Mostrando {paginatedOrdenes.length} de {filteredOrdenes.length} resultados
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium flex items-center px-2">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
