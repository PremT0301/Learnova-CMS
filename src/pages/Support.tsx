import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/firebase';
import { addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'account' | 'billing' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general' as Ticket['category'],
    priority: 'medium' as Ticket['priority']
  });

  const loadTickets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const ticketsQuery = query(
        collection(db, 'support_tickets'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(ticketsQuery);
      const ticketsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      setTickets(ticketsList);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({ title: 'Error', description: 'Failed to load support tickets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: 'Validation Error', description: 'Title and description are required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const ticketData = {
        ...formData,
        userId: user.id,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: []
      };

      await addDoc(collection(db, 'support_tickets'), ticketData);
      
      toast({ title: 'Success', description: 'Support ticket submitted successfully' });
      setFormData({ title: '', description: '', category: 'general', priority: 'medium' });
      setShowForm(false);
      await loadTickets();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast({ title: 'Error', description: 'Failed to submit support ticket', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResponseSubmit = async () => {
    if (!selectedTicket || !newResponse.trim() || !user) return;

    try {
      const response = {
        message: newResponse,
        author: user.name || user.email || 'User',
        authorRole: 'user' as const,
        timestamp: new Date().toISOString()
      };

      const updatedResponses = [...(selectedTicket.responses || []), response];
      
      // Update the ticket with new response
      await addDoc(collection(db, 'support_tickets'), {
        ...selectedTicket,
        responses: updatedResponses,
        updatedAt: new Date().toISOString()
      });

      setNewResponse('');
      toast({ title: 'Success', description: 'Response added successfully' });
      await loadTickets();
      
      // Update selected ticket
      const updatedTicket = { ...selectedTicket, responses: updatedResponses };
      setSelectedTicket(updatedTicket);
    } catch (error) {
      console.error('Error adding response:', error);
      toast({ title: 'Error', description: 'Failed to add response', variant: 'destructive' });
    }
  };

  React.useEffect(() => {
    loadTickets();
  }, [user]);

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="text-yellow-500" size={16} />;
      case 'in_progress':
        return <Clock className="text-blue-500" size={16} />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="text-green-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Support Center</h1>
          <p className="text-muted-foreground">Get help with your account and technical issues.</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <MessageSquare size={16} className="mr-2" />
          New Ticket
        </Button>
      </div>

      {showForm && (
        <Card className="card-academic p-6">
          <h2 className="text-xl font-semibold mb-4">Submit Support Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="input-academic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as Ticket['category'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="account">Account Problem</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="general">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Ticket['priority'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                className="input-academic"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send size={16} />
                    Submit Ticket
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-academic p-6">
          <h2 className="text-xl font-semibold mb-4">Your Support Tickets</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No support tickets yet.</p>
              <p className="text-sm text-muted-foreground">Click "New Ticket" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{ticket.title}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {selectedTicket && (
          <Card className="card-academic p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{selectedTicket.title}</h2>
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedTicket.status)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Original Issue:</p>
                <p>{selectedTicket.description}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Conversation:</h3>
                {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                  selectedTicket.responses.map((response, index) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      response.authorRole === 'admin' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{response.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(response.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{response.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No responses yet.</p>
                )}
              </div>

              {selectedTicket.status !== 'closed' && (
                <div className="space-y-3 pt-4 border-t">
                  <Label htmlFor="response">Add Response:</Label>
                  <Textarea
                    id="response"
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Add additional information or ask a question..."
                    rows={3}
                    className="input-academic"
                  />
                  <Button
                    onClick={handleResponseSubmit}
                    disabled={!newResponse.trim()}
                    className="btn-primary"
                  >
                    <Send size={16} className="mr-2" />
                    Send Response
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
