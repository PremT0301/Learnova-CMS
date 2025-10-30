import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listenPendingFacultyRequests, approveFacultyRequest, rejectFacultyRequest, FacultyRequestDoc } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, User, Mail, Calendar } from 'lucide-react';

export default function FacultyAccountVerification() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FacultyRequestDoc[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsub = listenPendingFacultyRequests((list) => {
      setRequests(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const approve = async (req: FacultyRequestDoc) => {
    setProcessing(req.id);
    try {
      const result = await approveFacultyRequest(req);
      if (result.success) {
        toast({ 
          title: 'Faculty Approved', 
          description: `${req.email} has been approved and can now access faculty features.`,
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Approval Failed', 
          description: result.error || 'Failed to approve faculty request',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error approving faculty request:', error);
      toast({ 
        title: 'Approval Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (req: FacultyRequestDoc) => {
    setProcessing(req.id);
    try {
      const result = await rejectFacultyRequest(req);
      if (result.success) {
        toast({ 
          title: 'Request Rejected', 
          description: `${req.email} has been rejected and will remain as a student.`,
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Rejection Failed', 
          description: result.error || 'Failed to reject faculty request',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error rejecting faculty request:', error);
      toast({ 
        title: 'Rejection Failed', 
        description: 'An unexpected error occurred',
        variant: 'destructive' 
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Faculty Account Verification</h1>
          <p className="text-muted-foreground">Review and approve faculty access requests in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={loading ? "secondary" : "default"} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            {loading ? 'Loading...' : 'Live Updates'}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <Clock className="text-warning" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold">{requests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <User className="text-primary" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{requests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="card-academic p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-success" size={24} />
            <div>
              <p className="text-sm text-muted-foreground">Ready to Review</p>
              <p className="text-2xl font-bold">{requests.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="card-academic p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Pending Faculty Requests</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve faculty access requests. Changes are applied in real-time.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 font-medium">Applicant</th>
                <th className="text-left px-6 py-4 font-medium">Email</th>
                <th className="text-left px-6 py-4 font-medium">Requested</th>
                <th className="text-left px-6 py-4 font-medium">Status</th>
                <th className="text-left px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="text-muted-foreground" size={48} />
                      <p className="text-lg font-medium">No pending requests</p>
                      <p className="text-sm">All faculty requests have been processed</p>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p>Loading requests...</p>
                    </div>
                  </td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="text-primary" size={20} />
                      </div>
                      <div>
                        <p className="font-medium">{r.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">Faculty Applicant</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="text-muted-foreground" size={16} />
                      <span className="font-mono text-sm">{r.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground" size={16} />
                      <span className="text-sm">
                        {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Clock size={12} />
                      Pending
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => approve(r)}
                        disabled={processing === r.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === r.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => reject(r)}
                        disabled={processing === r.id}
                      >
                        {processing === r.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <XCircle size={16} />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


