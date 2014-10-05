var oboe = require("oboe");
var check = require("check-types");
var Promise = require("promise");
var chance = require("chance").Chance();

module.exports = jsonymize;

function jsonymize(stream, options) {
  var options = options || {};
  var fields = options.fields || ["*"];
  var ignored = asArray(options.ignore);
  var aliases = options.aliases || {};
  var generators = options.generators || {};
  var extensions = asArray(options.extensions);

  extensions.forEach(function(extension) {
    console.error("Mixing in extension \"" + extension + "\"");
    chance.mixin(require(extension));
  });

  var anonymizeActions = fields.reduce(function(obj, alias) {
    var field = aliases[alias] || alias;

    var isComplexOverride = check.object(generators[alias]);
    var generatorOverride = isComplexOverride ? generators[alias].generator : generators[alias];
    var parameterOverride = isComplexOverride ? generators[alias].params : {};

    obj[field] = handle(generatorOverride, parameterOverride, contains(ignored, alias));

    return obj;
  }, {});

  return new Promise(function(fulfill, reject) {
    oboe(stream)
      .node(anonymizeActions)
      .done(function(output) {
        fulfill(JSON.stringify(output));
      })
      .fail(function(error) {
        reject(error);
      });
  });
}

function handle(generator, params, ignore) {
  return function(value, path) {
    if (!path.length || ignore) return;

    var name = path.join(".");
    var field = path[path.length - 1];

    var potentialGenerators = [generator, field, type(value)].filter(notNull);
    var selected = findGenerator(potentialGenerators);

    return selected ? selected.generator(params || {}) : undefined;
  };
}

function findGenerator(generators) {
  return generators
    .filter(notNull)
    .map(function(name) {
      return {name: name, generator: chance[name]};
    })
    .filter(function(obj) {
      return check.fn(obj.generator);
    })
    .map(function(obj) {
      return {name: obj.name, generator: obj.generator.bind(chance)};
    })[0];
}

function type(value) {
  return [
    [check.floatNumber, "float"],
    [check.number, "natural"],
    [check.webUrl, "domain"],
    [check.email, "email"],
    [isType("boolean"), "bool"],
    [isSentence, "sentence"],
    [check.defined, typeof value]
  ].map(function(pair) {
    return pair[0](value) ? pair[1] : undefined;
  }).filter(notNull)[0];
}

function contains(arr, key) {
  return arr.indexOf(key) >= 0;
}

function notNull(item) {
  return item != null;
}

function isType(t) {
  return function(value) {
    return typeof value == t;
  };
}

function isSentence(value) {
  return check.string(value) && value.indexOf(" ") >= 0;
}

function asArray(value) {
  return (check.array(value) ? value : [value]) || []; 
}
