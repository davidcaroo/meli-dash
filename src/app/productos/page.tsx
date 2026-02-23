'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  ExternalLink, 
  AlertTriangle, 
  PauseCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Pencil,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { mlActions } from '@/lib/ml-actions';
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
import { getProductos } from '@/lib/sheets';
import { Producto } from '@/lib/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { cn } from '@/lib/utils';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const selectClass = "flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

export default function ProductosPage() {
  const { lastRefresh } = useAutoRefresh();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<{ id: string, value: string } | null>(null);
  const [editingStock, setEditingStock] = useState<{ id: string, value: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastRefresh]);

  const handleAction = async (itemId: string, actionName: string, fn: () => Promise<any>) => {
    setUpdatingId(itemId);
    const toastId = toast.loading(`${actionName}...`);
    try {
      await fn();
      toast.success('Acción completada ✓', { id: toastId });
      setTimeout(loadData, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Error al ejecutar acción', { id: toastId });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProductos = useMemo(() => {
    const result = productos.filter(p => {
      const matchesSearch = p.titulo?.toLowerCase().includes(search.toLowerCase()) || 
                            p.id?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.estado === statusFilter;
      const matchesCategory = categoryFilter === 'all' || p.categoria === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
    return result;
  }, [productos, search, statusFilter, categoryFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProductos.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProductos = filteredProductos.slice(startIndex, startIndex + itemsPerPage);

  const categories = useMemo(
    () => Array.from(new Set(productos.map(p => p.categoria))).filter(Boolean),
    [productos]
  );

  const stats = useMemo(() => ({
    total: productos.length,
    activos: productos.filter(p => p.estado === 'active').length,
    sinStock: productos.filter(p => p.stock === 0).length,
    pausados: productos.filter(p => p.estado === 'paused').length,
  }), [productos]);

  // Generate page numbers to show
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.activos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.sinStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausados</CardTitle>
            <PauseCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pausados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="closed">Finalizado</option>
            <option value="under_review">En revisión</option>
            <option value="inactive">Inactivo</option>
          </select>
          <select
            className={selectClass}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Cod. Producto (todos)</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Imagen</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Cod. Producto ML</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProductos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProductos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>
                    {producto.imagen ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden border cursor-pointer">
                            <img src={producto.imagen} alt={producto.titulo} className="object-cover h-full w-full" />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-0 overflow-hidden">
                          <img src={producto.imagen} alt={producto.titulo} className="w-full h-auto" />
                          <div className="p-4">
                            <h4 className="text-sm font-semibold">{producto.titulo}</h4>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center border">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[280px] truncate">
                    {producto.titulo}
                  </TableCell>
                  <TableCell className="relative">
                    {editingPrice?.id === producto.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="h-8 w-24"
                          value={editingPrice.value}
                          onChange={(e) => setEditingPrice({ ...editingPrice, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const nuevo = parseFloat(editingPrice.value);
                              if (isNaN(nuevo) || nuevo <= 0) {
                                toast.error('Precio inválido');
                                return;
                              }
                              handleAction(producto.id, 'Actualizando precio', () => mlActions.editarPrecio(producto.id, nuevo));
                              setEditingPrice(null);
                            } else if (e.key === 'Escape') {
                              setEditingPrice(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-emerald-600"
                          onClick={() => {
                            const nuevo = parseFloat(editingPrice.value);
                            if (isNaN(nuevo) || nuevo <= 0) {
                              toast.error('Precio inválido');
                              return;
                            }
                            handleAction(producto.id, 'Actualizando precio', () => mlActions.editarPrecio(producto.id, nuevo));
                            setEditingPrice(null);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-rose-600"
                          onClick={() => setEditingPrice(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1 group cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setEditingPrice({ id: producto.id, value: producto.precio.toString() })}
                      >
                        ${producto.precio.toLocaleString('es-AR')}
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingStock?.id === producto.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="h-8 w-20"
                          value={editingStock.value}
                          onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const nuevo = parseInt(editingStock.value);
                              if (isNaN(nuevo) || nuevo < 0) {
                                toast.error('Stock inválido');
                                return;
                              }
                              handleAction(producto.id, 'Actualizando stock', () => mlActions.editarStock(producto.id, nuevo));
                              setEditingStock(null);
                            } else if (e.key === 'Escape') {
                              setEditingStock(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-emerald-600"
                          onClick={() => {
                            const nuevo = parseInt(editingStock.value);
                            if (isNaN(nuevo) || nuevo < 0) {
                              toast.error('Stock inválido');
                              return;
                            }
                            handleAction(producto.id, 'Actualizando stock', () => mlActions.editarStock(producto.id, nuevo));
                            setEditingStock(null);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-rose-600"
                          onClick={() => setEditingStock(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Badge 
                        variant={producto.stock > 0 ? "secondary" : "destructive"}
                        className="cursor-pointer hover:ring-1 ring-primary transition-all group"
                        onClick={() => setEditingStock({ id: producto.id, value: producto.stock.toString() })}
                      >
                        {producto.stock}
                        <Pencil className="h-2 w-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        producto.estado === 'active' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : 
                        producto.estado === 'paused' ? "bg-amber-500 hover:bg-amber-600 text-white" : 
                        producto.estado === 'closed' ? "bg-rose-500 hover:bg-rose-600 text-white" :
                        producto.estado === 'under_review' ? "bg-blue-500 hover:bg-blue-600 text-white" :
                        "bg-slate-500 hover:bg-slate-600 text-white"
                      )}>
                        {(producto.estado || 'paused').toUpperCase()}
                      </Badge>
                      
                      {updatingId === producto.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {producto.estado === 'active' && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              title="Pausar publicación"
                              onClick={() => handleAction(producto.id, 'Pausando publicación', () => mlActions.pausarProducto(producto.id))}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {producto.estado === 'paused' && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Activar publicación"
                              onClick={() => handleAction(producto.id, 'Activando publicación', () => mlActions.activarProducto(producto.id))}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{producto.categoria}</TableCell>
                  <TableCell className="text-right">
                    <div className={cn("flex justify-end gap-1", updatingId === producto.id && "opacity-50 pointer-events-none")}>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={producto.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
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
          {/* Resultados + selector */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {filteredProductos.length === 0
                ? 'Sin resultados'
                : `Mostrando ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filteredProductos.length)} de ${filteredProductos.length} producto${filteredProductos.length !== 1 ? 's' : ''}`}
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

          {/* Navegación */}
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
    </div>
  );
}
