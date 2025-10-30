import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Upload,
  Download,
  FileText,
  Video,
  Link as LinkIcon,
  File,
  Trash2,
  Calendar,
  User
} from 'lucide-react';
import { CourseMaterial } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface MaterialsTabProps {
  courseId: string;
  materials: CourseMaterial[];
  onRefresh: () => void;
  isInstructor: boolean;
}

export default function MaterialsTab({ 
  courseId, 
  materials, 
  onRefresh,
  isInstructor 
}: MaterialsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document' as 'pdf' | 'video' | 'document' | 'link' | 'other',
    linkUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name });
      }
    }
  };

  const handleUploadMaterial = async () => {
    if (!formData.title) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }

    if (formData.type !== 'link' && !selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (formData.type === 'link' && !formData.linkUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a link URL',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let fileUrl = formData.linkUrl;
      let fileName = '';
      let fileSize = 0;

      if (selectedFile && formData.type !== 'link') {
        // Upload file to Firebase Storage
        const storageRef = ref(storage, `course_materials/${courseId}/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            () => resolve()
          );
        });

        fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      }

      // Create material document
      await addDoc(collection(db, 'course_materials'), {
        courseId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        fileUrl,
        fileName,
        fileSize,
        uploadedBy: user?.id || '',
        uploadedAt: serverTimestamp(),
        isPublished: true,
      });

      toast({
        title: 'Success',
        description: 'Material uploaded successfully',
      });

      setShowUploadDialog(false);
      setFormData({
        title: '',
        description: '',
        type: 'document',
        linkUrl: ''
      });
      setSelectedFile(null);
      setUploadProgress(0);
      onRefresh();
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload material',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await deleteDoc(doc(db, 'course_materials', materialId));
      toast({
        title: 'Success',
        description: 'Material deleted successfully',
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete material',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (material: CourseMaterial) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="text-red-500" size={24} />;
      case 'video':
        return <Video className="text-blue-500" size={24} />;
      case 'link':
        return <LinkIcon className="text-green-500" size={24} />;
      default:
        return <File className="text-gray-500" size={24} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Materials</h2>
          <p className="text-muted-foreground">Access lecture notes, videos, and other resources</p>
        </div>
        {isInstructor && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="mr-2" size={16} />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Course Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title *</label>
                  <Input
                    placeholder="Enter material title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Enter material description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === 'link' ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Link URL *</label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-2 block">File *</label>
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      accept={formData.type === 'pdf' ? '.pdf' : formData.type === 'video' ? 'video/*' : '*'}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                )}
                {uploading && (
                  <div>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadMaterial} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Material'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Materials List */}
      <div className="grid gap-4">
        {materials.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">No Materials Yet</h3>
              <p className="text-muted-foreground">
                {isInstructor 
                  ? 'Upload your first course material to share with students'
                  : 'Check back later for course materials and resources'}
              </p>
            </div>
          </Card>
        ) : (
          materials.map((material) => (
            <Card key={material.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-accent/50">
                  {getFileIcon(material.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{material.title}</h3>
                  {material.description && (
                    <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </span>
                    {material.fileSize && material.fileSize > 0 && (
                      <span>{formatFileSize(material.fileSize)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(material)}
                  >
                    <Download size={16} className="mr-1" />
                    {material.type === 'link' ? 'Open' : 'Download'}
                  </Button>
                  {isInstructor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

