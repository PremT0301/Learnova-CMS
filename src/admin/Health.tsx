import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Health() {
  const [metrics, setMetrics] = useState({ apiMs: 120, firestoreMs: 85, loginFailures: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Placeholder metrics; in future integrate Monitoring or custom collection
        await getDocs(collection(db, 'users'));
        setMetrics({ apiMs: 120, firestoreMs: 85, loginFailures: 2 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">System Health</h1>
        <p className="text-muted-foreground">Performance and reliability metrics</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="card-academic p-6">
          <p className="text-sm text-muted-foreground">API Response</p>
          <p className="text-2xl font-bold">{metrics.apiMs} ms</p>
        </Card>
        <Card className="card-academic p-6">
          <p className="text-sm text-muted-foreground">Firestore Query</p>
          <p className="text-2xl font-bold">{metrics.firestoreMs} ms</p>
        </Card>
        <Card className="card-academic p-6">
          <p className="text-sm text-muted-foreground">Login Failures</p>
          <p className="text-2xl font-bold">{metrics.loginFailures}</p>
        </Card>
      </div>

      {loading && (
        <Card className="card-academic p-4">
          <p className="text-muted-foreground">Loading metrics...</p>
        </Card>
      )}
    </div>
  );
}


