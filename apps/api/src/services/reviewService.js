const reviews = [];
let reviewIdSequence = 0;

function createReviewId() {
  reviewIdSequence += 1;
  return `rev_${Date.now()}_${reviewIdSequence}`;
}

export async function listReviews() {
  return reviews;
}

export async function createReview(payload) {
  const { id: _ignored, ...reviewFields } = payload;
  const review = { id: createReviewId(), ...reviewFields };
  reviews.push(review);
  return review;
}
