import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  status: { type: String, enum: ['processing', 'processed', 'failed'], default: 'processing' },
  metadata: { type: mongoose.Schema.Types.Mixed },
  processedAt: Date,
  createdAt: { type: Date, default: Date.now, expires: 30 * 24 * 60 * 60 }, // TTL 30 days
});

webhookEventSchema.index({ eventId: 1 }, { unique: true });

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
export default WebhookEvent;
