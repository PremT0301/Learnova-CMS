import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      if (result.redirect) {
        navigate(result.redirect);
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
          variant: "default",
        });
        navigate('/');
      }
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password. Try 'demo123' as password.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-hero mb-2">Learnova</h1>
          <p className="text-muted-foreground text-lg">Course Management System</p>
        </div>

        <Card className="card-academic p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-academic"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-academic pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Forgot your password?</span>
                <button
                  type="button"
                  className="text-primary hover:underline disabled:opacity-50"
                  disabled={isResetting || !email}
                  onClick={async () => {
                    if (!email) {
                      toast({
                        title: 'Enter your email',
                        description: 'Please provide the email you use to sign in.',
                        variant: 'default',
                      });
                      return;
                    }
                    try {
                      setIsResetting(true);
                      await sendPasswordResetEmail(auth, email);
                      toast({
                        title: 'Password reset sent',
                        description: 'Check your inbox for a reset link.',
                        variant: 'default',
                      });
                    } catch (err) {
                      toast({
                        title: 'Could not send reset email',
                        description: 'Verify the email is correct and try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsResetting(false);
                    }
                  }}
                >
                  {isResetting ? 'Sending…' : 'Reset password'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn size={20} />
                  Sign In
                </div>
              )}
            </Button>
            <div className="text-center text-sm">
              New here? <a href="/signup" className="text-primary hover:underline">Create an account</a>
            </div>
          </form>

        </Card>
      </div>
    </div>
  );
}