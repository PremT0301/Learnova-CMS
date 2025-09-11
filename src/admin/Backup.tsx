import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db, functions } from '@/firebase';
import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';

type BackupItem = { id: string; timestamp: string; size?: number; status?: string };

export default function Backup() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'backups'), orderBy('timestamp', 'desc')));
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load backups', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const triggerBackup = async () => {
    setTriggering(true);
    try {
      const { httpsCallable } = await import('firebase/functions');
      const call = httpsCallable(functions, 'triggerBackup');
      await call({});
      logAudit('backup_trigger', payload as any, user?.id);
      toast({ title: 'Backup requested', description: 'Backup request submitted' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to request backup', variant: 'destructive' });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Backups</h1>
          <p className="text-muted-foreground">Manage data backups and restores</p>
        </div>
        <Button className="btn-primary" onClick={triggerBackup} disabled={triggering}>{triggering ? 'Requesting...' : 'Trigger Backup'}</Button>
      </div>

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading backup history...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">Size</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id} className="border-t border-border/60">
                    <td className="py-3">{b.timestamp}</td>
                    <td className="py-3">{b.size ? `${b.size} MB` : '-'}</td>
                    <td className="py-3">{b.status ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}


