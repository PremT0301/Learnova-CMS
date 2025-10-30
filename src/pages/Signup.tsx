import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { UserRole } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Basic client-side validation to avoid malformed requests
      const trimmedEmail = email.trim();
      const trimmedPassword = password;
      if (!trimmedEmail || !trimmedPassword) {
        toast({ title: 'Email and password are required', variant: 'destructive' });
        return;
      }
      if (trimmedPassword.length < 6) {
        toast({ title: 'Weak password', description: 'Use at least 6 characters.', variant: 'destructive' });
        return;
      }

      // Set flag to prevent AuthContext from interfering during signup
      sessionStorage.setItem('signup_in_progress', 'true');

      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      const uid = cred.user.uid;
      const normalizedEmail = trimmedEmail.toLowerCase();
      const selectedRole: UserRole = role === 'admin' ? 'student' : role; // prevent admin self-signup

      // If faculty, create as inactive and open a verification request
      if (selectedRole === 'faculty') {
        try {
          console.log('Creating faculty user profile and request...');
          console.log('UID:', uid);
          console.log('Email:', normalizedEmail);

          // Use batch write for atomic operation
          const batch = writeBatch(db);

          // Create user document
          const userRef = doc(db, 'users', uid);
          batch.set(userRef, {
            email: normalizedEmail,
            name: name || normalizedEmail,
            role: 'faculty',
            active: false,
            joinDate: new Date().toISOString().slice(0, 10),
          });

          console.log('User document added to batch');

          // Create faculty request document
          const requestRef = doc(db, 'faculty_requests', uid);
          batch.set(requestRef, {
            userId: uid,
            email: normalizedEmail,
            name: name || normalizedEmail,
            status: 'pending',
            requestedAt: new Date().toISOString(),
          });

          console.log('Faculty request document added to batch');

          // Commit the batch
          await batch.commit();

          console.log('Batch committed successfully - both documents created');

          // Clear the signup flag
          sessionStorage.removeItem('signup_in_progress');

          // Sign out the user immediately since they can't access the system yet
          await signOut(auth);

          console.log('User signed out, navigating to review page');

          toast({
            title: 'Signup submitted',
            description: 'Your faculty account is pending admin approval.',
          });

          // Navigate to review page
          navigate('/request-under-review');

          return;
        } catch (facultyError: any) {
          // Clear the signup flag
          sessionStorage.removeItem('signup_in_progress');

          // If faculty signup fails, delete the auth account to maintain consistency
          console.error('Faculty signup error:', facultyError);
          console.error('Error code:', facultyError?.code);
          console.error('Error message:', facultyError?.message);
          console.error('Full error object:', facultyError);

          // Try to delete the auth account
          try {
            await cred.user.delete();
            console.log('Auth account deleted after error');
          } catch (deleteError) {
            console.error('Failed to delete auth account:', deleteError);
          }

          throw facultyError;
        }
      }

      // Student signup - also set flag
      sessionStorage.removeItem('signup_in_progress');

      // Student path: activate immediately
      await setDoc(doc(db, 'users', uid), {
        email: normalizedEmail,
        name: name || normalizedEmail,
        role: 'student',
        active: true,
        joinDate: new Date().toISOString().slice(0, 10),
      });
      toast({
        title: 'Account created',
        description: 'Welcome to Learnova! Redirecting to your dashboard...',
      });
      navigate('/');
    } catch (err: any) {
      const code: string | undefined = err?.code;
      let message = 'Could not create account. Please try again.';
      if (code === 'auth/email-already-in-use') message = 'Email already in use. Try logging in.';
      else if (code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
      else if (code === 'auth/invalid-email') message = 'Invalid email format.';
      else if (code === 'auth/missing-email') message = 'Email is required.';
      else if (code === 'auth/operation-not-allowed') message = 'Email/Password sign-in is disabled in Firebase.';
      else if (code === 'auth/network-request-failed') message = 'Network error. Check connection and try again.';
      else if (code === 'permission-denied') message = 'Permission denied. Please check Firestore security rules.';
      else if (err?.message) message = err.message;

      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
      // eslint-disable-next-line no-console
      console.error('Signup failed:', code, err?.message);
      console.error('Full error:', err);
    } finally {
      // Always clear the signup flag
      sessionStorage.removeItem('signup_in_progress');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-hero mb-2">Learnova</h1>
          <p className="text-muted-foreground text-lg">Create your account</p>
        </div>

        <Card className="card-academic p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} className="input-academic" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-academic" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-academic" required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="input-academic">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Admin role grants full access.</p>
            </div>

            <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </Button>

            <div className="text-center text-sm">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}


