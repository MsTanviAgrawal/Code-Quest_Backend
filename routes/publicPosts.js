import express from 'express';
import auth from '../middleware/auth.js';
import mediaUpload from '../middleware/mediaUpload.js';
import { createPublicPost, getFeed, getPostStatus, likeToggle, addComment, sharePost, deletePublicPost } from '../controller/publicPosts.js';

const router = express.Router();

// Create a public post (image/video optional)
router.post('/', auth, mediaUpload.single('media'), createPublicPost);

// List feed (public)
router.get('/', getFeed);

// Posting status (limits & usage)
router.get('/status', auth, getPostStatus);

// Like/Unlike
router.patch('/:id/like', auth, likeToggle);

// Comment
router.post('/:id/comments', auth, addComment);

// Share (counter increment)
router.post('/:id/share', auth, sharePost);

// Delete own post
router.delete('/:id', auth, deletePublicPost);

export default router;
