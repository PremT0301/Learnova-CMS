import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function RequestDenied() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <Card className="card-academic p-10 text-center space-y-6">
          <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2 text-destructive">Request Denied</h1>
            <p className="text-muted-foreground">
              Your faculty access request has been denied. Please contact an administrator if you believe this is an error.
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate('/login')}>Return to Login</Button>
            <Button onClick={() => navigate('/signup')}>Create Student Account</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
