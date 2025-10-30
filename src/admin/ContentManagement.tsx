import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { db, storage } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logAudit } from '@/lib/audit';
import { 
  FolderOpen, 
  Upload, 
  Download, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Folder,
  Plus,
  Share,
  Lock,
  Unlock,
  Star,
  Clock,
  User,
  Calendar,
  HardDrive,
  BarChart3,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';

type ContentItem = {
  id: string;
  name: string;
  description?: string;
  type: 'file' | 'folder';
  fileType?: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  mimeType?: string;
  size: number;
  url?: string;
  thumbnailUrl?: string;
  parentId?: string;
  tags: string[];
  category: string;
  visibility: 'public' | 'private' | 'restricted';
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  downloadCount: number;
  version: number;
  isStarred: boolean;
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
  };
};

type Folder = {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  createdAt: string;
  createdBy: string;
  itemCount: number;
  totalSize: number;
};

type ContentStats = {
  totalItems: number;
  totalSize: number;
  fileTypes: { [key: string]: number };
  categories: { [key: string]: number };
  recentUploads: number;
  popularFiles: ContentItem[];
  storageUsage: number;
  storageLimit: number;
};

export default function ContentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'file' | 'folder'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private' | 'restricted'>('all');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'downloads'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState<ContentStats>({
    totalItems: 0,
    totalSize: 0,
    fileTypes: {},
    categories: {},
    recentUploads: 0,
    popularFiles: [],
    storageUsage: 0,
    storageLimit: 10737418240 // 10GB in bytes
  });
  
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'general',
    tags: '',
    visibility: 'private' as ContentItem['visibility'],
    parentId: ''
  });

  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    parentId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load content items
      const itemsQuery = query(collection(db, 'content_items'), orderBy('uploadedAt', 'desc'));
      const itemsSnapshot = await getDocs(itemsQuery);
      const itemsList = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContentItem[];
      setContentItems(itemsList);

      // Load folders
      const foldersQuery = query(collection(db, 'content_folders'), orderBy('createdAt', 'desc'));
      const foldersSnapshot = await getDocs(foldersQuery);
      const foldersList = foldersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Folder[];
      setFolders(foldersList);

      // Calculate stats
      const totalItems = itemsList.length;
      const totalSize = itemsList.reduce((sum, item) => sum + item.size, 0);
      
      const fileTypes = itemsList.reduce((acc, item) => {
        if (item.fileType) {
          acc[item.fileType] = (acc[item.fileType] || 0) + 1;
        }
        return acc;
      }, {} as { [key: string]: number });

      const categories = itemsList.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const recentUploads = itemsList.filter(item => {
        const uploadDate = new Date(item.uploadedAt);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return uploadDate > oneDayAgo;
      }).length;

      const popularFiles = itemsList
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 5);

      setStats({
        totalItems,
        totalSize,
        fileTypes,
        categories,
        recentUploads,
        popularFiles,
        storageUsage: totalSize,
        storageLimit: 10737418240
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error', description: 'Failed to load content data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = contentItems;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Filter by visibility
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(item => item.visibility === visibilityFilter);
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'downloads':
          aValue = a.downloadCount;
          bValue = b.downloadCount;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  }, [contentItems, searchTerm, typeFilter, categoryFilter, visibilityFilter, sortBy, sortOrder]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create file reference (use Firebase Storage)
      const fileRef = ref(storage, `content/${Date.now()}_${file.name}`);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(fileRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snap) => {
            if (snap.totalBytes > 0) {
              setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
            }
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      // Create content item record
      const contentItem: Omit<ContentItem, 'id'> = {
        name: uploadForm.name || file.name,
        description: uploadForm.description,
        type: 'file',
        fileType: getFileType(file.type),
        mimeType: file.type,
        size: file.size,
        url: downloadURL,
        parentId: uploadForm.parentId || null,
        tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        category: uploadForm.category,
        visibility: uploadForm.visibility,
        uploadedBy: user?.id || '',
        uploadedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        downloadCount: 0,
        version: 1,
        isStarred: false,
        permissions: {
          canView: [],
          canEdit: [],
          canDelete: []
        }
      };

      await addDoc(collection(db, 'content_items'), contentItem);
      await logAudit('content_upload', contentItem, user?.id);
      
      toast({ title: 'Success', description: 'File uploaded successfully' });
      setShowUploadDialog(false);
      setUploadForm({
        name: '',
        description: '',
        category: 'general',
        tags: '',
        visibility: 'private',
        parentId: ''
      });
      await loadData();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileType = (mimeType: string): ContentItem['fileType'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive';
    return 'other';
  };

  const getFileIcon = (item: ContentItem) => {
    if (item.type === 'folder') return <Folder className="text-blue-500" size={24} />;
    
    switch (item.fileType) {
      case 'document':
        return <FileText className="text-blue-500" size={24} />;
      case 'image':
        return <Image className="text-green-500" size={24} />;
      case 'video':
        return <Video className="text-purple-500" size={24} />;
      case 'audio':
        return <Music className="text-orange-500" size={24} />;
      case 'archive':
        return <Archive className="text-red-500" size={24} />;
      default:
        return <File className="text-gray-500" size={24} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVisibilityColor = (visibility: ContentItem['visibility']) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'private':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'restricted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Content Management</h1>
          <p className="text-muted-foreground">Manage files, folders, and resources across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateFolderDialog(true)}
            variant="outline"
            className="btn-secondary"
          >
            <Folder className="mr-2" size={16} />
            New Folder
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Upload size={16} className="mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    className="input-academic"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">File Name</Label>
                  <Input
                    id="name"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Custom file name (optional)"
                    className="input-academic"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="File description..."
                    rows={3}
                    className="input-academic"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="images">Images</SelectItem>
                        <SelectItem value="videos">Videos</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="archives">Archives</SelectItem>
                        <SelectItem value="templates">Templates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={uploadForm.visibility} onValueChange={(value: any) => setUploadForm(prev => ({ ...prev, visibility: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3 (comma-separated)"
                    className="input-academic"
                  />
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <FolderOpen className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <HardDrive className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Upload className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Recent Uploads</p>
              <p className="text-2xl font-bold">{stats.recentUploads}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-purple-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Storage Usage</p>
              <p className="text-2xl font-bold">{((stats.storageUsage / stats.storageLimit) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className="card-academic p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Storage Usage</h3>
          <span className="text-sm text-muted-foreground">
            {formatFileSize(stats.storageUsage)} / {formatFileSize(stats.storageLimit)}
          </span>
        </div>
        <Progress value={(stats.storageUsage / stats.storageLimit) * 100} className="w-full" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>0%</span>
          <span>100%</span>
        </div>
      </Card>

      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files">Files & Folders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="popular">Popular Files</TabsTrigger>
        </TabsList>

        <TabsContent value="files">
          {/* Filters and Controls */}
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={16} />
                  <span className="font-medium">Filters:</span>
                </div>
                <div className="relative max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search files and folders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="file">Files</SelectItem>
                    <SelectItem value="folder">Folders</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.keys(stats.categories).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                </Button>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [sort, order] = value.split('-');
                  setSortBy(sort as any);
                  setSortOrder(order as any);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="size-desc">Largest First</SelectItem>
                    <SelectItem value="size-asc">Smallest First</SelectItem>
                    <SelectItem value="downloads-desc">Most Downloaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Content Grid/List */}
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Content ({filteredItems.length})</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading content...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No content found matching your criteria.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
                {filteredItems.map((item) => (
                  <div key={item.id} className={`${viewMode === 'grid' ? 'p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors' : 'p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors'}`}>
                    <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center justify-between'}>
                      <div className={`${viewMode === 'grid' ? 'text-center' : 'flex items-center gap-3'}`}>
                        <div className="flex justify-center">
                          {getFileIcon(item)}
                        </div>
                        <div className={viewMode === 'grid' ? 'mt-2' : 'flex-1'}>
                          <h3 className={`font-medium ${viewMode === 'grid' ? 'text-sm' : 'text-base'}`}>
                            {item.name}
                          </h3>
                          {viewMode === 'list' && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>{formatFileSize(item.size)}</span>
                              <Badge className={`${getVisibilityColor(item.visibility)} border`}>
                                {item.visibility}
                              </Badge>
                              <span>{item.downloadCount} downloads</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`${viewMode === 'grid' ? 'flex justify-center gap-2' : 'flex items-center gap-2'}`}>
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download size={14} />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    {viewMode === 'grid' && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>{formatFileSize(item.size)}</span>
                        <Badge className={`${getVisibilityColor(item.visibility)} border`}>
                          {item.visibility}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-academic p-6">
              <h3 className="text-lg font-semibold mb-4">File Types Distribution</h3>
              <div className="space-y-3">
                {Object.entries(stats.fileTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / stats.totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="card-academic p-6">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="space-y-3">
                {Object.entries(stats.categories).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(count / stats.totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="popular">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Most Downloaded Files</h2>
            <div className="space-y-4">
              {stats.popularFiles.map((file, index) => (
                <div key={file.id} className="flex items-center gap-4 p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.downloadCount} downloads
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
