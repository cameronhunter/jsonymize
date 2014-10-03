var traverse = require("traverse");
var chance = require("chance").Chance();

module.exports = jsonymize;

function jsonymize(json, options) {
  var dom = traverse(json);

  var options = options || {};
  var fields = options.fields || getAllCanonicalFields(dom);
  var ignore = options.ignore || [];
  var overrides = options.overrides || {};

  return JSON.stringify(dom.map(function() {
    var canonicalName = getCanonicalName(this.path);

    if (!this.key || !contains(fields, canonicalName) || contains(ignore, canonicalName)) return;

    var isComplexOverride = (overrides[canonicalName] && typeof overrides[canonicalName] != "string");
    var override = isComplexOverride ? overrides[canonicalName].generator : overrides[canonicalName];

    var generator = selectBestDataGenerator([override, this.key, getGeneratorForType(typeof this.node)]);

    if (generator) {
      var parameters = isComplexOverride ? overrides[canonicalName].params : {};
      this.update(generator(parameters || {}));
    }
  }));
}

function getAllCanonicalFields(dom) {
  return dom.paths().reduce(function(a, b) {
    return b.length ? a.concat(getCanonicalName(b)) : a;
  });
}

function getCanonicalName(path) {
  return (path || []).join(".");
}

function selectBestDataGenerator(generators) {
  var generators = generators.filter(notNull);
  var selected = generators.map(function(name) { return chance[name]; }).filter(notNull);
  return selected.length ? selected[0].bind(chance) : undefined;
}

function getGeneratorForType(type) {
  switch(type) {
    case "number": return "natural";
    case "boolean": return "bool";
    default: return type;
  }
}

function contains(arr, key) {
  return arr.indexOf(key) >= 0;
}

function notNull(item) {
  return item != null;
}
