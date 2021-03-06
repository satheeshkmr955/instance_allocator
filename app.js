const { cpuCount, instancePrice } = require("./src/constants");
const ResourceAllocator = require("./src/index");

const run = () => {
  try {
    // const data = { hours: 8, price: 29 };
    // const data = { hours: 24, cpus: 115 };
    const data = { hours: 7, cpus: 214, price: 95 };
    console.log(data);
    const ra1 = new ResourceAllocator(instancePrice, cpuCount);
    console.dir(ra1.get_costs(data), { depth: null });
    // console.log(ra1.getInstancePrice());
  } catch (err) {
    console.log(err);
  }
};

run();
