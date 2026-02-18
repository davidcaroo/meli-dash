'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Activity,
  Filter,
  Check
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
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LogsPage() {
  useAutoRefresh();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [flowFilter, setFlowFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getLogs();
        // Sort by date desc (inverse chrono)
        setLogs(data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  const flows = useMemo(() => Array.from(new Set(logs.map(l => l.flujo))).filter(Boolean), [logs]);

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = logs.filter(l => l.fecha?.startsWith(today));
    
    return {
      hoy: todayLogs.length,
      erroresHoy: todayLogs.filter(l => l.estado === 'error').length,
      tasaExito: logs.length > 0 
        ? (logs.filter(l => l.estado === 'success').length / logs.length) * 100 
        : 100,
    };
  }, [logs]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Detalle copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[600px] w-full" />
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
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en logs..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            className="flex h-10 w-full md:w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
          <select 
            className="flex h-10 w-full md:w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value)}
          >
            <option value="all">Todos los flujos</option>
            {flows.map(flow => (
              <option key={flow} value={flow}>{flow}</option>
            ))}
          </select>
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
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron logs.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow 
                  key={log.id} 
                  className={cn(log.estado === 'error' ? "bg-rose-50/50 dark:bg-rose-900/10" : "")}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(log.fecha), 'dd/MM HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{log.flujo}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.accion}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                      log.estado === 'success' ? "bg-emerald-500 hover:bg-emerald-600" : 
                      log.estado === 'error' ? "bg-rose-500 hover:bg-rose-600" : 
                      "bg-amber-500 hover:bg-amber-600"
                    )}>
                      {log.estado.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.duracion_ms}ms
                  </TableCell>
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
      </Card>
    </div>
  );
}
