const { cpuCount, instancePrice } = require("./constants");
const ResourceAllocator = require("./index");

const run = () => {
  try {
    // const data = { hours: 8, price: 29 };
    // const data = { hours: 24, cpus: 115 };
    const data = { hours: 7, cpus: 214, price: 95 };
    console.log(data);
    const ra1 = new ResourceAllocator(instancePrice, cpuCount);
    console.dir(ra1.get_costs(data), { depth: null });
    // console.log(ra1.getInstancePrice());
    // console.log(ra1.getBestValueInstanceByRegion());
  } catch (err) {
    console.log(err);
  }
};

run();
