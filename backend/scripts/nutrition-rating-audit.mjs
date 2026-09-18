import { prisma } from "../src/lib/prisma.js";

const products = await prisma.product.findMany({
  select: {
    name: true,
    category: true,
    registrationNumber: true,
    nutritionRating: {
      select: {
        category: true,
        confidence: true,
        reason: true,
        starRatingHalfSteps: true,
      },
    },
  },
  orderBy: { name: "asc" },
});

const byConfidence = { COMPLETE: [], CONSERVATIVE: [], INSUFFICIENT_DATA: [] };
const noRating = [];

for (const product of products) {
  if (!product.nutritionRating) {
    noRating.push(product.name);
    continue;
  }
  byConfidence[product.nutritionRating.confidence].push(product);
}

console.log(`Total products: ${products.length}`);
console.log(`No nutrition rating row (cosmetics/medicines): ${noRating.length}`);
console.log(`COMPLETE: ${byConfidence.COMPLETE.length}`);
console.log(`CONSERVATIVE: ${byConfidence.CONSERVATIVE.length}`);
console.log(`INSUFFICIENT_DATA: ${byConfidence.INSUFFICIENT_DATA.length}`);
console.log("");
console.log("--- INSUFFICIENT_DATA products (need manual review) ---");
for (const product of byConfidence.INSUFFICIENT_DATA) {
  console.log(`- ${product.name} [${product.nutritionRating.category}] :: ${product.nutritionRating.reason}`);
}
console.log("");
console.log("--- CONSERVATIVE products (star rating computed) ---");
for (const product of byConfidence.CONSERVATIVE) {
  console.log(`- ${product.name}: ${product.nutritionRating.starRatingHalfSteps / 2} stars`);
}
console.log("");
console.log("--- COMPLETE products ---");
for (const product of byConfidence.COMPLETE) {
  console.log(`- ${product.name}: ${product.nutritionRating.starRatingHalfSteps / 2} stars`);
}

await prisma.$disconnect();
