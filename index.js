const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3100;

// Product mapping and weights
const productMap = {
  A: { center: 'C1', weight: 3 },
  B: { center: 'C1', weight: 2 },
  C: { center: 'C1', weight: 8 },
  D: { center: 'C2', weight: 12 },
  E: { center: 'C2', weight: 25 },
  F: { center: 'C2', weight: 15 },
  G: { center: 'C3', weight: 0.5 },
  H: { center: 'C3', weight: 1 },
  I: { center: 'C3', weight: 2 }
};

// Distance matrix
const distances = {
  C1: { C2: 4, L1: 3 },
  C2: { C1: 4, C3: 3, L1: 2.5 },
  C3: { C2: 3, L1: 2 }
};

// Calculate trip cost based on weight and distance
function calculateCost(weight, distance) {
  if (weight === 0) return 10 * distance;

  let costPerKm = 10;
  weight -= 5;
  while (weight > 0) {
    costPerKm += 8;
    weight -= 5;
  }
  return costPerKm * distance;
}

// Recursive function to explore all delivery combinations
function dfs(currentLocation, order, delivered, costSoFar) {
  const allDelivered = Object.keys(order).every(p => delivered[p]);
  if (allDelivered) return costSoFar;

  let minCost = Infinity;

  for (let center of ['C1', 'C2', 'C3']) {
    const toPick = Object.keys(order).filter(
      p => !delivered[p] && productMap[p].center === center
    );

    if (toPick.length === 0) continue;

    const weight = toPick.reduce(
      (sum, p) => sum + productMap[p].weight * order[p], 0
    );

    const travelToCenter = currentLocation === center ? 0 :
      (distances[currentLocation]?.[center] ?? distances[center]?.[currentLocation]);

    if (travelToCenter === undefined) continue;

    const costToCenter = calculateCost(0, travelToCenter);
    const costToL1 = calculateCost(weight, distances[center].L1);

    // Mark as delivered
    toPick.forEach(p => delivered[p] = true);

    const totalCost = dfs('L1', order, delivered, costSoFar + costToCenter + costToL1);
    minCost = Math.min(minCost, totalCost);

    // Backtrack
    toPick.forEach(p => delete delivered[p]);
  }

  return minCost;
}

app.post('/calculate', (req, res) => {
  const order = req.body;
  if (!order || Object.keys(order).length === 0) {
    return res.status(400).json({ error: 'Invalid order input' });
  }

  const delivered = {};
  const result = dfs('C1', order, delivered, 0);

  res.json({ minimumCost: Math.round(result) });
});

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
