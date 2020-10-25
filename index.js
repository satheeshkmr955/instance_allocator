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

const ResourceAllocator = (function () {
  const calcCheapestInstanceByRegion = (props) => {
    const instanceCost = props.instanceCost;
    return Object.keys(instanceCost).reduce((acc, region) => {
      acc[region] = getCheapestInstance(
        instanceCost[region],
        props.cpuCountByInstance
      );
      return acc;
    }, {});
  };

  const getAllocateByCpusPerHour = (
    props,
    hours,
    cpus,
    price,
    isObject = false
  ) => {
    const currentInstancePrice = props.getInstancePrice();
    const cheapestInstanceByRegion = getBestValueInstanceByRegion(props);
    const regions = Object.keys(currentInstancePrice).reduce(
      (acc, region) => {
        const {
          total_cost,
          servers,
          total_cpus,
          min_requested_cpus,
        } = AllocateByCpusPerHour(
          cheapestInstanceByRegion[region],
          currentInstancePrice[region],
          cpus,
          price,
          props.cpuCountByInstance
        );
        let totalCostForHours = total_cost * hours;
        totalCostForHours = parseFloat(totalCostForHours.toFixed(2));
        const data = {
          region: region,
          total_cost: `$${totalCostForHours}`,
          total_cpus,
          total_hours: hours,
          min_requested_cpus,
          max_requested_price:
            price !== undefined ? totalCostForHours <= price : true,
          servers,
        };
        if (isObject) acc[region] = data;
        else acc.push(data);
        return acc;
      },
      isObject ? {} : []
    );
    return regions;
  };

  const getAllocateByPricePerHour = (
    props,
    hours,
    cpus,
    price,
    isObject = false
  ) => {
    const currentInstancePrice = props.getInstancePrice();
    const cheapestInstanceByRegion = getBestValueInstanceByRegion(props);
    let pricePerHour = price / hours;
    pricePerHour = parseFloat(pricePerHour.toFixed(2));
    const regions = Object.keys(currentInstancePrice).reduce(
      (acc, region) => {
        const {
          total_cost,
          servers,
          total_cpus,
          min_requested_cpus,
        } = AllocateByPricePerHour(
          cheapestInstanceByRegion[region],
          currentInstancePrice[region],
          cpus,
          pricePerHour,
          props.cpuCountByInstance
        );
        let totalCostForHours = total_cost * hours;
        totalCostForHours = parseFloat(totalCostForHours.toFixed(2));
        const data = {
          region: region,
          total_cost: `$${totalCostForHours}`,
          total_cpus,
          total_hours: hours,
          min_requested_cpus,
          max_requested_price: totalCostForHours <= price,
          servers,
        };
        if (isObject) acc[region] = data;
        else acc.push(data);
        return acc;
      },
      isObject ? {} : []
    );
    return regions;
  };

  const getBestValueInstanceByRegion = (props) => {
    if (props.getCheapestInstanceByRegion === null)
      props.getCheapestInstanceByRegion = calcCheapestInstanceByRegion(props);
    return props.getCheapestInstanceByRegion;
  };

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

    getInstancePrice() {
      return this.instanceCost;
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
      this.getCheapestInstanceByRegion = calcCheapestInstanceByRegion(this);
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
        this.getCheapestInstanceByRegion = calcCheapestInstanceByRegion(this);
      }
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
        const regions = getAllocateByCpusPerHour(this, hours, cpus, price);
        response.result = regions;
      } else if (hours && cpus === undefined && price) {
        const regions = getAllocateByPricePerHour(this, hours, cpus, price);
        response.result = regions;
      } else if (hours && cpus && price) {
        const byPrice = getAllocateByPricePerHour(this, hours, cpus, price);
        const byCpus = getAllocateByCpusPerHour(this, hours, cpus, price, true);
        const regions = byPrice.map((data) => {
          const instanceName = data.region;
          const cpuInstance = byCpus[instanceName];
          let newData = data;
          if (
            !(data.min_requested_cpus && data.max_requested_price) &&
            cpuInstance.min_requested_cpus &&
            cpuInstance.max_requested_price
          ) {
            newData = cpuInstance;
          }
          return newData;
        });
        response.result = regions;
      }
      response.result.sort((a, b) => {
        const x = parseFloat(a.total_cost.replace("$", ""));
        const y = parseFloat(b.total_cost.replace("$", ""));
        return x - y;
      });
      return response;
    }
  }
  return ResourceAllocator;
})();

module.exports = ResourceAllocator;
