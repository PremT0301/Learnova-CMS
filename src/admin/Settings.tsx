import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { db } from '@/firebase';
import { collection, doc, getDocs, query, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';

type SettingsDoc = {
  grading: { gpaScale: number; passThreshold: number };
  notifications: { email: boolean; inApp: boolean };
  features: { gamification: boolean; peerReviews: boolean };
};

const DEFAULT_SETTINGS: SettingsDoc = {
  grading: { gpaScale: 4.0, passThreshold: 50 },
  notifications: { email: true, inApp: true },
  features: { gamification: false, peerReviews: false },
};

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsDoc>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'settings')));
        const first = snap.docs[0];
        if (first) {
          setSettings(first.data() as SettingsDoc);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const save = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
      toast({ title: 'Saved', description: 'Settings have been updated' });
      logAudit('settings_update', settings as unknown as Record<string, unknown>, user?.id);
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">System Settings</h1>
        <p className="text-muted-foreground">Manage grading scales and system preferences</p>
      </div>

      <Card className="card-academic p-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>GPA Scale</Label>
            <Input type="number" step="0.1" value={settings.grading.gpaScale}
              onChange={(e) => setSettings({ ...settings, grading: { ...settings.grading, gpaScale: Number(e.target.value) } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Pass Threshold (%)</Label>
            <Input type="number" value={settings.grading.passThreshold}
              onChange={(e) => setSettings({ ...settings, grading: { ...settings.grading, passThreshold: Number(e.target.value) } })}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Email Notifications</Label>
            <div>
              <Switch checked={settings.notifications.email}
                onCheckedChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, email: v } })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>In-App Notifications</Label>
            <div>
              <Switch checked={settings.notifications.inApp}
                onCheckedChange={(v) => setSettings({ ...settings, notifications: { ...settings.notifications, inApp: v } })}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Gamification</Label>
            <div>
              <Switch checked={settings.features.gamification}
                onCheckedChange={(v) => setSettings({ ...settings, features: { ...settings.features, gamification: v } })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Peer Reviews</Label>
            <div>
              <Switch checked={settings.features.peerReviews}
                onCheckedChange={(v) => setSettings({ ...settings, features: { ...settings.features, peerReviews: v } })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="btn-primary" onClick={save}>Save</Button>
          <Button variant="outline" onClick={reset}>Reset to defaults</Button>
        </div>
      </Card>

      {loading && (
        <Card className="card-academic p-4">
          <p className="text-muted-foreground">Loading current settings...</p>
        </Card>
      )}
    </div>
  );
}


