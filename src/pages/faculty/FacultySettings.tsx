import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyProfileService } from '@/services/facultyService';
import { 
  Settings, Save, User, Bell, Clock, Globe, 
  Mail, Calendar, Shield, BookOpen
} from 'lucide-react';

export default function FacultySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    officeLocation: '',
    officeHours: '',
    phone: '',
    bio: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true,
    announcementAlerts: true,
    weeklyReports: false,
    deadlineAlerts: true
  });

  const [preferences, setPreferences] = useState({
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    gradeScale: 'letter',
    defaultLanguage: 'en',
    theme: 'system'
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 480,
    loginNotifications: true,
    passwordExpiry: 90
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profileData = await facultyProfileService.getProfile(user.id);
      if (profileData) {
        setProfile(prev => ({
          ...prev,
          name: profileData.name || prev.name,
          email: profileData.email || prev.email,
          department: profileData.department || prev.department,
          officeLocation: profileData.officeLocation || '',
          officeHours: profileData.officeHours || '',
          phone: profileData.phone || '',
          bio: profileData.bio || ''
        }));
        
        if (profileData.notifications) {
          setNotifications(profileData.notifications);
        }
        if (profileData.preferences) {
          setPreferences(profileData.preferences);
        }
        if (profileData.security) {
          setSecurity(profileData.security);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePreferenceChange = (field: string, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSecurity(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const profileData = {
        name: profile.name,
        email: profile.email,
        department: profile.department,
        officeLocation: profile.officeLocation,
        officeHours: profile.officeHours,
        phone: profile.phone,
        bio: profile.bio,
        notifications,
        preferences,
        security
      };
      
      await facultyProfileService.updateProfile(user.id, profileData);
      setHasChanges(false);
      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Faculty Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences.</p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving || !hasChanges}
          className="btn-primary"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save size={16} />
              Save Changes
            </div>
          )}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Profile Information</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your full name"
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@university.edu"
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Computer Science"
                    className="input-academic"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="officeLocation">Office Location</Label>
                  <Input
                    id="officeLocation"
                    value={profile.officeLocation}
                    onChange={(e) => handleInputChange('officeLocation', e.target.value)}
                    placeholder="Building 205, Room 301"
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeHours">Office Hours</Label>
                  <Input
                    id="officeHours"
                    value={profile.officeHours}
                    onChange={(e) => handleInputChange('officeHours', e.target.value)}
                    placeholder="Mon-Wed 2:00-4:00 PM"
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="input-academic"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell students about yourself, your research interests, and teaching philosophy..."
                className="input-academic mt-2"
                rows={4}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Assignment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminders for upcoming assignment deadlines</p>
                    </div>
                    <Switch
                      checked={notifications.assignmentReminders}
                      onCheckedChange={(checked) => handleNotificationChange('assignmentReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Grade Notifications</Label>
                      <p className="text-sm text-muted-foreground">Notify when students submit assignments</p>
                    </div>
                    <Switch
                      checked={notifications.gradeNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('gradeNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Announcement Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified about new announcements</p>
                    </div>
                    <Switch
                      checked={notifications.announcementAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('announcementAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Deadline Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get alerts for upcoming deadlines</p>
                    </div>
                    <Switch
                      checked={notifications.deadlineAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('deadlineAlerts', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Preferences</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={preferences.timezone} onValueChange={(value) => handlePreferenceChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={preferences.dateFormat} onValueChange={(value) => handlePreferenceChange('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gradeScale">Grade Scale</Label>
                  <Select value={preferences.gradeScale} onValueChange={(value) => handlePreferenceChange('gradeScale', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="letter">Letter Grades (A-F)</SelectItem>
                      <SelectItem value="percentage">Percentage (0-100)</SelectItem>
                      <SelectItem value="gpa">GPA Scale (0-4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={preferences.theme} onValueChange={(value) => handlePreferenceChange('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Security Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={security.twoFactorAuth}
                  onCheckedChange={(checked) => handleSecurityChange('twoFactorAuth', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="30"
                  max="1440"
                  value={security.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                  className="input-academic"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                </div>
                <Switch
                  checked={security.loginNotifications}
                  onCheckedChange={(checked) => handleSecurityChange('loginNotifications', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  min="30"
                  max="365"
                  value={security.passwordExpiry}
                  onChange={(e) => handleSecurityChange('passwordExpiry', parseInt(e.target.value))}
                  className="input-academic"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
