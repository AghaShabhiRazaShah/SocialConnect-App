const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const db = require('./db');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'my_super_secret_key_123'; 

// ==========================================
// MULTER CONFIGURATION
// ==========================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) cb(null, true);
        else cb(new Error('Only images allowed!'));
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// TOKEN VERIFY MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: 'Access Denied. No Token Provided!' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user; 
        next();
    });
};

// Test Route
app.get('/', (req, res) => {
    res.send('SocialConnect Backend is running successfully! 🚀');
});

// REGISTER API
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) return res.status(400).json({ message: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// LOGIN API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid email or password' });
        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });
        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful!', token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ ✅ ✅ SEARCH USERS API - AB YE PEHLE AAYEGI (Sahi Order) ✅ ✅ ✅
app.get('/api/users/search', authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query || query.trim() === '') {
            return res.json([]);
        }

        const [users] = await db.query(
            "SELECT id, username, profile_pic FROM users WHERE username LIKE ? AND id != ? LIMIT 5", 
            [`%${query}%`, req.user.userId]
        );

        res.json(users);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET USER PROFILE API - Ab ye BAAD mein aayegi
app.get('/api/users/:id', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, email, bio, profile_pic, cover_pic, created_at FROM users WHERE id = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET USER POSTS API
app.get('/api/users/:id/posts', async (req, res) => {
    try {
        const userId = req.params.id;
        const [posts] = await db.query(`
            SELECT p.*, u.username, u.profile_pic,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ? ORDER BY p.created_at DESC
        `, [userId, userId]);
        res.json(posts);
    } catch (error) {
        console.error('Get User Posts Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// CREATE POST API
app.post('/api/posts', authenticateToken, upload.single('postImage'), async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.userId;
        let imageUrl = '';
        if (req.file) {
            imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        const [result] = await db.query('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)', [userId, content, imageUrl]);
        res.status(201).json({ message: 'Post created successfully!', postId: result.insertId });
    } catch (error) {
        console.error('Create Post Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET FEED API
app.get('/api/feed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`🔍 Feed request from User ID: ${userId}`);

        const [following] = await db.query(
            'SELECT following_id FROM follows WHERE follower_id = ?',
            [userId]
        );

        const followingIds = following.map(f => f.following_id);
        const idsToFetch = [...followingIds, userId];

        console.log(`📋 Fetching posts for IDs:`, idsToFetch);

        const [posts] = await db.query(`
            SELECT p.*, u.username, u.profile_pic,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id IN (?)
            ORDER BY p.created_at DESC
        `, [userId, idsToFetch]);

        console.log(`✅ Found ${posts.length} posts`);
        res.json(posts);

    } catch (error) {
        console.error('❌ Get Feed Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET FOLLOW STATUS API
app.get('/api/users/:id/follow-status', authenticateToken, async (req, res) => {
    try {
        const [follows] = await db.query('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.userId, req.params.id]);
        const [followers] = await db.query('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [req.params.id]);
        const [following] = await db.query('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [req.params.id]);
        res.json({ isFollowing: follows.length > 0, followerCount: followers[0].count, followingCount: following[0].count });
    } catch (error) {
        console.error('Get Follow Status Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// FOLLOW USER API
app.post('/api/follow/:userId', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId === parseInt(req.params.userId)) return res.status(400).json({ message: "Aap khud ko follow nahi kar sakte!" });
        const [existing] = await db.query('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.userId, req.params.userId]);
        if (existing.length > 0) return res.status(400).json({ message: "Already following" });
        await db.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.user.userId, req.params.userId]);
        res.json({ message: "Followed successfully!" });
    } catch (error) {
        console.error('Follow Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UNFOLLOW USER API
app.delete('/api/follow/:userId', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.userId, req.params.userId]);
        res.json({ message: "Unfollowed successfully!" });
    } catch (error) {
        console.error('Unfollow Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// LIKE / UNLIKE POST API
app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
    try {
        const [existingLike] = await db.query('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [req.user.userId, req.params.postId]);
        if (existingLike.length > 0) {
            await db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.userId, req.params.postId]);
            return res.json({ message: 'Unliked successfully', liked: false });
        } else {
            await db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.userId, req.params.postId]);
            return res.json({ message: 'Liked successfully', liked: true });
        }
    } catch (error) {
        console.error('Like Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET COMMENTS API
app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
        const [comments] = await db.query(`
            SELECT c.*, u.username, u.profile_pic 
            FROM comments c JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? ORDER BY c.created_at ASC
        `, [req.params.postId]);
        res.json(comments);
    } catch (error) {
        console.error('Get Comments Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// CREATE COMMENT API
app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || content.trim() === '') return res.status(400).json({ message: 'Comment cannot be empty' });
        const [result] = await db.query('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [req.params.postId, req.user.userId, content]);
        res.status(201).json({ message: 'Comment added!', commentId: result.insertId });
    } catch (error) {
        console.error('Create Comment Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE COMMENT API
app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const commentId = req.params.commentId;
        const userId = req.user.userId;
        const [comments] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        if (comments.length === 0) return res.status(404).json({ message: 'Comment not found' });
        if (comments[0].user_id !== userId) return res.status(403).json({ message: 'Aap sirf apna khud ka comment delete kar sakte hain!' });
        await db.query('DELETE FROM comments WHERE id = ?', [commentId]);
        res.json({ message: 'Comment deleted successfully!' });
    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE PROFILE API
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId != req.params.id) return res.status(403).json({ message: "Aap sirf apni profile edit kar sakte hain!" });
        const { bio } = req.body;
        await db.query('UPDATE users SET bio = ? WHERE id = ?', [bio, req.params.id]);
        res.json({ message: "Profile updated successfully!" });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPLOAD PROFILE PICTURE API
app.put('/api/users/:id/profile-pic', authenticateToken, upload.single('profilePic'), async (req, res) => {
    try {
        if (req.user.userId != req.params.id) return res.status(403).json({ message: "Aap sirf apni profile edit kar sakte hain!" });
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const profilePicUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profilePicUrl, req.params.id]);
        res.json({ message: 'Profile picture updated!', profile_pic: profilePicUrl });
    } catch (error) {
        console.error('Upload Profile Pic Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPLOAD COVER BANNER API
app.put('/api/users/:id/cover-pic', authenticateToken, upload.single('coverPic'), async (req, res) => {
    try {
        if (req.user.userId != req.params.id) return res.status(403).json({ message: "Aap sirf apni profile edit kar sakte hain!" });
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
        const coverPicUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        await db.query('UPDATE users SET cover_pic = ? WHERE id = ?', [coverPicUrl, req.params.id]);
        res.json({ message: 'Cover picture updated!', cover_pic: coverPicUrl });
    } catch (error) {
        console.error('Upload Cover Pic Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE POST API
app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.userId;

        const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
        
        if (posts.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (posts[0].user_id !== userId) {
            return res.status(403).json({ message: 'Aap sirf apni khud ki post delete kar sakte hain!' });
        }

        await db.query('DELETE FROM posts WHERE id = ?', [postId]);

        res.json({ message: 'Post deleted successfully!' });

    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================================
// SERVER START
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`✅ Connected to Database: ${process.env.DB_NAME}`);
});