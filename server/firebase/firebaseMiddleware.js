const jwt = require('jsonwebtoken');

require('dotenv').config();

const Secret_Key = process.env.SECRET_KEY;

exports.authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] ;

    if (!token) {
        return res.status(401).json({ message: 'No token provided. Please log in.' });
    }

    try {
        // Verify the custom JWT token you issued
        const decodedToken = jwt.verify(token, Secret_Key); 
        
        // Attach the decoded user data to the request object
        req.user = decodedToken;
        
        next();  
    } catch (error) {
        console.error('Authentication error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};
