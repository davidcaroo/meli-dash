'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  Star, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  ShoppingBag,
  Info,
  ChevronRight,
  ShieldCheck,
  Ban,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Dot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getReputacion } from '@/lib/sheets';
import { Reputacion } from '@/lib/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, parseISO } from 'date-fns';

const levelInfo = {
  red: { label: 'Rojo', color: 'bg-rose-500', text: 'text-rose-500', desc: 'Crítico: Tu cuenta corre riesgo de ser suspendida.' },
  orange: { label: 'Naranja', color: 'bg-orange-500', text: 'text-orange-500', desc: 'Atención: Estás muy por debajo del estándar esperado.' },
  yellow: { label: 'Amarillo', color: 'bg-amber-400', text: 'text-amber-400', desc: 'Regular: Puedes mejorar varios aspectos de tu atención.' },
  light_green: { label: 'Verde Claro', color: 'bg-emerald-400', text: 'text-emerald-400', desc: 'Bueno: Mantienes un estándar aceptable.' },
  green: { label: 'Verde', color: 'bg-emerald-600', text: 'text-emerald-600', desc: 'Excelente: ¡Felicidades! Eres un vendedor destacado.' },
};

export default function ReputacionPage() {
  const { lastRefresh } = useAutoRefresh();
  const [data, setData] = useState<Reputacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getReputacion();
        setData(res);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lastRefresh]);

  const latest = data[0] || null;
  const history = useMemo(() => [...data].reverse(), [data]);

  const chartData = useMemo(() => {
    return history.map(item => ({
      fecha: format(parseISO(item.fecha), 'dd/MM'),
      reclamos: item.reclamos,
      cancelaciones: item.cancelaciones,
      ventas: item.ventas_completadas
    }));
  }, [history]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Star className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">No hay datos de reputación</h2>
        <p className="text-muted-foreground">Asegúrate de configurar el GID correcto en el .env</p>
      </div>
    );
  }

  const level = levelInfo[latest.nivel] || levelInfo.green;

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera Reputación */}
      <Card className="overflow-hidden border-none shadow-lg">
        <div className={cn("h-4", level.color)} />
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Termómetro de Reputación */}
            <div className="flex-shrink-0">
              <div className="flex gap-1 h-3 w-48 mb-2">
                <div className={cn("flex-1 rounded-l-full", latest.nivel === 'red' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-rose-500/30')} />
                <div className={cn("flex-1", latest.nivel === 'orange' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-orange-500/30')} />
                <div className={cn("flex-1", latest.nivel === 'yellow' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-amber-400/30')} />
                <div className={cn("flex-1", latest.nivel === 'light_green' ? 'bg-emerald-400 shadow-[0_0_10_rgba(52,211,153,0.5)]' : 'bg-emerald-400/30')} />
                <div className={cn("flex-1 rounded-r-full", latest.nivel === 'green' ? 'bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.5)]' : 'bg-emerald-600/30')} />
              </div>
              <p className={cn("text-3xl font-black uppercase tracking-tighter", level.text)}>
                {latest.potencia}
              </p>
              <p className="text-xs font-medium text-muted-foreground mt-1">Nivel: {level.label}</p>
            </div>

            <div className="flex-grow space-y-2">
              <h1 className="text-2xl font-bold">Tu reputación está en {level.label}</h1>
              <p className="text-muted-foreground text-sm max-w-xl">
                {level.desc} Los porcentajes se calculan sobre tus últimas {latest.ventas_completadas} ventas.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Vendedor {latest.potencia}
                </Badge>
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  <ThumbsUp className="h-4 w-4 text-emerald-500" /> {latest.calificacion_positiva}% Positivas
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalladas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Reclamos
              <MessageCircle className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-bold", latest.reclamos > 3 ? "text-rose-500" : "text-emerald-500")}>
                {latest.reclamos}%
              </span>
              <span className="text-xs text-muted-foreground">de ventas</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Objetivo: Menos del 2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Cancelaciones
              <Ban className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-bold", latest.cancelaciones > 2 ? "text-rose-500" : "text-emerald-500")}>
                {latest.cancelaciones}%
              </span>
              <span className="text-xs text-muted-foreground">por el vendedor</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Objetivo: Menos del 1.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Calificaciones
              <div className="flex">
                <ThumbsUp className="h-3 w-3 text-emerald-500" />
                <ThumbsDown className="h-3 w-3 text-rose-500" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Positivas</span>
                  <span className="font-bold">{latest.calificacion_positiva}%</span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${latest.calificacion_positiva}%` }} />
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span>Negativas</span>
                  <span className="text-rose-500">{latest.calificacion_negativa}%</span>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Ventas Totales
              <ShoppingBag className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold">{latest.ventas_completadas.toLocaleString()}</div>
             <p className="text-[10px] text-muted-foreground mt-2">En el periodo actual de evaluación</p>
             <div className="flex items-center gap-1 text-[10px] text-emerald-500 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>+12% vs periodo anterior</span>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Evolución */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolución de Reclamos y Cancelaciones</CardTitle>
            <CardDescription>Seguimiento de métricas críticas en los últimos meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReclamos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCancel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reclamos" 
                    name="Reclamos %"
                    stroke="#f43f5e" 
                    fillOpacity={1} 
                    fill="url(#colorReclamos)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cancelaciones" 
                    name="Cancelaciones %"
                    stroke="#f97316" 
                    fillOpacity={1} 
                    fill="url(#colorCancel)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas y Recomendaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-orange-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-orange-600 dark:text-orange-400">Atención con los reclamos</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tus reclamos (3.2%) están cerca del límite para bajar a nivel Naranja. Responde más rápido para evitarlos.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50">
              <div className="flex gap-3">
                <ThumbsUp className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Excelente tiempo de respuesta</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Mantienes un promedio de 8 min. Esto ayuda a convertir más preguntas en ventas.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium mb-3">Consejos para mejorar:</p>
              <ul className="space-y-2">
                {[
                  "Usa plantillas para responder preguntas frecuentes",
                  "Despacha tus productos antes de las 24hs",
                  "Evita cancelar ventas por falta de stock",
                  "Revisa los mensajes después de la venta"
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <Dot className="h-4 w-4 text-primary shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
