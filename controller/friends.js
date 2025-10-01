import FriendRequest from '../models/FriendRequest.js';
import User from '../models/auth.js';

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const fromUserId = req.userid;
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: 'Recipient user ID required' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if users exist
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId)
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    if (fromUser.friends.includes(toUserId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: toUserId },
        { from: toUserId, to: fromUserId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Friend request already sent' });
      }
      // Update existing rejected request
      existingRequest.from = fromUserId;
      existingRequest.to = toUserId;
      existingRequest.status = 'pending';
      existingRequest.createdAt = new Date();
      await existingRequest.save();
      return res.status(200).json({ 
        message: 'Friend request sent', 
        request: existingRequest 
      });
    }

    // Create new request
    const request = await FriendRequest.create({
      from: fromUserId,
      to: toUserId
    });

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate('from', 'name email')
      .populate('to', 'name email');

    console.log(`📤 Friend request sent: ${fromUser.name} → ${toUser.name}`);
    
    return res.status(201).json({ 
      message: 'Friend request sent', 
      request: populatedRequest 
    });
  } catch (error) {
    console.error('sendFriendRequest error:', error);
    return res.status(500).json({ message: 'Failed to send friend request' });
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.userid;
    
    const requests = await FriendRequest.find({
      to: userId,
      status: 'pending'
    })
      .populate('from', 'name email about')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests, count: requests.length });
  } catch (error) {
    console.error('getPendingRequests error:', error);
    return res.status(500).json({ message: 'Failed to get requests' });
  }
};

// Get sent friend requests
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.userid;
    
    const requests = await FriendRequest.find({
      from: userId,
      status: 'pending'
    })
      .populate('to', 'name email about')
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    console.error('getSentRequests error:', error);
    return res.status(500).json({ message: 'Failed to get sent requests' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.userid;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (String(request.to) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    // Add to friends list (both users)
    await Promise.all([
      User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } }),
      User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } })
    ]);

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate('from', 'name email')
      .populate('to', 'name email');

    console.log(`✅ Friend request accepted: ${populatedRequest.to.name} accepted ${populatedRequest.from.name}`);

    return res.status(200).json({ 
      message: 'Friend request accepted', 
      request: populatedRequest 
    });
  } catch (error) {
    console.error('acceptFriendRequest error:', error);
    return res.status(500).json({ message: 'Failed to accept request' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.userid;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (String(request.to) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();

    console.log(`❌ Friend request rejected`);

    return res.status(200).json({ 
      message: 'Friend request rejected' 
    });
  } catch (error) {
    console.error('rejectFriendRequest error:', error);
    return res.status(500).json({ message: 'Failed to reject request' });
  }
};

// Cancel sent friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.userid;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (String(request.from) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    console.log(`🔙 Friend request cancelled`);

    return res.status(200).json({ 
      message: 'Friend request cancelled' 
    });
  } catch (error) {
    console.error('cancelFriendRequest error:', error);
    return res.status(500).json({ message: 'Failed to cancel request' });
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.params.userId || req.userid;
    
    const user = await User.findById(userId).populate('friends', 'name email about tags joinedon');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      friends: user.friends, 
      count: user.friends.length 
    });
  } catch (error) {
    console.error('getFriends error:', error);
    return res.status(500).json({ message: 'Failed to get friends' });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const userId = req.userid;
    const { friendId } = req.params;

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: userId } })
    ]);

    console.log(`👋 Friend removed`);

    return res.status(200).json({ message: 'Friend removed' });
  } catch (error) {
    console.error('removeFriend error:', error);
    return res.status(500).json({ message: 'Failed to remove friend' });
  }
};

// Check friendship status
export const checkFriendshipStatus = async (req, res) => {
  try {
    const userId = req.userid;
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(200).json({ status: 'self' });
    }

    const user = await User.findById(userId);
    
    if (user.friends.includes(targetUserId)) {
      return res.status(200).json({ status: 'friends' });
    }

    const request = await FriendRequest.findOne({
      $or: [
        { from: userId, to: targetUserId, status: 'pending' },
        { from: targetUserId, to: userId, status: 'pending' }
      ]
    });

    if (request) {
      if (String(request.from) === String(userId)) {
        return res.status(200).json({ status: 'request_sent', requestId: request._id });
      } else {
        return res.status(200).json({ status: 'request_received', requestId: request._id });
      }
    }

    return res.status(200).json({ status: 'not_friends' });
  } catch (error) {
    console.error('checkFriendshipStatus error:', error);
    return res.status(500).json({ message: 'Failed to check status' });
  }
};
