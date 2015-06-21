import Oboe from "oboe";
import Check from "check-types";
import Chance from "chance";

const __options__ = Symbol("options");
const __chance__ = Symbol("chance");

export default class Jsonymize {
  constructor(options = {}) {
    const { aliases = {}, extensions = [], fields = [], generators = {} } = options;
    this[__options__] = { aliases: aliases, extensions: extensions, fields: fields, generators: generators };
    this[__chance__] = extensions.reduce((chance, extension) => chance.mixin(extension), new Chance());
  }

  anonymize(stream) {
    const chance = this[__chance__];
    const { aliases, fields, generators } = this[__options__];

    const actions = fields.reduce((result, alias) => {
      const field = aliases[alias] || alias;
      const isComplexOverride = Check.object(generators[alias]);
      const generatorOverride = isComplexOverride ? generators[alias].generator : generators[alias];
      const parameterOverride = isComplexOverride ? generators[alias].params : {};

      return Object.assign({}, result, {
        [field]: (value, path) => {
          const generators = findGenerators(chance, generatorOverride, alias, field, ...types(value));
          return generators.map(_ => _.generator(Object.assign({}, parameterOverride, { value: value })))[0];
        }
      });
    }, {});

    return new Promise((resolve, reject) => {
      Oboe(stream).node(actions).done(resolve).fail(reject);
    });
  }
}

function findGenerators(chance, ...generators) {
  return generators
    .filter(value => value != null)
    .map(name => ({name: name, generator: chance[name]}))
    .filter(({ generator }) => Check.function(generator))
    .map(({ name, generator }) => ({name: name, generator: generator.bind(chance)}));
}

function types(value) {
  return [
    ["natural", Check.number],
    ["bool", Check.boolean],
    ["string", Check.string],
    ["date", Check.date],
    ["sentence", (value) => { Check.string(value) && value.includes(" ") }]
  ].map(([type, predicate]) => (predicate(value) ? type : undefined));
}
