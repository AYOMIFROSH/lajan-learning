const { db } = require('../config');

// Get All Topics
exports.getAllTopics = async (req, res) => {
    try {
        const topicsSnapshot = await db.collection('Topics').get();
        
        if (topicsSnapshot.empty) {
            return res.status(200).json({
                status: 'success',
                topics: []
            });
        }
        
        const topics = [];
        
        topicsSnapshot.forEach(doc => {
            const topicData = doc.data();
            topics.push({
                id: doc.id,
                title: topicData.title,
                description: topicData.description,
                image: topicData.image,
                difficulty: topicData.difficulty,
                moduleCount: topicData.moduleCount || 0
            });
        });
        
        res.status(200).json({
            status: 'success',
            topics
        });
    } catch (error) {
        console.error('Error getting topics:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get topics' 
        });
    }
};

// Get Topic Details
exports.getTopicDetails = async (req, res) => {
    try {
        const { topicId } = req.params;
        
        const topicDoc = await db.collection('Topics').doc(topicId).get();
        
        if (!topicDoc.exists) {
            return res.status(404).json({
                status: 'error',
                message: 'Topic not found'
            });
        }
        
        const topicData = topicDoc.data();
        
        // Get modules for this topic
        const modulesSnapshot = await db.collection('Modules')
            .where('topicId', '==', topicId)
            .orderBy('order', 'asc')
            .get();
            
        const modules = [];
        
        modulesSnapshot.forEach(doc => {
            const moduleData = doc.data();
            modules.push({
                id: doc.id,
                title: moduleData.title,
                description: moduleData.description,
                order: moduleData.order,
                lessonCount: moduleData.lessonCount || 0
            });
        });
        
        const topic = {
            id: topicDoc.id,
            title: topicData.title,
            description: topicData.description,
            image: topicData.image,
            difficulty: topicData.difficulty,
            modules
        };
        
        res.status(200).json({
            status: 'success',
            topic
        });
    } catch (error) {
        console.error('Error getting topic details:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get topic details' 
        });
    }
};

// Get Module Details
exports.getModuleDetails = async (req, res) => {
    try {
        const { moduleId } = req.params;
        
        const moduleDoc = await db.collection('Modules').doc(moduleId).get();
        
        if (!moduleDoc.exists) {
            return res.status(404).json({
                status: 'error',
                message: 'Module not found'
            });
        }
        
        const moduleData = moduleDoc.data();
        
        // Get lessons for this module
        const lessonsSnapshot = await db.collection('Lessons')
            .where('moduleId', '==', moduleId)
            .orderBy('order', 'asc')
            .get();
            
        const lessons = [];
        
        lessonsSnapshot.forEach(doc => {
            const lessonData = doc.data();
            lessons.push({
                id: doc.id,
                title: lessonData.title,
                description: lessonData.description,
                order: lessonData.order,
                type: lessonData.type,
                duration: lessonData.duration || 0
            });
        });
        
        const module = {
            id: moduleDoc.id,
            topicId: moduleData.topicId,
            title: moduleData.title,
            description: moduleData.description,
            order: moduleData.order,
            lessons
        };
        
        res.status(200).json({
            status: 'success',
            module
        });
    } catch (error) {
        console.error('Error getting module details:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get module details' 
        });
    }
};

// Get Lesson Content
exports.getLessonContent = async (req, res) => {
    try {
        const { lessonId } = req.params;
        
        const lessonDoc = await db.collection('Lessons').doc(lessonId).get();
        
        if (!lessonDoc.exists) {
            return res.status(404).json({
                status: 'error',
                message: 'Lesson not found'
            });
        }
        
        const lessonData = lessonDoc.data();
        
        // If it's a quiz, get the questions
        let questions = [];
        if (lessonData.type === 'quiz') {
            const questionsSnapshot = await db.collection('Questions')
                .where('lessonId', '==', lessonId)
                .get();
                
            questionsSnapshot.forEach(doc => {
                const questionData = doc.data();
                questions.push({
                    id: doc.id,
                    text: questionData.text,
                    options: questionData.options || []
                });
            });
        }
        
        const lesson = {
            id: lessonDoc.id,
            title: lessonData.title,
            description: lessonData.description,
            content: lessonData.content,
            type: lessonData.type,
            videoUrl: lessonData.videoUrl,
            duration: lessonData.duration || 0,
            questions
        };
        
        res.status(200).json({
            status: 'success',
            lesson
        });
    } catch (error) {
        console.error('Error getting lesson content:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get lesson content' 
        });
    }
};

