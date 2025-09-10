import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { db, auth } from '@/firebase';
import { collection, addDoc, updateDoc, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { UserRole } from '@/types';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'student' as UserRole,
    department: '',
    avatar: '',
    active: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const name = formData.name.trim() || email;
      const password = formData.password;
      
      // Check if user already exists in Firestore
      const q = query(collection(db, 'users'), where('email', '==', email));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        toast({
          title: "Error",
          description: "User with this email already exists",
          variant: "destructive",
        });
        return;
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create Firestore user profile
      const userData: Record<string, any> = {
        email,
        name,
        role: formData.role,
        active: formData.active,
        joinDate: new Date().toISOString().slice(0, 10)
      };

      // Only add optional fields if they have values
      if (formData.department.trim()) {
        userData.department = formData.department.trim();
      }
      if (formData.avatar.trim()) {
        userData.avatar = formData.avatar.trim();
      }
      
      // Save user profile to Firestore with Firebase UID as document ID
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      toast({
        title: "Success",
        description: "User created successfully and can now log in",
      });
      
      // Navigate back to users list
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = "Failed to create user. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "User with this email already exists in authentication";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Create User</h1>
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      <Card className="card-academic p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="input-academic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-academic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="input-academic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className="input-academic">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                type="text"
                placeholder="Computer Science"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="input-academic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={formData.avatar}
              onChange={(e) => handleInputChange('avatar', e.target.value)}
              className="input-academic"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleInputChange('active', e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="active">Active User (can log in)</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus size={20} />
                  Create User
                </div>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
