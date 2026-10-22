import test from 'node:test';
import assert from 'node:assert/strict';
import recommendationService from '../src/services/recommendation.service.js';

test('Recommendation Engine: Offline evaluation metrics (Precision@K, Recall@K, NDCG@K)', () => {
  const recommendedIds = ['prod1', 'prod2', 'prod3', 'prod4', 'prod5'];
  const groundTruthIds = ['prod1', 'prod3', 'prod7'];

  const metrics = recommendationService.evaluateRecommendations(recommendedIds, groundTruthIds, 5);

  assert.equal(metrics.k, 5);
  assert.equal(metrics.hits, 2); // prod1 and prod3 hit
  assert.equal(metrics.precisionAtK, 0.4); // 2/5
  assert.equal(metrics.recallAtK, 0.667); // 2/3 rounded to 3 decimal places
  assert.ok(metrics.ndcgAtK > 0 && metrics.ndcgAtK <= 1.0);
});

test('Recommendation Engine: NDCG@K is 1.0 for perfect top ranking', () => {
  const recommended = ['prodA', 'prodB', 'prodC'];
  const groundTruth = ['prodA', 'prodB', 'prodC'];

  const metrics = recommendationService.evaluateRecommendations(recommended, groundTruth, 3);
  assert.equal(metrics.ndcgAtK, 1.0);
  assert.equal(metrics.precisionAtK, 1.0);
  assert.equal(metrics.recallAtK, 1.0);
});

test('Recommendation Engine: NDCG@K is 0 when zero recommendations match ground truth', () => {
  const recommended = ['p1', 'p2', 'p3'];
  const groundTruth = ['x1', 'x2'];

  const metrics = recommendationService.evaluateRecommendations(recommended, groundTruth, 3);
  assert.equal(metrics.hits, 0);
  assert.equal(metrics.precisionAtK, 0);
  assert.equal(metrics.recallAtK, 0);
  assert.equal(metrics.ndcgAtK, 0);
});
