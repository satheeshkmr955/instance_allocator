const { cpuCount } = require("../constants");

const helperFunc = {};

helperFunc.getMaxCpuInstances = (obj = {}) => {
  const keys = Object.keys(obj);
  const sorted = keys.sort((a, b) => cpuCount[b] - cpuCount[a]);
  return sorted;
};

helperFunc.getCheapestInstance = (obj) => {
  const maxCpuInstance = helperFunc.getMaxCpuInstances(obj);
  const keys = Object.keys(obj);
  const newMaxCpuInstance =
    maxCpuInstance && maxCpuInstance[0]
      ? cpuCount[maxCpuInstance[0]] * 2
      : obj[keys[0]];
  const sorted = keys.sort((a, b) => {
    const aCount = newMaxCpuInstance / cpuCount[a];
    const bCount = newMaxCpuInstance / cpuCount[b];
    return obj[a] * aCount - obj[b] * bCount;
  });
  return sorted;
};

helperFunc.AllocateByCpusPerHour = (instanceObj, cpus, price) => {
  let total_cost = 0;
  let total_cpus = 0;
  const servers = [];
  const minPricedInstance = helperFunc.getCheapestInstance(instanceObj);
  let temp = cpus;
  let index = 0;
  while (temp !== 0) {
    if (
      index >= minPricedInstance.length ||
      temp < cpuCount[minPricedInstance[minPricedInstance.length - 1]]
    ) {
      break;
    }
    const serverType = minPricedInstance[index];
    const countOfCpu = cpuCount[serverType];
    const no_of_cpus = parseInt(temp / countOfCpu);
    const instanceCost = instanceObj[serverType];
    if (no_of_cpus > 0) servers.push({ serverType, no_of_cpus });
    total_cost += no_of_cpus * instanceCost;
    total_cpus += no_of_cpus * cpuCount[serverType];
    temp -= countOfCpu * no_of_cpus;
    index++;
  }
  total_cost = parseFloat(total_cost.toFixed(2));
  return {
    total_cost,
    servers,
    total_cpus,
    min_requested_cpus: total_cpus >= cpus,
  };
};

helperFunc.AllocateByPricePerHour = (instanceObj, cpus, price) => {
  let total_cost = 0;
  let total_cpus = 0;
  const servers = [];
  const minPricedInstance = helperFunc.getCheapestInstance(instanceObj);
  let temp = price;
  let index = 0;
  while (temp >= 0) {
    if (index >= minPricedInstance.length) {
      break;
    }
    const serverType = minPricedInstance[index];
    const instanceCost = instanceObj[serverType];
    const no_of_cpus = parseInt(temp / instanceCost);
    if (no_of_cpus > 0) servers.push({ serverType, no_of_cpus });
    total_cost += no_of_cpus * instanceCost;
    total_cpus += no_of_cpus * cpuCount[serverType];
    temp -= no_of_cpus * instanceCost;
    temp = parseFloat(temp.toFixed(2));
    index++;
  }
  total_cost = parseFloat(total_cost.toFixed(2));
  return {
    total_cost,
    servers,
    total_cpus,
    min_requested_cpus: cpus !== undefined ? total_cpus >= cpus : true,
  };
};

module.exports = helperFunc;
