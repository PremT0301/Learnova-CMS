import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'faculty' | 'student' | 'admin';
  recipientId: string;
  recipientName: string;
  recipientRole: 'faculty' | 'student' | 'admin';
  subject: string;
  content: string;
  type: 'message' | 'announcement' | 'assignment_reminder' | 'grade_notification' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  courseId?: string;
  assignmentId?: string;
  isRead: boolean;
  readAt?: Timestamp;
  attachments?: MessageAttachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage?: Message;
  lastMessageAt?: Timestamp;
  unreadCount: number;
  courseId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'assignment' | 'grade' | 'announcement' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: Timestamp;
  createdAt: Timestamp;
}

export interface BroadcastMessage {
  id: string;
  senderId: string;
  senderName: string;
  title: string;
  content: string;
  recipientType: 'all_students' | 'all_faculty' | 'course_students' | 'specific_users';
  courseId?: string;
  userIds?: string[];
  isScheduled: boolean;
  scheduledAt?: Timestamp;
  sentAt?: Timestamp;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: Timestamp;
}

class CommunicationService {
  // Message Management
  async sendMessage(messageData: Partial<Message>): Promise<Message> {
    try {
      const message: Partial<Message> = {
        ...messageData,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const messageRef = await addDoc(collection(db, 'messages'), message);
      const createdMessage = { id: messageRef.id, ...message } as Message;

      // Create notification for recipient
      await this.createNotification({
        userId: message.recipientId!,
        type: 'message',
        title: 'New Message',
        message: `You have a new message from ${message.senderName}`,
        data: { messageId: messageRef.id }
      });

      return createdMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(userId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(messagesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getSentMessages(userId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(messagesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Conversation Management
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );
      const snapshot = await getDocs(conversationsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(messagesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }

  // Broadcast Messages
  async createBroadcast(broadcastData: Partial<BroadcastMessage>): Promise<BroadcastMessage> {
    try {
      const broadcast: Partial<BroadcastMessage> = {
        ...broadcastData,
        status: 'draft',
        createdAt: serverTimestamp()
      };

      const broadcastRef = await addDoc(collection(db, 'broadcasts'), broadcast);
      return { id: broadcastRef.id, ...broadcast } as BroadcastMessage;
    } catch (error) {
      console.error('Error creating broadcast:', error);
      throw error;
    }
  }

  async sendBroadcast(broadcastId: string): Promise<void> {
    try {
      const broadcastRef = doc(db, 'broadcasts', broadcastId);
      const broadcastDoc = await getDoc(broadcastRef);
      
      if (!broadcastDoc.exists()) {
        throw new Error('Broadcast not found');
      }

      const broadcast = broadcastDoc.data() as BroadcastMessage;
      
      // Get recipients based on type
      let recipientIds: string[] = [];
      
      switch (broadcast.recipientType) {
        case 'all_students':
          recipientIds = await this.getAllStudentIds();
          break;
        case 'all_faculty':
          recipientIds = await this.getAllFacultyIds();
          break;
        case 'course_students':
          if (broadcast.courseId) {
            recipientIds = await this.getCourseStudentIds(broadcast.courseId);
          }
          break;
        case 'specific_users':
          recipientIds = broadcast.userIds || [];
          break;
      }

      // Send messages to all recipients
      for (const recipientId of recipientIds) {
        await this.sendMessage({
          senderId: broadcast.senderId,
          senderName: broadcast.senderName,
          senderRole: 'faculty',
          recipientId,
          recipientName: '', // Will be filled by recipient lookup
          recipientRole: 'student', // Default, should be determined
          subject: broadcast.title,
          content: broadcast.content,
          type: 'announcement',
          priority: 'normal'
        });
      }

      // Update broadcast status
      await updateDoc(broadcastRef, {
        status: 'sent',
        sentAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      throw error;
    }
  }

  async getBroadcasts(senderId: string): Promise<BroadcastMessage[]> {
    try {
      const broadcastsQuery = query(
        collection(db, 'broadcasts'),
        where('senderId', '==', senderId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(broadcastsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BroadcastMessage[];
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      throw error;
    }
  }

  // Notifications
  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    try {
      const notification: Partial<Notification> = {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp()
      };

      const notificationRef = await addDoc(collection(db, 'notifications'), notification);
      return { id: notificationRef.id, ...notification } as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(notificationsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(notificationsQuery);
      
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          isRead: true,
          readAt: serverTimestamp()
        })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToMessages(userId: string, callback: (messages: Message[]) => void): () => void {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      callback(messages);
    });
  }

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      callback(notifications);
    });
  }

  // Helper methods
  private async getAllStudentIds(): Promise<string[]> {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error fetching student IDs:', error);
      return [];
    }
  }

  private async getAllFacultyIds(): Promise<string[]> {
    try {
      const facultyQuery = query(
        collection(db, 'users'),
        where('role', '==', 'faculty')
      );
      const snapshot = await getDocs(facultyQuery);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error fetching faculty IDs:', error);
      return [];
    }
  }

  private async getCourseStudentIds(courseId: string): Promise<string[]> {
    try {
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        where('courseId', '==', courseId)
      );
      const snapshot = await getDocs(enrollmentsQuery);
      return snapshot.docs.map(doc => doc.data().studentId);
    } catch (error) {
      console.error('Error fetching course student IDs:', error);
      return [];
    }
  }
}

export const communicationService = new CommunicationService();
