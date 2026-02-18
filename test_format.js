
const durationSpace = "10 00";
const partsSpace = durationSpace.split(':').map(Number);
console.log(`"10 00" split:`, partsSpace);
console.log(`some isNaN:`, partsSpace.some(isNaN));

const durationDot = "10.00";
const partsDot = durationDot.split(':').map(Number);
console.log(`"10.00" split:`, partsDot);
console.log(`some isNaN:`, partsDot.some(isNaN));
