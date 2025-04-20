const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { validateUserData } = require('../firebaseModel/userModel');
const { createUserVerification, getUserVerificationByUserId } = require('../firebaseModel/userVerification');
const { addUser, db } = require('../config');  
const crypto = require('crypto');
const path = require('path');

require('dotenv').config();

const Secret_Key = process.env.SECRET_KEY;
const Auth_email = process.env.AUTH_EMAIL || 'taskzenreset@gmail.com';
const Auth_Password = process.env.AUTH_PASSWORD || 'rhjlcwveeeaktiry';
const BASE_URL = 'http://172.20.10.3:3000';

// NODEMAILER TRANSPORTER
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: Auth_email,
        pass: Auth_Password,
    },
});

// Helper to send verification email
const sendVerificationEmail = async ({ userId, email }) => {
    try {
        const uniqueString = `${uuidv4()}${userId}`;
        const hashedUniqueString = await bcrypt.hash(uniqueString, 10);

        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); 
        await createUserVerification(userId, hashedUniqueString, expiresAt);

        const verificationUrl = `${BASE_URL}/api/auth/verify/${userId}/${uniqueString}`;
        const mailOptions = {
            from: Auth_email,
            to: email,
            subject: 'Verify Your Email',
            html: `
                <p>Verify your email address to complete the signup process.</p>
                <p>This link <b>expires in 6 hours</b>.</p>
                <a href="${verificationUrl}">Click here to verify your email</a>
            `,
        };

        await transporter.sendMail(mailOptions);
        return { status: 'PENDING', message: 'Verification email sent!' };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Failed to send verification email.');
    }
};

// VERIFY EMAIL ROUTE
exports.verifyEmail = async (req, res) => {
    const { userId, uniqueString } = req.params;

    try {
        const verificationRecord = await getUserVerificationByUserId(userId);

        if (!verificationRecord || verificationRecord.expiresAt.toDate() < new Date()) {
            await db.collection('Users').doc(userId).delete();
            return res.redirect(`/user/verified?error=true&message=Link expired or invalid.`);
        }

        const isValid = await bcrypt.compare(uniqueString, verificationRecord.uniqueString);
        if (!isValid) {
            return res.redirect(`/user/verified?error=true&message=Invalid verification details.`);
        }

        await db.collection('Users').doc(userId).update({ verified: true });
        await db.collection('userVerifications').doc(userId).delete();

        res.sendFile(path.join(__dirname, '../views/verified.html'));
    } catch (error) {
        console.error(error);
        res.redirect(`/user/verified?error=true&message=Verification failed. Please try again.`);
    }
};

// SIGNUP
exports.signup = async (req, res) => {
    console.log('[DEBUG] Signup controller invoked with data:', req.body);
    try {
        const userData = req.body;

        // Validate user data before proceeding
        validateUserData(userData);

        // Check if the user already exists
        const usersRef = db.collection('Users');
        const userSnapshot = await usersRef.where('email', '==', userData.email).get();

        if (!userSnapshot.empty) {
            return res.status(400).json({ message: 'User already exists!' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        userData.password = hashedPassword;

        // Set default verified value if not provided
        userData.verified = userData.verified ?? false;

        // Use the addUser function from config.js to add the user to Firestore
        const userDoc = await addUser(userData);  

        // Send verification email to the user
        await sendVerificationEmail({ userId: userDoc.id, email: userData.email });

        res.status(201).json({
            status: 'PENDING',
            message: 'Verification email sent!',
            user: {
                id: userDoc.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                verified: false,
            },
        });
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ message: 'Failed to register user.' });
    }
};

// LOGIN
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const usersRef = db.collection('Users');
        const userSnapshot = await usersRef.where('email', '==', email).get();

        if (userSnapshot.empty) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();

        if (!user.verified) {
            return res.status(401).json({
                status: 'FAILED',
                message: "Email hasn't been verified yet. Check your inbox.",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect email or password.' });
        }

        const token = jwt.sign({ id: userDoc.id }, Secret_Key, { expiresIn: '1d' });

        res.status(200).json({
            status: 'success',
            message: 'Logged in successfully.',
            token,
            user: {
                id: userDoc.id,
                ...user, 
            },
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Failed to login.' });
    }
};


// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Search for user in Firestore
        const usersRef = db.collection('Users');
        const userSnapshot = await usersRef.where('email', '==', email).get();

        if (userSnapshot.empty) {
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);
        const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

        // Update Firestore with reset token and expiry
        await usersRef.doc(userId).update({
            resetToken: hashedToken,
            resetTokenExpiry,
        });

        // Send reset email
        const resetURL = `${BASE_URL || `${req.protocol}://${req.get('host')}`}/api/auth/reset-password/${resetToken}`;
        await transporter.sendMail({
            from: Auth_email,
            to: email,
            subject: 'Password Reset',
            html: `
                <p>Hi,</p>
                <p>We received a request to reset your password.</p>
                <p>Click the link below to reset your password:</p>
                <a href="${resetURL}">Reset Password</a>
                <p>This link expires in 10 minutes.</p>
            `,
        });

        res.status(200).json({ message: 'Password reset link has been sent to your email.' });
    } catch (error) {
        console.error('Error in forgotPassword:', error.message);
        res.status(500).json({ message: 'Error sending reset email. Please try again.' });
    }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Both newPassword and confirmPassword are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    try {
        // Search for user with a valid resetTokenExpiry
        const usersRef = db.collection('Users');
        const userSnapshot = await usersRef
            .where('resetTokenExpiry', '>', Date.now())  // Only one inequality filter now
            .get();

        if (userSnapshot.empty) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Validate the reset token
        const isTokenValid = await bcrypt.compare(token, userData.resetToken);
        if (!isTokenValid) {
            return res.status(400).json({ message: 'Invalid reset token.' });
        }

        // Extra debug logging
        console.log('newPassword received:', newPassword);

        // Update the password and clear reset token fields
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await usersRef.doc(userId).update({
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        });

        // Serve the success page
        res.status(200).sendFile(path.join(__dirname, '../views/reset-success.html'));
    } catch (error) {
        console.error('Error in resetPassword:', error.message);
        res.status(500).json({ message: 'Error resetting password. Please try again.' });
    }
};
