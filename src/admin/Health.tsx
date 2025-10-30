import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Server, Database, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { db, functions } from '@/firebase';
import { collection, getDocs, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';

export default function Health() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<{ 
    apiResponseTime: number; 
    firestoreQueryTime: number; 
    loginFailures: number; 
    activeUsers: number;
    totalUsers: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp?: string 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    // Live subscribe to latest metrics snapshot from Firestore: metrics collection sorted by timestamp
    const q = query(collection(db, 'metrics'), orderBy('timestamp', 'desc'), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      const doc = snap.docs[0];
      if (doc) {
        const data = doc.data() as any;
        setMetrics({
          apiResponseTime: Number(data.apiResponseTime ?? 0),
          firestoreQueryTime: Number(data.firestoreQueryTime ?? 0),
          loginFailures: Number(data.loginFailures ?? 0),
          activeUsers: Number(data.activeUsers ?? 0),
          totalUsers: Number(data.totalUsers ?? 0),
          uptime: Number(data.uptime ?? 0),
          memoryUsage: Number(data.memoryUsage ?? 0),
          cpuUsage: Number(data.cpuUsage ?? 0),
          timestamp: data.timestamp,
        });
      } else {
        setMetrics(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const collectMetrics = async () => {
    setCollecting(true);
    try {
      const collectFunction = httpsCallable(functions, 'collectMetrics');
      const result = await collectFunction();
      toast({ title: 'Success', description: 'Metrics collected successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to collect metrics', variant: 'destructive' });
    } finally {
      setCollecting(false);
    }
  };

  const getStatusIcon = (value: number, type: 'uptime' | 'response' | 'failures') => {
    if (type === 'uptime') {
      return value >= 99 ? <CheckCircle className="text-green-500" size={20} /> : <AlertTriangle className="text-yellow-500" size={20} />;
    }
    if (type === 'response') {
      return value <= 1000 ? <CheckCircle className="text-green-500" size={20} /> : <AlertTriangle className="text-yellow-500" size={20} />;
    }
    if (type === 'failures') {
      return value <= 5 ? <CheckCircle className="text-green-500" size={20} /> : <AlertTriangle className="text-yellow-500" size={20} />;
    }
    return <CheckCircle className="text-green-500" size={20} />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">System Health</h1>
          <p className="text-muted-foreground">Monitor system performance and status.</p>
        </div>
        <Button 
          onClick={collectMetrics} 
          disabled={collecting}
          className="btn-primary"
        >
          {collecting ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="animate-spin" size={16} />
              Collecting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RefreshCw size={16} />
              Collect Metrics
            </div>
          )}
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Uptime</p>
              <p className="text-2xl font-bold">{loading ? '—' : `${metrics?.uptime ?? 0}%`}</p>
            </div>
            {getStatusIcon(metrics?.uptime ?? 0, 'uptime')}
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">API Response</p>
              <p className="text-2xl font-bold">{loading ? '—' : `${metrics?.apiResponseTime ?? 0}ms`}</p>
            </div>
            {getStatusIcon(metrics?.apiResponseTime ?? 0, 'response')}
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Firestore Query</p>
              <p className="text-2xl font-bold">{loading ? '—' : `${metrics?.firestoreQueryTime ?? 0}ms`}</p>
            </div>
            <Database className="text-primary" size={24} />
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Login Failures</p>
              <p className="text-2xl font-bold">{loading ? '—' : metrics?.loginFailures ?? 0}</p>
            </div>
            {getStatusIcon(metrics?.loginFailures ?? 0, 'failures')}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users (24h)</p>
              <p className="text-2xl font-bold">{loading ? '—' : metrics?.activeUsers ?? 0}</p>
            </div>
            <Users className="text-green-500" size={24} />
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{loading ? '—' : metrics?.totalUsers ?? 0}</p>
            </div>
            <Users className="text-primary" size={24} />
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-2xl font-bold">{loading ? '—' : `${Math.round(metrics?.memoryUsage ?? 0)}MB`}</p>
            </div>
            <Server className="text-blue-500" size={24} />
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">CPU Usage</p>
              <p className="text-2xl font-bold">{loading ? '—' : `${Math.round(metrics?.cpuUsage ?? 0)}%`}</p>
            </div>
            <Activity className="text-orange-500" size={24} />
          </div>
        </Card>
      </div>

      {metrics?.timestamp && (
        <Card className="card-academic p-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(metrics.timestamp).toLocaleString()}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}


