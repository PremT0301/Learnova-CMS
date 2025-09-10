import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Admin • Analytics</h1>
        <p className="text-muted-foreground">Key insights and reports.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 />
            <h2 className="text-lg font-semibold">User Growth</h2>
          </div>
          <div className="h-48 bg-muted rounded-lg" />
        </Card>

        <Card className="card-academic p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 />
            <h2 className="text-lg font-semibold">Course Engagement</h2>
          </div>
          <div className="h-48 bg-muted rounded-lg" />
        </Card>
      </div>
    </div>
  );
}


