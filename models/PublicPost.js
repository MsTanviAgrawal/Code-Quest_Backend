import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const publicPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caption: { type: String, maxlength: 1000 },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  comments: [commentSchema],
  shares: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('PublicPost', publicPostSchema);
