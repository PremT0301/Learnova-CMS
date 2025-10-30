import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { facultyCourseService } from '@/services/facultyService';
import { 
  Upload, FileText, Video, Image, Link, 
  Download, Eye, Edit, Trash2, Plus,
  Folder, File, Search, Filter
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'document' | 'video' | 'image' | 'link' | 'folder';
  courseId: string;
  description?: string;
  url?: string;
  fileSize?: string;
  uploadDate: Date;
  downloads: number;
  tags: string[];
  isPublic: boolean;
}

export default function ContentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    type: 'document',
    tags: '',
    isPublic: true
  });

  // Link form state
  const [linkForm, setLinkForm] = useState({
    title: '',
    description: '',
    url: '',
    type: 'link',
    tags: '',
    isPublic: true
  });

  useEffect(() => {
    if (user?.id) {
      loadCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      loadContentItems();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const coursesData = await facultyCourseService.getFacultyCourses(user.id);
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContentItems = async () => {
    // Mock data for now - in real implementation, this would fetch from Firestore
    const mockContent: ContentItem[] = [
      {
        id: '1',
        title: 'Introduction to Data Structures',
        type: 'document',
        courseId: selectedCourse,
        description: 'Comprehensive guide to basic data structures',
        fileSize: '2.5 MB',
        uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        downloads: 45,
        tags: ['data-structures', 'introduction', 'pdf'],
        isPublic: true
      },
      {
        id: '2',
        title: 'Binary Tree Implementation Tutorial',
        type: 'video',
        courseId: selectedCourse,
        description: 'Step-by-step tutorial on implementing binary trees',
        url: 'https://example.com/video1',
        uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        downloads: 78,
        tags: ['binary-trees', 'tutorial', 'video'],
        isPublic: true
      },
      {
        id: '3',
        title: 'Assignment Guidelines',
        type: 'document',
        courseId: selectedCourse,
        description: 'General guidelines for all assignments',
        fileSize: '1.2 MB',
        uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        downloads: 120,
        tags: ['guidelines', 'assignments'],
        isPublic: false
      },
      {
        id: '4',
        title: 'Online Algorithm Visualizer',
        type: 'link',
        courseId: selectedCourse,
        description: 'Interactive tool for visualizing sorting algorithms',
        url: 'https://visualgo.net/en/sorting',
        uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        downloads: 0,
        tags: ['algorithms', 'visualization', 'sorting'],
        isPublic: true
      }
    ];
    setContentItems(mockContent);
  };

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filterType === 'all' ||
      item.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Mock file upload - in real implementation, this would upload to Firebase Storage
    const newItem: ContentItem = {
      id: Date.now().toString(),
      title: uploadForm.title || file.name,
      type: uploadForm.type as any,
      courseId: selectedCourse,
      description: uploadForm.description,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      uploadDate: new Date(),
      downloads: 0,
      tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPublic: uploadForm.isPublic
    };

    setContentItems(prev => [newItem, ...prev]);
    setShowUploadForm(false);
    setUploadForm({
      title: '',
      description: '',
      type: 'document',
      tags: '',
      isPublic: true
    });

    toast({
      title: 'Success',
      description: 'File uploaded successfully'
    });
  };

  const handleLinkSubmit = () => {
    if (!linkForm.title || !linkForm.url) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const newItem: ContentItem = {
      id: Date.now().toString(),
      title: linkForm.title,
      type: 'link',
      courseId: selectedCourse,
      description: linkForm.description,
      url: linkForm.url,
      uploadDate: new Date(),
      downloads: 0,
      tags: linkForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPublic: linkForm.isPublic
    };

    setContentItems(prev => [newItem, ...prev]);
    setShowLinkForm(false);
    setLinkForm({
      title: '',
      description: '',
      url: '',
      type: 'link',
      tags: '',
      isPublic: true
    });

    toast({
      title: 'Success',
      description: 'Link added successfully'
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setContentItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: 'Success',
        description: 'Item deleted successfully'
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText size={20} className="text-blue-600" />;
      case 'video': return <Video size={20} className="text-red-600" />;
      case 'image': return <Image size={20} className="text-green-600" />;
      case 'link': return <Link size={20} className="text-purple-600" />;
      case 'folder': return <Folder size={20} className="text-yellow-600" />;
      default: return <File size={20} className="text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-green-100 text-green-800';
      case 'link': return 'bg-purple-100 text-purple-800';
      case 'folder': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Content Management</h1>
          <p className="text-muted-foreground">Manage course materials and resources</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowLinkForm(true)} variant="outline">
            <Link size={20} className="mr-2" />
            Add Link
          </Button>
          <Button onClick={() => setShowUploadForm(true)} className="btn-primary">
            <Upload size={20} className="mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Course Selection */}
      <Card className="card-academic p-4">
        <div className="flex items-center gap-4">
          <Label className="font-medium">Course:</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code}: {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="card-academic p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} />
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="link">Links</SelectItem>
              <SelectItem value="folder">Folders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent.length === 0 ? (
          <div className="col-span-full">
            <Card className="card-academic p-12 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first course material'}
              </p>
              <Button onClick={() => setShowUploadForm(true)}>
                <Upload size={16} className="mr-2" />
                Upload Content
              </Button>
            </Card>
          </div>
        ) : (
          filteredContent.map((item) => (
            <Card key={item.id} className="card-academic p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <Badge className={getTypeColor(item.type)}>
                    {item.type}
                  </Badge>
                  {!item.isPublic && (
                    <Badge variant="secondary">Private</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Eye size={16} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <h3 className="font-semibold mb-2 truncate">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uploaded: {item.uploadDate.toLocaleDateString()}</span>
                  <span>{item.downloads} downloads</span>
                </div>
                {item.fileSize && (
                  <div className="text-xs text-muted-foreground">
                    Size: {item.fileSize}
                  </div>
                )}
              </div>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download size={14} className="mr-1" />
                  Download
                </Button>
                {item.type === 'link' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <Link size={14} className="mr-1" />
                      Open
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upload File</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowUploadForm(false)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="File title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="File description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="lecture, notes, pdf"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowUploadForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Link Form Modal */}
      {showLinkForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Add Link</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowLinkForm(false)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkTitle">Title *</Label>
                  <Input
                    id="linkTitle"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Link title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkUrl">URL *</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkDescription">Description</Label>
                  <Textarea
                    id="linkDescription"
                    value={linkForm.description}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Link description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkTags">Tags (comma-separated)</Label>
                  <Input
                    id="linkTags"
                    value={linkForm.tags}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tutorial, external, resource"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowLinkForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleLinkSubmit}>
                    Add Link
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
