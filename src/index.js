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

/**
 * A Resource Allocator IIFE Function
 * @param {price} float - Maximum price requested the user willing to pay
 * @param {cpus} integer - Minimum cpu requested that user need to compute
 * @param {hours} integer - Hours required for user to reserves the instances
 * @return {ResourceAllocator} class - Using it can create new instance type and can allocate instances
 */
const ResourceAllocator = (function () {
  /**
   * Private Function - Calculate the instance price by region - private function
   * @param {props} class instance - Get the instance cost, etc... of the class ResourceAllocator
   * @return {object} object - Get the object of array with instance name sorted in min to max priced instance
   */
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

  /**
   * Private Function - Calculate the instance price by region using cpus quantity
   * @param {props} class instance - Get the instance cost, etc... of the class ResourceAllocator
   * @param {price} float - Maximum price requested the user willing to pay
   * @param {cpus} integer - Minimum cpu requested that user need to compute
   * @param {hours} integer - Hours required for user to reserves the instances
   * @param {isObject} boolean - It denotes whether the return data is array or object. Default false
   * @return {regions} array or object - Allocate the instance by using cpu quantity and return 
        array or object data per region
   */
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

  /**
   * Private Function - Calculate the instance price by region using maximum user requested price
   * @param {props} class instance - Get the instance cost, etc... of the class ResourceAllocator
   * @param {price} float - Maximum price requested the user willing to pay
   * @param {cpus} integer - Minimum cpu requested that user need to compute
   * @param {hours} integer - Hours required for user to reserves the instances
   * @param {isObject} boolean - It denotes whether the return data is array or object. Default false
   * @return {regions} array or object - allocate the instance by using user requested price and return 
        array or object data per region
   */
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

  /**
   * Private Function - Calculate the instance price by region using maximum user requested price
   * @param {props} class instance - Get the instance cost, etc... of the class ResourceAllocator
   * @return {regions} array - Get the object of array with instance name sorted in min to max priced instance
   */
  const getBestValueInstanceByRegion = (props) => {
    if (props.getCheapestInstanceByRegion === null)
      props.getCheapestInstanceByRegion = calcCheapestInstanceByRegion(props);
    return props.getCheapestInstanceByRegion;
  };

  class ResourceAllocator {
    /**
     * Constructor Function - Get the data from user and instantiates
     * @param {instanceCost} object - Instance cost per region
     * @param {cpuCountByInstance} object - Cpu count per instance
     * @return {void} no return
     */
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

    /**
     * Public Method - Get the current instance price per region
     * @return {instanceCost} object - Instance price per region
     */
    getInstancePrice() {
      return this.instanceCost;
    }

    /**
     * Public Method - Add or update instance by region
     * @param {region} string - The region the user need to update the instance
     * @param {instance} string - The name of the instance
     * @param {cost} float - The price which user change the instance
     * @return {void} no return
     */
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

    /**
     * Public Method - Delete instance by region
     * @param {region} string - The region the user need to update the instance
     * @param {instance} string - The name of the instance
     * @param {cost} float - The price which user change the instance
     * @return {void} no return
     */
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

    /**
   * Public Method - Calculate the instance price by region
   * @param {price} float - Maximum price requested the user willing to pay
   * @param {cpus} integer - Minimum cpu requested that user need to compute
   * @param {hours} integer - Hours required for user to reserves the instances
   * @return {regions} object - Returns the data containing the total_cost, servers, etc... 
        per region for each instances
   */
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
