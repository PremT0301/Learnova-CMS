import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function RequestUnderReview() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <Card className="card-academic p-10 text-center space-y-6">
          <div className="mx-auto w-24 h-24 rounded-full border-8 border-primary/20 border-t-primary animate-spin" />
          <div>
            <h1 className="text-2xl font-bold mb-2">Request Under Review</h1>
            <p className="text-muted-foreground">
              Your faculty access request has been submitted and is awaiting admin approval. You'll be notified once it's approved.
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate('/login')}>Return to Login</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}


