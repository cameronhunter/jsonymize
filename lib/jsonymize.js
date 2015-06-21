import Oboe from "oboe";
import Check from "check-types";
import Chance from "chance";

const _options = Symbol("options");
const _chance = Symbol("chance");

export default class Jsonymize {
  constructor(options = {}) {
    const { aliases = {}, extensions = [], fields = [], generators = {} } = options;
    this[_options] = { aliases: aliases, extensions: extensions, fields: fields, generators: generators };
    this[_chance] = new Chance();
  }

  copy(options = {}) {
    const { aliases = {}, extensions = [], fields = [], generators = {} } = options;
    return new Jsonymize(Object.assign({}, this[_options], {
      aliases: Object.assign({}, this[_options].aliases, aliases),
      extensions: this[_options].extensions.concat(extensions),
      fields: this[_options].fields.concat(fields),
      generators: Object.assign({}, this[_options].generators, generators)
    }));
  }

  anonymize(stream) {
    const chance = this[_chance];
    const { aliases, fields, generators } = this[_options];

    const actions = fields.reduce((action, alias) => {
      const field = aliases[alias] || alias;
      const isComplexOverride = Check.object(generators[alias]);
      const generatorOverride = isComplexOverride ? generators[alias].generator : generators[alias];
      const parameterOverride = isComplexOverride ? generators[alias].params : {};

      return Object.assign({}, action, {
        [field]: (value, path) => {
          const gen = findGenerator([generatorOverride, alias, field], chance) || findGenerator([type(value)], chance);
          return gen ? gen.generator(Object.assign({}, parameterOverride, { value: value })) : undefined;
        }
      });
    }, {});

    return new Promise((resolve, reject) => {
      Oboe(stream).node(actions).done(resolve).fail(reject);
    });
  }
}

function findGenerator(generators, chance) {
  return generators
    .filter(x => x != null)
    .map(name => ({name: name, generator: chance[name]}))
    .filter(obj => Check.function(obj.generator))
    .map(obj => ({name: obj.name, generator: obj.generator.bind(chance)}))[0];
}

function type(value) {
  return [
    [Check.number, "natural"],
    [Check.boolean, "bool"],
    [Check.string, "string"],
    [Check.date, "date"],
    [(value) => { Check.string(value) && value.includes(" ") }, "sentence"]
  ].map(pair => {
    return (pair[0] && pair[0](value)) ? pair[1] : undefined
  }).filter(x => x != null)[0];
}
