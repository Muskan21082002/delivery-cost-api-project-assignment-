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
  I: { center: 'C3', weight: 2 },
};

// Distance matrix (bidirectional)
const distances = {
  C1: { C2: 4, L1: 3 },
  C2: { C1: 4, C3: 3, L1: 2.5 },
  C3: { C2: 3, L1: 2 }
};

// Helper to calculate cost by weight and distance
function calculateTripCost(weight, distance) {
  if (weight === 0) return 10 * distance;
  if (weight<=5)    return 10 * distance;
  let costPerUnit = 10;
  weight -= 5;
  while (weight > 0) {
    costPerUnit += 8;
    weight -= 5;
  }
  return costPerUnit * distance;
}

// Recursive route cost calculation
function findMinCost(order, current, visitedCenters, delivered, costSoFar) {
  if (Object.keys(delivered).length === Object.keys(order).length) {
    return costSoFar;
  }

  let minCost = Infinity;

  for (let product in order) {
    if (delivered[product]) continue;

    const { center, weight } = productMap[product];
    if (!visitedCenters.has(center)) {
      // Move to center
      const toCenter = distances[current]?.[center] || distances[center]?.[current];
      if (toCenter === undefined) continue;
      const travelEmptyCost = calculateTripCost(0, toCenter);
      visitedCenters.add(center);
      const moveToL1 = distances[center].L1;
      const deliveryCost = calculateTripCost(weight * order[product], moveToL1);
      delivered[product] = true;
      const total = findMinCost(order, center, visitedCenters, delivered, costSoFar + travelEmptyCost + deliveryCost);
      minCost = Math.min(minCost, total);
      delivered[product] = false;
      visitedCenters.delete(center);
    }
  }

  return minCost;
}

app.post('/calculate', (req, res) => {
  const order = req.body;
  const centers = ['C1', 'C2', 'C3'];
  let minTotalCost = Infinity;

  for (let center of centers) {
    const tempDelivered = {};
    const visited = new Set();
    visited.add(center);
    let initialCost = 0;

    for (let product in order) {
      if (productMap[product].center === center) {
        const weight = productMap[product].weight * order[product];
        const toL1 = distances[center].L1;
        initialCost += calculateTripCost(weight, toL1);
        tempDelivered[product] = true;
      }
    }

    const total = findMinCost(order, center, visited, tempDelivered, initialCost);
    minTotalCost = Math.min(minTotalCost, total);
  }

  res.json({ minimumCost: Math.round(minTotalCost) });
});
app.get('/', (req, res) => {
  res.send('API is running');
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});