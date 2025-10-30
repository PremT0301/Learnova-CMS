import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, functions } from '@/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  HardDrive,
  FileArchive
} from 'lucide-react';

type Backup = {
  id: string;
  timestamp: string;
  status: 'in_progress' | 'completed' | 'failed';
  userId: string;
  collections: string[];
  totalDocuments: number;
  size: number;
  error?: string;
  completedAt?: string;
};

export default function Backup() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'failed'>('all');

  const loadBackups = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'backups'), orderBy('timestamp', 'desc')));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Backup[];
      setBackups(list);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast({ title: 'Error', description: 'Failed to load backups', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const backupFunction = httpsCallable(functions, 'triggerBackup');
      const result = await backupFunction();
      toast({ title: 'Success', description: result.data.message });
      await loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({ title: 'Error', description: 'Failed to create backup', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    setRestoring(backupId);
    try {
      const restoreFunction = httpsCallable(functions, 'restoreBackup');
      const result = await restoreFunction({ backupId });
      toast({ title: 'Success', description: result.data.message });
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({ title: 'Error', description: 'Failed to restore backup', variant: 'destructive' });
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    setDeleting(backupId);
    try {
      const deleteFunction = httpsCallable(functions, 'deleteBackup');
      const result = await deleteFunction({ backupId });
      toast({ title: 'Success', description: result.data.message });
      await loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast({ title: 'Error', description: 'Failed to delete backup', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const filteredBackups = backups.filter(backup => 
    statusFilter === 'all' || backup.status === statusFilter
  );

  const getStatusIcon = (status: Backup['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'in_progress':
        return <Clock className="text-blue-500 animate-spin" size={16} />;
      case 'failed':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: Backup['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);
  const completedBackups = backups.filter(b => b.status === 'completed').length;
  const failedBackups = backups.filter(b => b.status === 'failed').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Backup Management</h1>
          <p className="text-muted-foreground">Create, manage, and restore system backups.</p>
        </div>
        <Button 
          onClick={createBackup}
          disabled={creating}
          className="btn-primary"
        >
          {creating ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="animate-spin" size={16} />
              Creating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Database size={16} />
              Create Backup
            </div>
          )}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <FileArchive className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Backups</p>
              <p className="text-2xl font-bold">{backups.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold">{completedBackups}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">{failedBackups}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <HardDrive className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Size</p>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-academic p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} />
            <span className="font-medium">Filters:</span>
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={loadBackups}
            disabled={loading}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Backup List */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Backup History</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading backups...</p>
          </div>
        ) : filteredBackups.length === 0 ? (
          <div className="text-center py-8">
            <Database size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No backups found.</p>
            <p className="text-sm text-muted-foreground">Create your first backup to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBackups.map((backup) => (
              <div key={backup.id} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <h3 className="font-medium">Backup {backup.id.split('_')[1]}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(backup.timestamp).toLocaleString()}
                        </span>
                        {backup.completedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} />
                            Completed: {new Date(backup.completedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(backup.status)}`}>
                      {backup.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Collections</p>
                    <p className="font-medium">{backup.collections?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                    <p className="font-medium">{backup.totalDocuments || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-medium">{formatFileSize(backup.size || 0)}</p>
                  </div>
                </div>

                {backup.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">
                      <strong>Error:</strong> {backup.error}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {backup.status === 'completed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                        disabled={restoring === backup.id}
                      >
                        {restoring === backup.id ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="animate-spin" size={14} />
                            Restoring...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Upload size={14} />
                            Restore
                          </div>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/backup/download/${backup.id}`, '_blank')}
                      >
                        <div className="flex items-center gap-2">
                          <Download size={14} />
                          Download
                        </div>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBackup(backup.id)}
                    disabled={deleting === backup.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {deleting === backup.id ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="animate-spin" size={14} />
                        Deleting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Trash2 size={14} />
                        Delete
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Backup Information */}
      <Card className="card-academic p-6">
        <h2 className="text-xl font-semibold mb-4">Backup Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">What gets backed up?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              The following collections are included in each backup:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Users - All user accounts and profiles</li>
              <li>Courses - Course information and metadata</li>
              <li>Departments - Department structure and assignments</li>
              <li>Announcements - System announcements</li>
              <li>Audit Logs - System activity logs</li>
              <li>Settings - System configuration</li>
              <li>Support Tickets - User support requests</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Backup Process</h3>
            <p className="text-sm text-muted-foreground">
              When you create a backup, the system will:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mt-2">
              <li>Create a backup record with "in_progress" status</li>
              <li>Export all documents from each collection</li>
              <li>Store the backup data securely</li>
              <li>Update the backup record with completion details</li>
              <li>Calculate backup size and document counts</li>
            </ol>
          </div>

          <div>
            <h3 className="font-medium mb-2">Important Notes</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Backups are stored in Firestore and count against your storage quota</li>
              <li>Large databases may take several minutes to backup</li>
              <li>Restoring a backup will overwrite existing data</li>
              <li>Always test restores in a development environment first</li>
              <li>Consider implementing automated backup schedules for production</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
