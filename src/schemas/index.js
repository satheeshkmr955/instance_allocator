const Joi = require("joi");

const schemas = {};

schemas.RACSchema = Joi.object().keys({
  instanceCost: Joi.object().pattern(
    /^/,
    Joi.object().pattern(/^/, Joi.number().positive().required())
  ),
  cpuCountByInstance: Joi.object().pattern(
    /^/,
    Joi.number().positive().integer().required()
  ),
});

schemas.addInstanceSchema = Joi.object().keys({
  region: Joi.string().required(),
  instance: Joi.string().required(),
  cost: Joi.number().required(),
});

schemas.removeInstanceSchema = Joi.object().keys({
  region: Joi.string().required(),
  instance: Joi.string().required(),
});

schemas.costSchema = Joi.object()
  .keys({
    hours: Joi.number().min(1).required(),
    price: Joi.number().positive(),
    cpus: Joi.number().min(1),
  })
  .or("price", "cpus");

module.exports = schemas;
