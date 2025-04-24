import { firebase, firestoreDB } from '@/firebase/config';
import { topics } from '@/mocks/topics';
import { Notification } from '@/types/content';

/**
 * Creates a notification in Firestore
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'lesson' | 'friend' | 'achievement' | 'offering' | 'guardian',
  referenceId: string = ''
): Promise<string> => {
  try {
    const notification: Omit<Notification, 'id'> = {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      referenceId
    };

    const docRef = await firestoreDB.collection('notifications').add(notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Creates a notification when a module is completed
 */
export const createModuleCompletionNotification = async (
  userId: string,
  topicId: string,
  moduleId: string,
  score: number
): Promise<string | null> => {
  try {
    // Find the topic and module
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return null;

    const module = topic.modules.find(m => m.id === moduleId);
    if (!module) return null;

    // Create module completion notification
    return await createNotification(
      userId,
      `Module Completed: ${module.title}`,
      `You've finished learning about ${module.title} with a score of ${Math.round(score * 100)}%. Keep up the good work!`,
      'lesson',
      moduleId
    );
  } catch (error) {
    console.error('Error creating module completion notification:', error);
    return null;
  }
};

/**
 * Creates a notification when a topic is completed
 */
export const createTopicCompletionNotification = async (
  userId: string,
  topicId: string
): Promise<string | null> => {
  try {
    // Find the topic
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return null;

    // Calculate total points earned from this topic
    const totalPoints = topic.modules.reduce((sum, module) => sum + module.points, 0);

    // Create topic completion notification
    return await createNotification(
      userId,
      `Topic Completed: ${topic.title}`,
      `Congratulations! You've completed all modules in the ${topic.title} topic and earned ${totalPoints} points.`,
      'achievement',
      topicId
    );
  } catch (error) {
    console.error('Error creating topic completion notification:', error);
    return null;
  }
};

/**
 * Creates a notification when user reaches a streak milestone
 */
export const createStreakMilestoneNotification = async (
  userId: string,
  streak: number
): Promise<string | null> => {
  try {
    // Only create notifications for notable streak milestones
    if (streak === 3 || streak === 7 || streak === 14 || 
        streak === 30 || streak === 60 || streak === 100 || 
        streak % 100 === 0) {
      
      let message = '';
      if (streak === 3) {
        message = "You've maintained your learning streak for 3 days. You're building a great habit!";
      } else if (streak === 7) {
        message = "One week streak! You've studied finance every day for a week. That's dedication!";
      } else if (streak === 14) {
        message = "Two weeks of consistent learning! Your financial knowledge is growing every day.";
      } else if (streak === 30) {
        message = "30 day streak! You've been learning for a month straight. Amazing commitment!";
      } else if (streak === 60) {
        message = "60 day streak! Two months of daily financial education. You're becoming an expert!";
      } else if (streak === 100) {
        message = "100 day streak! What an achievement! Your dedication to financial education is impressive.";
      } else {
        message = `${streak} day streak! Your commitment to financial education is truly remarkable.`;
      }
      
      return await createNotification(
        userId,
        `${streak} Day Streak!`,
        message,
        'achievement'
      );
    }
    
    return null;
  } catch (error) {
    console.error('Error creating streak milestone notification:', error);
    return null;
  }
};

/**
 * Creates a notification when user reaches a points milestone
 */
export const createPointsMilestoneNotification = async (
  userId: string,
  points: number
): Promise<string | null> => {
  try {
    // Define milestone points values
    const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
    
    // Find the highest milestone the user has reached
    let milestone: number | null = null;
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (points >= milestones[i]) {
        milestone = milestones[i];
        break;
      }
    }
    
    if (milestone) {
      // Check if notification for this milestone already exists to avoid duplicates
      const existingNotifs = await firestoreDB.collection('notifications')
        .where('userId', '==', userId)
        .where('type', '==', 'achievement')
        .where('title', '==', `Points Milestone: ${milestone}`)
        .get();
      
      if (existingNotifs.empty) {
        return await createNotification(
          userId,
          `Points Milestone: ${milestone}`,
          `Congratulations! You've earned over ${milestone} points in your learning journey! Keep expanding your financial knowledge.`,
          'achievement'
        );
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error creating points milestone notification:', error);
    return null;
  }
};