import express from 'express';
import auth from '../middleware/auth.js';
import {
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  removeFriend,
  checkFriendshipStatus
} from '../controller/friends.js';

const router = express.Router();

router.post('/request', auth, sendFriendRequest);

// Get pending requests (received)
router.get('/requests/pending', auth, getPendingRequests);

// Get sent requests
router.get('/requests/sent', auth, getSentRequests);

// Accept friend request
router.patch('/request/:requestId/accept', auth, acceptFriendRequest);

// Reject friend request
router.patch('/request/:requestId/reject', auth, rejectFriendRequest);

// Cancel sent request
router.delete('/request/:requestId/cancel', auth, cancelFriendRequest);

// TEMP: Add dummy friend for testing
router.post('/add-dummy-friend', auth, async (req, res) => {
  try {
    const userId = req.userid;
    const User = (await import('../models/auth.js')).default;
    
    // Add a dummy ObjectId as friend
    const dummyFriendId = '507f1f77bcf86cd799439011';
    
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { friends: dummyFriendId } }
    );
    
    const user = await User.findById(userId);
    console.log(`✅ Added dummy friend. Total friends: ${user.friends.length}`);
    
    res.status(200).json({ 
      message: 'Dummy friend added',
      friendCount: user.friends.length
    });
  } catch (err) {
    console.error('Error adding dummy friend:', err);
    res.status(500).json({ message: 'Failed to add friend' });
  }
});

// DEBUG: Check current user's friends
router.get('/debug-my-friends', auth, async (req, res) => {
  try {
    const userId = req.userid;
    const User = (await import('../models/auth.js')).default;
    
    const user = await User.findById(userId);
    
    console.log('🔍 DEBUG - User:', user.name);
    console.log('🔍 DEBUG - Friends array:', user.friends);
    console.log('🔍 DEBUG - Friends count:', user.friends ? user.friends.length : 0);
    
    res.status(200).json({
      userId: user._id,
      name: user.name,
      email: user.email,
      friends: user.friends,
      friendsCount: user.friends ? user.friends.length : 0
    });
  } catch (err) {
    console.error('Error in debug:', err);
    res.status(500).json({ message: 'Debug failed' });
  }
});

// Check friendship status (before generic routes)
router.get('/status/:targetUserId', auth, checkFriendshipStatus);

// Get friends list (specific routes first)
router.get('/list', auth, getFriends);
router.get('/list/:userId', auth, getFriends);

// Remove friend
router.delete('/:friendId', auth, removeFriend);
export default router;
