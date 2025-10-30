import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { db } from '@/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  Mail,
  Shield,
  Globe,
  Database
} from 'lucide-react';

type SystemConfig = {
  // Academic Settings
  academicYear: string;
  currentSemester: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  gradingScale: 'letter' | 'percentage' | 'gpa';
  
  // User Settings
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  defaultUserRole: 'student' | 'faculty';
  maxLoginAttempts: number;
  sessionTimeout: number; // in minutes
  
  // Course Settings
  maxCoursesPerStudent: number;
  maxStudentsPerCourse: number;
  allowCourseWithdrawal: boolean;
  withdrawalDeadline: string;
  
  // Notification Settings
  enableEmailNotifications: boolean;
  enableSystemAnnouncements: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  
  // Security Settings
  enableAuditLogging: boolean;
  enableIpWhitelist: boolean;
  allowedIpRanges: string[];
  requireStrongPasswords: boolean;
  passwordMinLength: number;
  
  // System Settings
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxFileUploadSize: number; // in MB
  supportedFileTypes: string[];
  
  // Backup Settings
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetentionDays: number;
  
  lastUpdated: string;
  updatedBy: string;
};

const defaultConfig: SystemConfig = {
  academicYear: '2024-2025',
  currentSemester: 'Fall',
  enrollmentStartDate: '2024-08-01',
  enrollmentEndDate: '2024-08-31',
  gradingScale: 'letter',
  allowSelfRegistration: true,
  requireEmailVerification: true,
  defaultUserRole: 'student',
  maxLoginAttempts: 5,
  sessionTimeout: 480,
  maxCoursesPerStudent: 6,
  maxStudentsPerCourse: 30,
  allowCourseWithdrawal: true,
  withdrawalDeadline: '2024-09-15',
  enableEmailNotifications: true,
  enableSystemAnnouncements: true,
  notificationFrequency: 'immediate',
  enableAuditLogging: true,
  enableIpWhitelist: false,
  allowedIpRanges: [],
  requireStrongPasswords: true,
  passwordMinLength: 8,
  maintenanceMode: false,
  maintenanceMessage: 'System is currently under maintenance. Please check back later.',
  maxFileUploadSize: 10,
  supportedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'gif'],
  autoBackupEnabled: true,
  backupFrequency: 'daily',
  backupRetentionDays: 30,
  lastUpdated: '',
  updatedBy: ''
};

