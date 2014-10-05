var oboe = require("oboe");
var check = require("check-types");
var Promise = require("promise");
var extend = require("extend");
var Chance = require("chance");

module.exports = function(stream, options) {
  return new Jsonymize(stream, options);
};

function Jsonymize(options) {
  this.chance = new Chance();

  var options = options || {};
  this._fields = options.fields || [];
  this._aliases = options.aliases || {};
  this._generators = options.generators || {};

  this.extensions(options.extensions || []);
}

Jsonymize.fn = Jsonymize.prototype;

Jsonymize.fn.fields = function(fields) {
  this._fields = this._fields.concat(fields);
  return this;
};

Jsonymize.fn.aliases = function(aliases) {
  this._aliases = extend({}, this._aliases, aliases);
  return this;
};

Jsonymize.fn.generators = function(generators) {
  this._generators = extend({}, this._generators, generators);
  return this;
};

Jsonymize.fn.extensions = function(extensions) {
  extensions.forEach(function(extension) {
    console.error("Mixing in extension \"" + extension + "\"");
    this.chance.mixin(require(extension));
  }.bind(this));
  return this;
};

Jsonymize.fn.anonymize = function(stream) {
  var anonymizeActions = this._fields.reduce(function(obj, alias) {
    var field = this._aliases[alias] || alias;

    var isComplexOverride = check.object(this._generators[alias]);
    var generatorOverride = isComplexOverride ? this._generators[alias].generator : this._generators[alias];
    var parameterOverride = isComplexOverride ? this._generators[alias].params : {};

    var selected = findGenerator([generatorOverride, alias, field], this.chance);
    if (selected) {
      obj[field] = function(value) {
        return selected.generator(parameterOverride || {});
      };
    } else {
      obj[field] = function(value, path) {
        var selected = findGenerator([type(value)], this.chance);
        return selected ? selected.generator() : undefined;
      };
    }

    return obj;
  }.bind(this), {});

  return new Promise(function(success, failure) {
    oboe(stream)
      .node(anonymizeActions)
      .done(function(output) {
        success(JSON.stringify(output));
      })
      .fail(function(error) {
        failure(error);
      });
  });
};

Jsonymize.fn.anonymise = Jsonymize.fn.anonymize;

function findGenerator(generators, chance) {
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
