import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  overall: { type: Number, min: 1, max: 5, required: true },
  ratings: {
    freshness: { type: Number, min: 0, max: 5, default: 0 },
    packaging: { type: Number, min: 0, max: 5, default: 0 },
    delivery: { type: Number, min: 0, max: 5, default: 0 },
    value: { type: Number, min: 0, max: 5, default: 0 },
  },
  comment: { type: String, default: '' },
  wouldRecommend: { type: Boolean },
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);
