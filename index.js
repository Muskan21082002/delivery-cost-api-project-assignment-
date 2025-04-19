const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

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

// Calculates delivery cost per trip
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

// DFS function to find minimum cost by partial delivery
function dfs(current, order, delivered, costSoFar) {
  // If all products delivered, return total cost
  if (Object.keys(delivered).length === Object.keys(order).length) {
    return costSoFar;
  }

  let minCost = Infinity;

  // Try each center
  for (let center of ['C1', 'C2', 'C3']) {
    // Pick up undelivered products from this center
    const products = Object.keys(order).filter(
      p => !delivered[p] && productMap[p].center === center
    );

    if (products.length === 0) continue;

    // Calculate pickup weight and delivery cost
    let totalWeight = products.reduce((sum, p) => sum + productMap[p].weight * order[p], 0);

    // Travel cost to center (if not at center)
    const travelToCenter = current === center ? 0 :
      (distances[current]?.[center] ?? distances[center]?.[current]);
    const travelCost = calculateCost(0, travelToCenter);

    // Delivery cost from center to L1
    const deliveryCost = calculateCost(totalWeight, distances[center].L1);

    // Mark delivered
    products.forEach(p => delivered[p] = true);

    // Continue DFS from L1
    const total = dfs('L1', order, delivered, costSoFar + travelCost + deliveryCost);
    minCost = Math.min(minCost, total);

    // Backtrack
    products.forEach(p => delete delivered[p]);
  }

  return minCost;
}

app.post('/calculate', (req, res) => {
  const order = req.body;
  const delivered = {};
  let minCost = dfs('C1', order, delivered, 0);
  res.json({ minimumCost: Math.round(minCost) });
});

app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
