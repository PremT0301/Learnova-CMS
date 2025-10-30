import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, Mail, Phone, MapPin, Calendar, GraduationCap, 
  Bell, Shield, Eye, EyeOff, Save, Upload, Camera,
  BookOpen, Award, Clock, Settings
} from 'lucide-react';

export default function StudentSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Profile data (in real app, this would come from Firebase)
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(' ')[0] || 'John',
    lastName: user?.name?.split(' ')[1] || 'Doe',
    email: user?.email || 'john.doe@university.edu',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '2000-05-15',
    address: '123 University Ave, College Town, ST 12345',
    major: 'Computer Science',
    year: 'Junior',
    studentId: 'STU2024001',
    gpa: '3.7',
    credits: '90',
    expectedGraduation: '2025-05-15',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Mother',
      phone: '+1 (555) 987-6543'
    }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeUpdates: true,
    announcementAlerts: true,
    courseUpdates: false,
    weeklyDigest: true,
    marketingEmails: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'students',
    showGPA: true,
    showCourses: true,
    allowMessages: true,
    showOnlineStatus: true,
    dataSharing: false
  });

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (setting: string) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }));
  };

  const handlePrivacyToggle = (setting: string) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: !prev[setting as keyof typeof prev] }));
  };

  const handleSaveProfile = () => {
    // In real app, save to Firebase
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  const academicStats = [
    {
      label: 'Current GPA',
      value: profileData.gpa,
      icon: Award,
      color: 'text-success'
    },
    {
      label: 'Credits Earned',
      value: profileData.credits,
      icon: BookOpen,
      color: 'text-primary'
    },
    {
      label: 'Expected Graduation',
      value: new Date(profileData.expectedGraduation).getFullYear().toString(),
      icon: GraduationCap,
      color: 'text-accent'
    },
    {
      label: 'Student Since',
      value: '2022',
      icon: Calendar,
      color: 'text-warning'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>

      {/* Academic Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {academicStats.map((stat, index) => (
          <Card key={index} className="card-academic p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <Button 
                variant={isEditing ? "default" : "outline"} 
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Profile Picture */}
              <div className="space-y-4">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src="" alt={profileData.firstName} />
                    <AvatarFallback className="text-lg">
                      {profileData.firstName[0]}{profileData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileUpdate('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => handleProfileUpdate('dateOfBirth', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={profileData.studentId}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profileData.address}
                onChange={(e) => handleProfileUpdate('address', e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </Card>

          {/* Academic Information */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-6">Academic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="major">Major</Label>
                <Select value={profileData.major} onValueChange={(value) => handleProfileUpdate('major', value)} disabled={!isEditing}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                    <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Academic Year</Label>
                <Select value={profileData.year} onValueChange={(value) => handleProfileUpdate('year', value)} disabled={!isEditing}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Freshman">Freshman</SelectItem>
                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-6">Emergency Contact</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergencyName">Contact Name</Label>
                <Input
                  id="emergencyName"
                  value={profileData.emergencyContact.name}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input
                  id="emergencyRelationship"
                  value={profileData.emergencyContact.relationship}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Phone Number</Label>
                <Input
                  id="emergencyPhone"
                  value={profileData.emergencyContact.phone}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
            <div className="space-y-6">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === 'emailNotifications' && 'Receive notifications via email'}
                      {key === 'pushNotifications' && 'Receive push notifications on mobile'}
                      {key === 'assignmentReminders' && 'Get reminded about upcoming assignments'}
                      {key === 'gradeUpdates' && 'Notify when grades are posted'}
                      {key === 'announcementAlerts' && 'Alert for new announcements'}
                      {key === 'courseUpdates' && 'Updates about course changes'}
                      {key === 'weeklyDigest' && 'Weekly summary of activities'}
                      {key === 'marketingEmails' && 'Receive promotional emails'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={() => handleNotificationToggle(key)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
            <div className="space-y-6">
              <div>
                <Label>Profile Visibility</Label>
                <Select value={privacySettings.profileVisibility} onValueChange={(value) => 
                  setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))
                }>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Everyone can see</SelectItem>
                    <SelectItem value="students">Students Only</SelectItem>
                    <SelectItem value="faculty">Faculty Only</SelectItem>
                    <SelectItem value="private">Private - No one can see</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {Object.entries(privacySettings).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === 'showGPA' && 'Allow others to see your GPA'}
                      {key === 'showCourses' && 'Show enrolled courses on profile'}
                      {key === 'allowMessages' && 'Allow other students to message you'}
                      {key === 'showOnlineStatus' && 'Show when you are online'}
                      {key === 'dataSharing' && 'Allow data sharing for research purposes'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={() => handlePrivacyToggle(key)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
