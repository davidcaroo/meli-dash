'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Search, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Filter,
  Send,
  Plus,
  Star,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { mlActions } from '@/lib/ml-actions';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
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
import { getMensajes } from '@/lib/sheets';
import { Mensaje } from '@/lib/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { cn } from '@/lib/utils';
import { format, differenceInHours } from 'date-fns';

export default function MensajesPage() {
  useAutoRefresh();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'responded' | 'pending'>('all');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<string[]>([]);
  const [newTemplate, setNewTemplate] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const defaultTemplates = [
    "Hola, sí tenemos disponibilidad del producto 😊",
    "El pedido se despacha en 24-48 horas hábiles",
    "Manejamos todos los tallajes, escríbenos tu medida de pie en cm",
    "Hacemos envíos a todo Colombia por Mercado Envíos",
    "Puedes ver más información del producto en la publicación"
  ];

  const allTemplates = [...defaultTemplates, ...customTemplates];

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getMensajes();
      setMensajes(data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem('meli_custom_templates');
    if (saved) setCustomTemplates(JSON.parse(saved));
  }, []);

  const filteredMensajes = useMemo(() => {
    return mensajes.filter(m => {
      const matchesSearch = 
        m.comprador?.toLowerCase().includes(search.toLowerCase()) || 
        m.producto?.toLowerCase().includes(search.toLowerCase()) ||
        m.mensaje?.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'responded' && m.respondido) || 
        (filter === 'pending' && !m.respondido);

      return matchesSearch && matchesFilter;
    });
  }, [mensajes, search, filter]);

  const stats = useMemo(() => {
    return {
      total: mensajes.length,
      pendientes: mensajes.filter(m => !m.respondido).length,
      urgentes: mensajes.filter(m => {
        if (m.respondido) return false;
        return differenceInHours(new Date(), new Date(m.fecha)) > 24;
      }).length,
    };
  }, [mensajes]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <MessageCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card className={cn(stats.urgentes > 0 ? "border-rose-500" : "")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes ({'>'}24h)</CardTitle>
            <AlertCircle className={cn("h-4 w-4", stats.urgentes > 0 ? "text-rose-500 animate-pulse" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.urgentes > 0 ? "text-rose-600" : "")}>
              {stats.urgentes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en mensajes, comprador o producto..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <Button 
            variant={filter === 'all' ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button 
            variant={filter === 'pending' ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </Button>
          <Button 
            variant={filter === 'responded' ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setFilter('responded')}
          >
            Respondidos
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Comprador / Producto</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead>Respuesta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMensajes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron mensajes.
                </TableCell>
              </TableRow>
            ) : (
              filteredMensajes.map((m) => {
                const isUrgent = !m.respondido && differenceInHours(new Date(), new Date(m.fecha)) > 24;
                
                return (
                  <TableRow key={m.id} className={cn(isUrgent ? "bg-rose-50/50 dark:bg-rose-900/10" : "")}>
                    <TableCell>
                      {m.respondido ? (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500 gap-1 font-normal">
                          <CheckCircle2 className="h-3 w-3" /> Respondido
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-1">
                           <Badge variant="outline" className="text-orange-500 border-orange-500 gap-1 font-normal">
                            <Clock className="h-3 w-3" /> Pendiente
                          </Badge>
                          {isUrgent && (
                            <Badge className="bg-rose-500 text-[10px] py-0">URGENTE</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(m.fecha), 'dd/MM HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col max-w-[200px]">
                        <span className="font-semibold text-sm truncate">{m.comprador}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{m.producto}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm italic text-muted-foreground line-clamp-2">
                        "{m.mensaje}"
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      {m.respondido ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-sm line-clamp-2">{m.respuesta}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {m.fecha_respuesta && format(new Date(m.fecha_respuesta), 'dd/MM HH:mm')}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3 py-2">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {allTemplates.slice(0, 4).map((template, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-primary/5 text-[10px] py-0 px-2 h-6"
                                onClick={() => setReplyText({ ...replyText, [m.id]: template })}
                              >
                                {idx >= defaultTemplates.length && <Star className="h-2 w-2 mr-1 fill-amber-400 text-amber-400" />}
                                {template.substring(0, 25)}...
                              </Badge>
                            ))}
                            <Dialog open={isDialogOpen && sendingId === m.id} onOpenChange={setIsDialogOpen}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setSendingId(m.id)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Nuevo Template</DialogTitle>
                                </DialogHeader>
                                <Input 
                                  placeholder="Escribe tu respuesta frecuente..." 
                                  value={newTemplate}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplate(e.target.value)}
                                />
                                <DialogFooter>
                                  <Button onClick={() => {
                                    if (!newTemplate.trim()) return;
                                    const updated = [...customTemplates, newTemplate.trim()];
                                    setCustomTemplates(updated);
                                    localStorage.setItem('meli_custom_templates', JSON.stringify(updated));
                                    setNewTemplate('');
                                    setIsDialogOpen(false);
                                    setSendingId(null);
                                    toast.success('Template guardado');
                                  }}>Guardar Template</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <div className="relative">
                            <Textarea 
                              placeholder="Escribe tu respuesta..."
                              className="min-h-[80px] text-sm resize-none pr-10"
                              value={replyText[m.id] || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText({ ...replyText, [m.id]: e.target.value })}
                              maxLength={2000}
                              disabled={sendingId === m.id}
                            />
                            <div className="absolute bottom-2 right-2 flex items-center gap-2">
                              <span className={cn(
                                "text-[10px]",
                                (replyText[m.id]?.length || 0) > 1800 ? "text-rose-500 font-bold" : "text-muted-foreground"
                              )}>
                                {replyText[m.id]?.length || 0}/2000
                              </span>
                              <Button 
                                size="sm" 
                                className="h-7 w-7 rounded-full p-0" 
                                disabled={!replyText[m.id]?.trim() || (sendingId === m.id && !!m.respondido)}
                                onClick={async () => {
                                  const text = replyText[m.id];
                                  setSendingId(m.id);
                                  const tid = toast.loading('Enviando respuesta...');
                                  try {
                                    await mlActions.responderPregunta(m.id, text);
                                    toast.success('Respuesta enviada ✓', { id: tid });
                                    setReplyText({ ...replyText, [m.id]: '' });
                                    setMensajes(prev => prev.map(msg => 
                                      msg.id === m.id ? { ...msg, respondido: true, respuesta: text, fecha_respuesta: new Date().toISOString() } : msg
                                    ));
                                  } catch (error) {
                                    toast.error('Error al enviar respuesta', { id: tid });
                                  } finally {
                                    setSendingId(null);
                                  }
                                }}
                              >
                                {sendingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
