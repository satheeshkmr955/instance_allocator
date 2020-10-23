const { cpuCount, instancePrice } = require("./constants");
const {
  RACSchema,
  addInstanceSchema,
  removeInstanceSchema,
  costSchema,
} = require("./schemas");
const {
  getCheapestInstance,
  AllocateByCpusPerHour,
  AllocateByPricePerHour,
} = require("./utils/helpers");

class ResourceAllocator {
  constructor(instanceCost = {}, cpuCountByInstance = {}) {
    const { error } = RACSchema.validate({
      instanceCost,
      cpuCountByInstance,
    });
    if (error) {
      const errMsg = error.details.map((err) => err.message).toString();
      throw Error(errMsg);
    }
    this.instanceCost = instanceCost;
    this.cpuCountByInstance = cpuCountByInstance;
    this.getCheapestInstanceByRegion = null;
  }

  calcCheapestInstanceByRegion(instanceCost) {
    return Object.keys(instanceCost).map((region) => ({
      [region]: getCheapestInstance(this.instanceCost[region]),
    }));
  }

  getBestValueInstanceByRegion() {
    if (this.getCheapestInstanceByRegion === null)
      this.getCheapestInstanceByRegion = this.calcCheapestInstanceByRegion(
        this.instanceCost
      );
    return this.getCheapestInstanceByRegion;
  }

  addOrUpdateInstanceByRegion(region, instance, cost) {
    const { error } = addInstanceSchema.validate({
      region,
      instance,
      cost,
    });
    if (error) {
      const errMsg = error.details.map((err) => err.message).toString();
      throw Error(errMsg);
    }
    if (this.instanceCost[region] || this.instanceCost[region][instance]) {
      this.instanceCost[region][instance] = cost;
    } else {
      this.instanceCost[region] = {};
      this.instanceCost[region][instance] = cost;
    }
    this.getCheapestInstanceByRegion = this.calcCheapestInstanceByRegion(
      this.instanceCost
    );
  }

  deleteInstanceByRegion(region, instance) {
    const { error } = removeInstanceSchema.validate({
      region,
      instance,
    });
    if (error) {
      const errMsg = error.details.map((err) => err.message).toString();
      throw Error(errMsg);
    }
    if (this.instanceCost[region] && this.instanceCost[region][instance]) {
      delete this.instanceCost[region][instance];
      this.getCheapestInstanceByRegion = this.calcCheapestInstanceByRegion(
        this.instanceCost
      );
    }
  }

  getInstancePrice() {
    return this.instanceCost;
  }

  getAllocateByCpusPerHour(hours, cpus) {
    const instancePrice = this.getInstancePrice();
    const regions = Object.keys(instancePrice).map((region) => {
      const { total_cost, servers, total_cpus } = AllocateByCpusPerHour(
        instancePrice[region],
        cpus
      );
      let totalCostForHours = total_cost * hours;
      totalCostForHours = parseFloat(totalCostForHours.toFixed(2));
      return {
        region: region,
        total_cost: `$${totalCostForHours}`,
        total_cpus,
        total_hours: hours,
        servers,
      };
    });
    return regions;
  }

  getAllocateByPricePerHour(hours, price) {
    const instancePrice = this.getInstancePrice();
    let pricePerHour = price / hours;
    pricePerHour = parseFloat(pricePerHour.toFixed(2));
    const regions = Object.keys(instancePrice).map((region) => {
      const { total_cost, servers, total_cpus } = AllocateByPricePerHour(
        instancePrice[region],
        pricePerHour
      );
      let totalCostForHours = total_cost * hours;
      totalCostForHours = parseFloat(totalCostForHours.toFixed(2));
      return {
        region: region,
        total_cost: `$${totalCostForHours}`,
        total_cpus,
        total_hours: hours,
        servers,
      };
    });
    return regions;
  }

  get_costs({ hours, cpus, price }) {
    const { error } = costSchema.validate({
      hours,
      cpus,
      price,
    });
    if (error) {
      const errMsg = error.details.map((err) => err.message).toString();
      throw Error(errMsg);
    }
    const response = { result: [] };
    if (hours && cpus && price === undefined) {
      const regions = this.getAllocateByCpusPerHour(hours, cpus);
      response.result = regions;
    } else if (hours && cpus === undefined && price) {
      const regions = this.getAllocateByPricePerHour(hours, price);
      response.result = regions;
    } else if (hours && cpus && price) {
      // const regions = this.getAllocateByCpusPerHour(hours, cpus);
      const regions = this.getAllocateByPricePerHour(hours, price);
      response.result = regions;
    }
    response.result.sort((a, b) => {
      const x = parseFloat(a.total_cost.replace("$", ""));
      const y = parseFloat(b.total_cost.replace("$", ""));
      return x - y;
    });
    console.log(hours, cpus, price);
    console.dir(response, { depth: null });
    return { response };
  }
}

const run = () => {
  try {
    const ra1 = new ResourceAllocator(instancePrice, cpuCount);
    // console.log(ra1.getInstancePrice());
    // ra1.get_costs({ hours: 8, price: 29 });
    // ra1.get_costs({ hours: 24, cpus: 115 });
    ra1.get_costs({ hours: 7, cpus: 214, price: 95 });
    // console.log(ra1.getBestValueInstanceByRegion());
  } catch (err) {
    console.log(err);
  }
};

run();
