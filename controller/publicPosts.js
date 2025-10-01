import PublicPost from '../models/PublicPost.js';
import User from '../models/auth.js';

// Helper: get IST start/end of today
const getTodayRangeIST = () => {
  const now = new Date();
  // IST offset +5:30 hours
  const IST_OFFSET_MIN = 5 * 60 + 30;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istNow = new Date(utc + IST_OFFSET_MIN * 60000);

  const startIST = new Date(istNow);
  startIST.setHours(0, 0, 0, 0);

  const endIST = new Date(istNow);
  endIST.setHours(23, 59, 59, 999);

  // Convert back to UTC-based absolute times by reversing offset
  const startUTC = new Date(startIST.getTime() - IST_OFFSET_MIN * 60000);
  const endUTC = new Date(endIST.getTime() - IST_OFFSET_MIN * 60000);
  return { startUTC, endUTC };
};

const getFriendCount = (user) => {
  if (!user) return 0;
  if (!user.friends) return 0;
  if (Array.isArray(user.friends)) return user.friends.length;
  return 0;
};

const getDailyPostLimit = (friendCount) => {
  // Rules:
  // - 0 friends: cannot post
  // - 1 friend: 1 per day
  // - 2..10 friends: 2 per day
  // - >10 friends: unlimited
  if (friendCount <= 0) return 0;
  if (friendCount === 1) return 1;
  if (friendCount > 10) return Infinity;
  return 2;
};

export const createPublicPost = async (req, res) => {
  try {
    const userId = req.userid;
    console.log('📝 Create post request from user:', userId);
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userObj = user.toObject();
    
    // Ensure friends array exists
    if (!userObj.friends) {
      userObj.friends = [];
    }

    const friendCount = getFriendCount(userObj);
    const limit = getDailyPostLimit(friendCount);
    console.log(`👥 Friend count: ${friendCount}, Daily limit: ${limit}`);

    if (limit === 0) {
      return res.status(403).json({
        message: 'You need at least 1 friend to post on the public page',
        friendCount,
        dailyLimit: 0
      });
    }

    const { startUTC, endUTC } = getTodayRangeIST();
    const todayCount = await PublicPost.countDocuments({
      userId,
      createdAt: { $gte: startUTC, $lte: endUTC }
    });
    console.log(`📊 Posts today: ${todayCount}/${limit}`);

    if (limit !== Infinity && todayCount >= limit) {
      return res.status(403).json({
        message: `Daily post limit reached. With ${friendCount} friend(s), you can post up to ${limit} time(s) per day.`,
        friendCount,
        dailyLimit: limit,
        usedToday: todayCount
      });
    }

    const { caption } = req.body;
    let mediaUrl = null;
    let mediaType = 'none';

    if (req.file) {
      // Just use the filename with /uploads path
      const isImage = req.file.mimetype.startsWith('image/');
      const folder = isImage ? 'images' : 'videos';
      mediaUrl = `/uploads/public/${folder}/${req.file.filename}`;
      mediaType = isImage ? 'image' : 'video';
      
      console.log('📸 Media saved:', mediaUrl);
    }

    const post = await PublicPost.create({
      userId,
      caption: caption || '',
      mediaUrl,
      mediaType
    });

    console.log(`✅ Post created successfully! ID: ${post._id}`);
    
    return res.status(201).json({
      message: 'Post created',
      post,
      remainingToday: limit === Infinity ? 'Unlimited' : Math.max(0, limit - (todayCount + 1))
    });
  } catch (err) {
    console.error('createPublicPost error', err);
    return res.status(500).json({ message: 'Failed to create post' });
  }
};

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '10', 10);
    const skip = (page - 1) * pageSize;

    const posts = await PublicPost.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('userId', 'name');

    const total = await PublicPost.countDocuments();

    return res.status(200).json({ posts, page, pageSize, total });
  } catch (err) {
    console.error('getFeed error', err);
    return res.status(500).json({ message: 'Failed to load feed' });
  }
};

export const getPostStatus = async (req, res) => {
  try {
    const userId = req.userid;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Convert to plain object to ensure friends array is accessible
    const userObj = user.toObject();
    
    // Ensure friends array exists
    if (!userObj.friends) {
      userObj.friends = [];
    }

    console.log('📊 User found:', userObj.name);
    console.log('📊 User friends array:', userObj.friends);
    console.log('📊 Friends array length:', userObj.friends.length);
    console.log('📊 Friends array type:', Array.isArray(userObj.friends) ? 'Array' : typeof userObj.friends);

    const friendCount = getFriendCount(userObj);
    const limit = getDailyPostLimit(friendCount);
    
    console.log('📊 Calculated friend count:', friendCount);
    console.log('📊 Daily limit:', limit);
    const { startUTC, endUTC } = getTodayRangeIST();
    const postsToday = await PublicPost.countDocuments({
      userId,
      createdAt: { $gte: startUTC, $lte: endUTC }
    });

    const canPost = limit === Infinity ? true : postsToday < limit;
    let reason = '';
    if (limit === 0) reason = 'You need at least 1 friend to post on the public page';
    else if (!canPost) reason = `Daily post limit reached. Limit: ${limit}, Used today: ${postsToday}`;

    return res.status(200).json({
      canPost,
      reason,
      friendCount,
      postsToday,
      limit
    });
  } catch (err) {
    console.error('getPostStatus error', err);
    return res.status(500).json({ message: 'Failed to get status' });
  }
};

export const likeToggle = async (req, res) => {
  try {
    const userId = req.userid;
    const { id } = req.params;
    const post = await PublicPost.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.findIndex((u) => String(u) === String(userId));
    if (idx === -1) post.likes.push(userId);
    else post.likes = post.likes.filter((u) => String(u) !== String(userId));

    await post.save();
    return res.status(200).json({ message: 'Updated', likes: post.likes.length });
  } catch (err) {
    console.error('likeToggle error', err);
    return res.status(500).json({ message: 'Failed to like/unlike' });
  }
};

export const addComment = async (req, res) => {
  try {
    const userId = req.userid;
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    const post = await PublicPost.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ userId, text: text.trim() });
    await post.save();
    return res.status(200).json({ message: 'Comment added', comments: post.comments });
  } catch (err) {
    console.error('addComment error', err);
    return res.status(500).json({ message: 'Failed to add comment' });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await PublicPost.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.shares += 1;
    await post.save();
    return res.status(200).json({ message: 'Shared', shares: post.shares });
  } catch (err) {
    console.error('sharePost error', err);
    return res.status(500).json({ message: 'Failed to share' });
  }
};

export const deletePublicPost = async (req, res) => {
  try {
    const userId = req.userid;
    const { id } = req.params;
    const post = await PublicPost.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.userId) !== String(userId)) return res.status(403).json({ message: 'You can delete only your posts' });

    await PublicPost.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    console.error('deletePublicPost error', err);
    return res.status(500).json({ message: 'Failed to delete post' });
  }
};
