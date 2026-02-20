'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Check,
  ChevronLeft,
  ChevronRight
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
import { getLogs } from '@/lib/sheets';
import { Log } from '@/lib/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { cn } from '@/lib/utils';
import { format, parseISO, isSameDay } from 'date-fns';
import { toast } from 'sonner';

const selectClass = "flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

export default function LogsPage() {
  const { lastRefresh } = useAutoRefresh();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [flowFilter, setFlowFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getLogs();
        setLogs(data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lastRefresh]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = 
        l.flujo?.toLowerCase().includes(search.toLowerCase()) || 
        l.accion?.toLowerCase().includes(search.toLowerCase()) ||
        l.detalle?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || l.estado === statusFilter;
      const matchesFlow = flowFilter === 'all' || l.flujo === flowFilter;
      return matchesSearch && matchesStatus && matchesFlow;
    });
  }, [logs, search, statusFilter, flowFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, flowFilter, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const flows = useMemo(() => Array.from(new Set(logs.map(l => l.flujo))).filter(Boolean), [logs]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayLogs = logs.filter(l => {
      try {
        if (!l.fecha) return false;
        return isSameDay(parseISO(l.fecha), now);
      } catch { return false; }
    });
    return {
      hoy: todayLogs.length,
      erroresHoy: todayLogs.filter(l => l.estado === 'error').length,
      tasaExito: logs.length > 0
        ? (logs.filter(l => l.estado === 'success').length / logs.length) * 100
        : 100,
    };
  }, [logs]);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Detalle copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusBadge = (estado: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      success: { label: 'Éxito',       cls: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
      error:   { label: 'Error',       cls: 'bg-rose-500 hover:bg-rose-600 text-white' },
      warning: { label: 'Advertencia', cls: 'bg-amber-500 hover:bg-amber-600 text-white' },
    };
    const s = map[estado] ?? { label: estado, cls: 'bg-slate-500 hover:bg-slate-600 text-white' };
    return <Badge className={cn(s.cls)}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ejecuciones Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores Hoy</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{stats.erroresHoy}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.tasaExito.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en logs..."
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
            <option value="success">Éxito</option>
            <option value="error">Error</option>
            <option value="warning">Advertencia</option>
          </select>
          <select
            className={selectClass}
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value)}
          >
            <option value="all">Todos los flujos</option>
            {flows.map(flow => (
              <option key={flow} value={flow}>{flow}</option>
            ))}
          </select>
          {(search || statusFilter !== 'all' || flowFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setStatusFilter('all'); setFlowFilter('all'); }}
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
              <TableHead>Fecha</TableHead>
              <TableHead>Flujo</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="text-right">Copiar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron logs.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow
                  key={log.id}
                  className={cn(log.estado === 'error' ? "bg-rose-50/50 dark:bg-rose-900/10" : "")}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    {(() => {
                      try { return format(parseISO(log.fecha), 'dd/MM HH:mm:ss'); }
                      catch { return log.fecha ?? '—'; }
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{log.flujo}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.accion}</TableCell>
                  <TableCell>{statusBadge(log.estado)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.duracion_ms}ms</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs italic text-muted-foreground">
                    {log.detalle}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(log.detalle, log.id)}
                      title="Copiar detalle"
                    >
                      {copiedId === log.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
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
              {filteredLogs.length === 0
                ? 'Sin resultados'
                : `Mostrando ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filteredLogs.length)} de ${filteredLogs.length} log${filteredLogs.length !== 1 ? 's' : ''}`}
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
    </div>
  );
}
