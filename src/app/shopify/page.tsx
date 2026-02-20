'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Copy,
  MessageCircle,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Phone
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
import { getShopifyOrders } from '@/lib/sheets';
import { ShopifyOrder } from '@/lib/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { cn } from '@/lib/utils';
import { format, parseISO, isSameMonth, subDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ShopifyPage() {
  const { lastRefresh } = useAutoRefresh();
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getShopifyOrders();
        // Sort by date desc, handling invalid dates
        setOrders(data.sort((a, b) => {
          const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
          const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
          return dateB - dateA;
        }));
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar pedidos de Shopify');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lastRefresh]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.cliente?.toLowerCase().includes(search.toLowerCase()) || 
        o.producto?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || o.estado === statusFilter;
      
      let matchesFromDate = true;
      let matchesToDate = true;
      
      if (o.fecha) {
        const orderDate = new Date(o.fecha);
        matchesFromDate = !fromDate || orderDate >= new Date(fromDate);
        matchesToDate = !toDate || orderDate <= new Date(toDate);
      } else if (fromDate || toDate) {
        return false;
      }

      return matchesSearch && matchesStatus && matchesFromDate && matchesToDate;
    });
  }, [orders, search, statusFilter, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, fromDate, toDate, itemsPerPage]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthOrders = orders.filter(o => {
      try {
        if (!o.fecha) return false;
        return isSameMonth(parseISO(o.fecha), now);
      } catch { return false; }
    });

    return {
      totalMes: monthOrders.length,
      nuevos: orders.filter(o => o.estado === 'Nuevo').length,
      despachadosMes: monthOrders.filter(o => o.estado === 'Despachado' || o.estado === 'Entregado').length,
      ingresosMes: monthOrders.reduce((acc, o) => acc + o.total, 0),
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStr = format(date, 'yyyy-MM-dd');
      const dayOrders = orders.filter(o => {
        try {
          return o.fecha && isSameDay(parseISO(o.fecha), date);
        } catch { return false; }
      });
      
      data.push({
        name: format(date, 'dd/MM'),
        total: dayOrders.reduce((acc, o) => acc + o.total, 0),
        pedidos: dayOrders.length,
      });
    }
    return data;
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  const copyGuide = (guia: string) => {
    if (!guia) return;
    navigator.clipboard.writeText(guia);
    toast.success('Número de guía copiado');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Nuevo':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white">NUEVO</Badge>;
      case 'Preparado':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">PREPARADO</Badge>;
      case 'Despachado':
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">DESPACHADO</Badge>;
      case 'Entregado':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">ENTREGADO</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos del Mes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Nuevos</CardTitle>
            <Clock className={cn("h-4 w-4", stats.nuevos > 0 ? "text-rose-500 animate-pulse" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.nuevos > 0 ? "text-rose-600" : "")}>
              {stats.nuevos}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despachados Mes</CardTitle>
            <Truck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.despachadosMes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Shopify Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.ingresosMes.toLocaleString('es-CO')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-medium">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cliente o producto..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Estado</label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Preparado">Preparado</option>
              <option value="Despachado">Despachado</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Desde</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Hasta</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cant.</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>No. Guía</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron pedidos.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {order.fecha ? (() => {
                      try {
                        // If it's already in ISO format from sheets.ts, format it
                        return format(parseISO(order.fecha), 'dd/MM/yyyy');
                      } catch {
                        // Fallback if formatting fails
                        return order.fecha;
                      }
                    })() : 'Sin fecha'}
                  </TableCell>
                  <TableCell className="font-medium">{order.cliente}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{order.producto}</TableCell>
                  <TableCell>{order.cantidad}</TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">
                    ${order.total.toLocaleString('es-CO')}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.estado)}</TableCell>
                  <TableCell>
                    {order.guia ? (
                      <Badge variant="secondary" className="font-mono text-[10px] cursor-pointer" onClick={() => copyGuide(order.guia)}>
                        {order.guia}
                      </Badge>
                    ) : (
                      <Input 
                        placeholder="Guía..." 
                        className="h-7 text-[10px] w-24"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            copyGuide((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            copyGuide(e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(order.telefono, 'Teléfono')}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {filteredOrders.length === 0
                ? 'Sin resultados'
                : `Mostrando ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filteredOrders.length)} de ${filteredOrders.length} pedido${filteredOrders.length !== 1 ? 's' : ''}`}
            </span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10 / pág.</option>
              <option value={15}>15 / pág.</option>
              <option value={25}>25 / pág.</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pageNumbers.map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={currentPage === p ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8 text-sm"
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Ventas Shopify (Últimos 14 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-bold mb-1">{label}</p>
                          <p className="text-xs text-emerald-600 font-semibold">
                            Total: ${payload[0].value?.toLocaleString('es-CO')}
                          </p>
                          <p className="text-xs text-blue-600 font-semibold">
                            Pedidos: {payload[0].payload.pedidos}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Drawer Detalle (usando Dialog modal) */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md w-full sm:max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Detalle del Pedido
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Cliente</h4>
                  <p className="text-lg font-bold">{selectedOrder.cliente}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm">{selectedOrder.telefono}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedOrder.telefono, 'Teléfono')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <a 
                      href={`https://wa.me/57${selectedOrder.telefono.replace(/\s/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-emerald-100 hover:text-emerald-700 h-6 w-6 text-emerald-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-semibold text-muted-foreground text-right">Estado</h4>
                  <div className="mt-1">{getStatusBadge(selectedOrder.estado)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Fecha
                  </h4>
                  <p className="text-sm">
                    {selectedOrder.fecha ? (() => {
                      try {
                        return format(parseISO(selectedOrder.fecha), 'PPP', { locale: es });
                      } catch { return 'Fecha inválida'; }
                    })() : 'Sin fecha'}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1 justify-end">
                    <DollarSign className="h-3 w-3" /> Total
                  </h4>
                  <p className="text-sm font-bold text-primary">${selectedOrder.total.toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div className="space-y-1 bg-muted/50 p-3 rounded-lg border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  Dirección de Entrega
                </h4>
                <p className="text-sm">{selectedOrder.direccion}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Package className="h-3 w-3" /> Productos
                </h4>
                <div className="bg-card border rounded-md p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{selectedOrder.producto}</p>
                    <Badge variant="outline">x{selectedOrder.cantidad}</Badge>
                  </div>
                  {selectedOrder.ean && (
                    <p className="text-[10px] font-mono text-muted-foreground">EAN: {selectedOrder.ean}</p>
                  )}
                </div>
              </div>

              {selectedOrder.detalles && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Otros Detalles</h4>
                  <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded border border-dashed whitespace-pre-line">
                    "{selectedOrder.detalles}"
                  </p>
                </div>
              )}

              <div className="pt-2 border-t flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Guía:</span>
                  <Badge variant="secondary" className="font-mono">{selectedOrder.guia || 'Pendiente'}</Badge>
                </div>
                <Button size="sm" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
