const SKUS = ['SKU-101', 'SKU-202', 'SKU-303', 'SKU-404'];

function pick(values) {
  return values[Math.floor(Math.random() * values.length)];
}

export function randomOrder() {
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const items = [];

  for (let i = 0; i < itemCount; i += 1) {
    items.push({
      sku: pick(SKUS),
      quantity: 1 + Math.floor(Math.random() * 4),
      unitPriceCents: 500 + Math.floor(Math.random() * 9500),
    });
  }

  return { customerId: `cus_load_${__VU}_${__ITER}`, items };
}
