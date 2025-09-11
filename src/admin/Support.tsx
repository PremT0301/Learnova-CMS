import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/firebase';
import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Ticket = { id: string; userId: string; issue: string; status: 'open'|'in_progress'|'closed'; response?: string };

export default function Support() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')));
      setTickets(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch {
      toast({ title: 'Error', description: 'Failed to load tickets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const reply = async (id: string, newStatus: Ticket['status']) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), { response: response[id] ?? '', status: newStatus });
      toast({ title: 'Updated', description: 'Ticket updated' });
      await load();
    } catch {
      toast({ title: 'Error', description: 'Failed to update ticket', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Support & Feedback</h1>
        <p className="text-muted-foreground">Respond to user tickets and collect feedback</p>
      </div>

      <Card className="card-academic p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading tickets...</p>
        ) : (
          <div className="space-y-6">
            {tickets.map((t) => (
              <div key={t.id} className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.issue}</p>
                    <p className="text-xs text-muted-foreground">User: {t.userId} • Status: {t.status}</p>
                  </div>
                </div>
                <div className="mt-3 grid md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Textarea placeholder="Write a response" value={response[t.id] ?? ''} onChange={(e) => setResponse({ ...response, [t.id]: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => reply(t.id, 'in_progress')}>Set In-Progress</Button>
                    <Button className="btn-primary" onClick={() => reply(t.id, 'closed')}>Close</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}


