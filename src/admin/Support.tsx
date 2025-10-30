import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, functions } from '@/firebase';
import { collection, doc, getDocs, orderBy, query, updateDoc, addDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Calendar, Filter, Search } from 'lucide-react';

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'account' | 'billing' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: string;
  userEmail?: string;
  userName?: string;
  createdAt: string;
  updatedAt: string;
  responses?: Array<{
    message: string;
    author: string;
    authorRole: 'user' | 'admin';
    timestamp: string;
  }>;
};

export default function Support() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      
      // Get user details for each ticket
      const ticketsWithUsers = await Promise.all(
        list.map(async (ticket) => {
          try {
            const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', ticket.userId)));
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              return {
                ...ticket,
                userEmail: userData.email,
                userName: userData.name
              };
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
          return ticket;
        })
      );
      
      setTickets(ticketsWithUsers);
    } catch {
      toast({ title: 'Error', description: 'Failed to load support tickets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const searchMatch = !searchTerm || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && priorityMatch && searchMatch;
  });

  const reply = async (ticketId: string) => {
    const message = response[ticketId];
    if (!message?.trim()) {
      toast({ title: 'Validation', description: 'Response message is required', variant: 'destructive' });
      return;
    }
    
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const newResponse = {
        message,
        author: user?.name || user?.email || 'Admin',
        authorRole: 'admin' as const,
        timestamp: new Date().toISOString()
      };

      const updatedResponses = [...(ticket.responses || []), newResponse];
      
      await updateDoc(doc(db, 'support_tickets', ticketId), { 
        status: 'in_progress',
        responses: updatedResponses,
        updatedAt: new Date().toISOString()
      });

      // Send email notification to user
      try {
        const sendEmailFunction = httpsCallable(functions, 'sendAnnouncementEmail');
        await sendEmailFunction({
          title: `Response to your support ticket: ${ticket.title}`,
          message: `Your support ticket has received a response:\n\n"${message}"\n\nYou can view the full conversation in the support center.`,
          target: 'all',
          userIds: [ticket.userId]
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      toast({ title: 'Success', description: 'Response sent successfully' });
      setResponse({ ...response, [ticketId]: '' });
      await load();
      
      // Update selected ticket if it's the one being replied to
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...ticket, responses: updatedResponses });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send response', variant: 'destructive' });
    }
  };

  const updateStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast({ title: 'Success', description: 'Ticket status updated' });
      await load();
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update ticket status', variant: 'destructive' });
    }
  };

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="text-yellow-500" size={16} />;
      case 'in_progress':
        return <Clock className="text-blue-500" size={16} />;
      case 'resolved':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'closed':
        return <CheckCircle className="text-gray-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Support Management</h1>
        <p className="text-muted-foreground">Manage user support tickets and provide assistance.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
      <Card className="card-academic p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <h3 className="font-semibold">Filters</h3>
              </div>
              
              <div className="space-y-3">
                  <div>
                  <Label className="text-sm">Search</Label>
                  <div className="relative mt-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Status</Label>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Priority</Label>
                  <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="card-academic p-6">
            <h3 className="font-semibold mb-4">Ticket Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Tickets</span>
                <span className="font-medium">{tickets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Open</span>
                <span className="font-medium text-yellow-600">{tickets.filter(t => t.status === 'open').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <span className="font-medium text-blue-600">{tickets.filter(t => t.status === 'in_progress').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Resolved</span>
                <span className="font-medium text-green-600">{tickets.filter(t => t.status === 'resolved').length}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="card-academic p-6">
            <h2 className="text-xl font-semibold mb-4">Support Tickets</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No support tickets found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/20'
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium">{ticket.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            {ticket.userName || ticket.userEmail || 'Unknown User'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {selectedTicket && (
        <Card className="card-academic p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">{selectedTicket.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>By: {selectedTicket.userName || selectedTicket.userEmail || 'Unknown User'}</span>
                <span>Category: {selectedTicket.category}</span>
                <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedTicket.status} onValueChange={(value: any) => updateStatus(selectedTicket.id, value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-muted/20 rounded-lg">
              <h3 className="font-medium mb-2">Issue Description:</h3>
              <p className="text-sm">{selectedTicket.description}</p>
            </div>

            {selectedTicket.responses && selectedTicket.responses.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Conversation:</h3>
                {selectedTicket.responses.map((response, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    response.authorRole === 'admin' 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'bg-gray-50 border-gray-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {response.author} {response.authorRole === 'admin' && '(Admin)'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(response.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{response.message}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedTicket.status !== 'closed' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Admin Response:</h3>
                <Textarea
                  placeholder="Write your response to the user..."
                  value={response[selectedTicket.id] || ''}
                  onChange={(e) => setResponse({ ...response, [selectedTicket.id]: e.target.value })}
                  rows={4}
                  className="input-academic"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => reply(selectedTicket.id)}
                    disabled={!response[selectedTicket.id]?.trim()}
                    className="btn-primary"
                  >
                    Send Response
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(selectedTicket.id, 'resolved')}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
        )}
    </div>
  );
}