export default function SystemConfiguration() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    setHasChanges(true);
  }, [config]);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const configRef = doc(db, 'system_config', 'main');
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const configData = configSnap.data() as SystemConfig;
        setConfig(configData);
        setLastSaved(configData.lastUpdated);
      } else {
        // Initialize with default config
        await setDoc(configRef, {
          ...defaultConfig,
          lastUpdated: new Date().toISOString(),
          updatedBy: user?.id || 'system'
        });
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({ title: 'Error', description: 'Failed to load system configuration', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof SystemConfig, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    setConfig(prev => ({ ...prev, [field]: arrayValue }));
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const configRef = doc(db, 'system_config', 'main');
      const configData = {
        ...config,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.id || 'system'
      };

      await updateDoc(configRef, configData);
      await logAudit('system_config_update', configData, user?.id);
      
      setLastSaved(configData.lastUpdated);
      setHasChanges(false);
      toast({ title: 'Success', description: 'System configuration saved successfully' });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const configRef = doc(db, 'system_config', 'main');
      const defaultData = {
        ...defaultConfig,
        lastUpdated: new Date().toISOString(),
        updatedBy: user?.id || 'system'
      };

      await updateDoc(configRef, defaultData);
      await logAudit('system_config_reset', defaultData, user?.id);
      
      setConfig(defaultData);
      setLastSaved(defaultData.lastUpdated);
      setHasChanges(false);
      toast({ title: 'Success', description: 'Configuration reset to defaults' });
    } catch (error) {
      console.error('Error resetting configuration:', error);
      toast({ title: 'Error', description: 'Failed to reset configuration', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading system configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">System Configuration</h1>
          <p className="text-muted-foreground">Manage system-wide settings and preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="text-sm text-muted-foreground">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </div>
          )}
          <Button
            onClick={resetToDefaults}
            variant="outline"
            disabled={saving}
          >
            <RefreshCw size={16} className="mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={saveConfiguration}
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
      </div>

      <Tabs defaultValue="academic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="academic">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Academic Settings</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={config.academicYear}
                    onChange={(e) => handleInputChange('academicYear', e.target.value)}
                    placeholder="2024-2025"
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentSemester">Current Semester</Label>
                  <Select value={config.currentSemester} onValueChange={(value) => handleInputChange('currentSemester', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fall">Fall</SelectItem>
                      <SelectItem value="Spring">Spring</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                      <SelectItem value="Winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradingScale">Grading Scale</Label>
                  <Select value={config.gradingScale} onValueChange={(value: any) => handleInputChange('gradingScale', value)}>
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
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollmentStartDate">Enrollment Start Date</Label>
                  <Input
                    id="enrollmentStartDate"
                    type="date"
                    value={config.enrollmentStartDate}
                    onChange={(e) => handleInputChange('enrollmentStartDate', e.target.value)}
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollmentEndDate">Enrollment End Date</Label>
                  <Input
                    id="enrollmentEndDate"
                    type="date"
                    value={config.enrollmentEndDate}
                    onChange={(e) => handleInputChange('enrollmentEndDate', e.target.value)}
                    className="input-academic"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">User Settings</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Self Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow users to register themselves</p>
                  </div>
                  <Switch
                    checked={config.allowSelfRegistration}
                    onCheckedChange={(checked) => handleInputChange('allowSelfRegistration', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    checked={config.requireEmailVerification}
                    onCheckedChange={(checked) => handleInputChange('requireEmailVerification', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">Enforce strong password requirements</p>
                  </div>
                  <Switch
                    checked={config.requireStrongPasswords}
                    onCheckedChange={(checked) => handleInputChange('requireStrongPasswords', checked)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultUserRole">Default User Role</Label>
                  <Select value={config.defaultUserRole} onValueChange={(value: any) => handleInputChange('defaultUserRole', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={config.maxLoginAttempts}
                    onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="30"
                    max="1440"
                    value={config.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="20"
                    value={config.passwordMinLength}
                    onChange={(e) => handleInputChange('passwordMinLength', parseInt(e.target.value))}
                    className="input-academic"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Course Settings</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Course Withdrawal</Label>
                    <p className="text-sm text-muted-foreground">Allow students to withdraw from courses</p>
                  </div>
                  <Switch
                    checked={config.allowCourseWithdrawal}
                    onCheckedChange={(checked) => handleInputChange('allowCourseWithdrawal', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawalDeadline">Withdrawal Deadline</Label>
                  <Input
                    id="withdrawalDeadline"
                    type="date"
                    value={config.withdrawalDeadline}
                    onChange={(e) => handleInputChange('withdrawalDeadline', e.target.value)}
                    className="input-academic"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxCoursesPerStudent">Max Courses Per Student</Label>
                  <Input
                    id="maxCoursesPerStudent"
                    type="number"
                    min="1"
                    max="20"
                    value={config.maxCoursesPerStudent}
                    onChange={(e) => handleInputChange('maxCoursesPerStudent', parseInt(e.target.value))}
                    className="input-academic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStudentsPerCourse">Max Students Per Course</Label>
                  <Input
                    id="maxStudentsPerCourse"
                    type="number"
                    min="1"
                    max="200"
                    value={config.maxStudentsPerCourse}
                    onChange={(e) => handleInputChange('maxStudentsPerCourse', parseInt(e.target.value))}
                    className="input-academic"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="card-academic p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="text-primary" size={24} />
              <h2 className="text-xl font-semibold">Notification Settings</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                  </div>
                  <Switch
                    checked={config.enableEmailNotifications}
                    onCheckedChange={(checked) => handleInputChange('enableEmailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable System Announcements</Label>
                    <p className="text-sm text-muted-foreground">Allow system-wide announcements</p>
                  </div>
                  <Switch
                    checked={config.enableSystemAnnouncements}
                    onCheckedChange={(checked) => handleInputChange('enableSystemAnnouncements', checked)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notificationFrequency">Notification Frequency</Label>
                  <Select value={config.notificationFrequency} onValueChange={(value: any) => handleInputChange('notificationFrequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
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
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all system activities for security</p>
                  </div>
                  <Switch
                    checked={config.enableAuditLogging}
                    onCheckedChange={(checked) => handleInputChange('enableAuditLogging', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">Restrict access to specific IP ranges</p>
                  </div>
                  <Switch
                    checked={config.enableIpWhitelist}
                    onCheckedChange={(checked) => handleInputChange('enableIpWhitelist', checked)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                {config.enableIpWhitelist && (
                  <div className="space-y-2">
                    <Label htmlFor="allowedIpRanges">Allowed IP Ranges</Label>
                    <Textarea
                      id="allowedIpRanges"
                      value={config.allowedIpRanges.join(', ')}
                      onChange={(e) => handleArrayChange('allowedIpRanges', e.target.value)}
                      placeholder="192.168.1.0/24, 10.0.0.0/8 (comma-separated)"
                      className="input-academic"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter IP ranges in CIDR notation, separated by commas
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-6">
            <Card className="card-academic p-6">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="text-primary" size={24} />
                <h2 className="text-xl font-semibold">System Settings</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Put system in maintenance mode</p>
                    </div>
                    <Switch
                      checked={config.maintenanceMode}
                      onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                    />
                  </div>
                  {config.maintenanceMode && (
                    <div className="space-y-2">
                      <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                      <Textarea
                        id="maintenanceMessage"
                        value={config.maintenanceMessage}
                        onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                        placeholder="System is currently under maintenance..."
                        className="input-academic"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
                    <Input
                      id="maxFileUploadSize"
                      type="number"
                      min="1"
                      max="100"
                      value={config.maxFileUploadSize}
                      onChange={(e) => handleInputChange('maxFileUploadSize', parseInt(e.target.value))}
                      className="input-academic"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportedFileTypes">Supported File Types</Label>
                    <Input
                      id="supportedFileTypes"
                      value={config.supportedFileTypes.join(', ')}
                      onChange={(e) => handleArrayChange('supportedFileTypes', e.target.value)}
                      placeholder="pdf, doc, docx, jpg, png"
                      className="input-academic"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="card-academic p-6">
              <div className="flex items-center gap-3 mb-6">
                <Database className="text-primary" size={24} />
                <h2 className="text-xl font-semibold">Backup Settings</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Backup Enabled</Label>
                      <p className="text-sm text-muted-foreground">Automatically backup system data</p>
                    </div>
                    <Switch
                      checked={config.autoBackupEnabled}
                      onCheckedChange={(checked) => handleInputChange('autoBackupEnabled', checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={config.backupFrequency} onValueChange={(value: any) => handleInputChange('backupFrequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupRetentionDays">Backup Retention (days)</Label>
                    <Input
                      id="backupRetentionDays"
                      type="number"
                      min="7"
                      max="365"
                      value={config.backupRetentionDays}
                      onChange={(e) => handleInputChange('backupRetentionDays', parseInt(e.target.value))}
                      className="input-academic"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