// Get User-Specific Content Recommendations
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get the user's learning profile
        const userDoc = await db.collection('Users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        const userData = userDoc.data();
        const preferredTopics = userData.preferredTopics || [];
        const learningStyle = userData.learningStyle || 'visual';
        const knowledgeLevel = userData.knowledgeLevel || 1;
        
        // Get the user's learning progress
        const progressDoc = await db.collection('LearningProgress').doc(userId).get();
        const progressData = progressDoc.exists ? progressDoc.data() : { topicsProgress: {} };
        
        // Find topics matching user's preferences and knowledge level
        let topicsQuery = db.collection('Topics');
        
        // If user has preferred topics, filter by them
        if (preferredTopics.length > 0) {
            // Firestore doesn't support direct array contains any with variable array
            // so we need to use a different approach
            topicsQuery = topicsQuery.where('tags', 'array-contains-any', preferredTopics.slice(0, 10)); // Firestore limits to 10 values
        }
        
        // Filter by difficulty level appropriate to user's knowledge
        topicsQuery = topicsQuery.where('difficulty', '<=', knowledgeLevel + 2); // Allow slightly more advanced topics
        
        const topicsSnapshot = await topicsQuery.limit(5).get();
        
        const recommendations = [];
        
        for (const doc of topicsSnapshot.docs) {
            const topicData = doc.data();
            const topicId = doc.id;
            
            // Check if user has started this topic
            const topicProgress = progressData.topicsProgress[topicId] || { completed: false };
            
            // Skip completed topics
            if (topicProgress.completed) {
                continue;
            }
            
            // Get a suitable module
            const modulesSnapshot = await db.collection('Modules')
                .where('topicId', '==', topicId)
                .orderBy('order', 'asc')
                .limit(1)
                .get();
                
            if (!modulesSnapshot.empty) {
                const moduleDoc = modulesSnapshot.docs[0];
                const moduleData = moduleDoc.data();
                
                // Get a lesson appropriate for the user's learning style
                let lessonsQuery = db.collection('Lessons')
                    .where('moduleId', '==', moduleDoc.id);
                    
                // Filter by learning style if possible
                if (learningStyle === 'visual') {
                    lessonsQuery = lessonsQuery.where('type', 'in', ['video', 'interactive']);
                } else if (learningStyle === 'practical') {
                    lessonsQuery = lessonsQuery.where('type', 'in', ['exercise', 'quiz']);
                }
                
                const lessonsSnapshot = await lessonsQuery.limit(1).get();
                
                if (!lessonsSnapshot.empty) {
                    const lessonDoc = lessonsSnapshot.docs[0];
                    const lessonData = lessonDoc.data();
                    
                    recommendations.push({
                        topic: {
                            id: topicId,
                            title: topicData.title,
                            image: topicData.image,
                            difficulty: topicData.difficulty
                        },
                        module: {
                            id: moduleDoc.id,
                            title: moduleData.title
                        },
                        lesson: {
                            id: lessonDoc.id,
                            title: lessonData.title,
                            type: lessonData.type
                        }
                    });
                }
            }
            
            // Limit to 3 recommendations
            if (recommendations.length >= 3) {
                break;
            }
        }
        
        res.status(200).json({
            status: 'success',
            recommendations
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ 
            status: 'error',
            message: error.message || 'Failed to get recommendations' 
        });
    }
};