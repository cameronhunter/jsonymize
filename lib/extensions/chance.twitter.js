var extend = require("extend");
var chance = require("chance").Chance();

module.exports = {
  'tco': function(options) {
    var tco = "https://t.co/";
    var hash = chance.string({
      pool: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      length: (options.length - tco.length) || 5
    });
    return tco + hash;
  },
  'dm': function(options) {
    var value = options.value;
    var indices = [];

    if (value.entities) {
      var entities = value.entities || {};

      value.entities.urls = anonymizeEntities(entities.urls, "url_entity");
      value.entities.user_mentions = anonymizeEntities(entities.user_mentions, "mention");
      value.entities.hashtags = anonymizeEntities(entities.hashtags, "hashtag");
      value.entities.symbols = anonymizeEntities(entities.symbols, "cashtag");

      value.text = replaceEntities(value.text, value.entities.urls, function(entity) { return entity.url; });
      value.text = replaceEntities(value.text, value.entities.user_mentions, function(entity) { return "@" + entity.screen_name; });
      value.text = replaceEntities(value.text, value.entities.hashtags, function(entity) { return "#" + entity.text; });
      value.text = replaceEntities(value.text, value.entities.symbols, function(entity) { return "$" + entity.text; });

      indices = getIndices(indices.concat(value.entities.urls, value.entities.user_mentions, value.entities.hashtags, value.entities.symbols));
    }

    value.text = value.text.split("").reduce(function(out, c, index) {
      var isPartOfEntity = findIndices(indices, index);
      var ignore = ignoreCharacter(c) || (out.substring(out.length - 1) == "'" && c == "s");
      return isPartOfEntity || ignore ? (out + c) : (out + chance.character({alpha: true}));
    }, "");

    return value;
  },
  'url_entity': function(options) {
    var length = options.end - options.start;
    var newUrl = chance.domain();
    return {
      url: chance.tco({length: length}),
      expanded_url: "https://" + newUrl,
      display_url: newUrl,
      indices: [options.start, options.end]
    };
  },
  'hashtag': function(options) {
    var length = options.end - options.start;
    return {
      text: chance.string({alpha: true, length: length - 1}),
      indices: [options.start, options.end]
    };
  },
  'cashtag': function(options) {
    var length = options.end - options.start;
    return {
      text: chance.string({alpha: true, length: length - 1}),
      indices: [options.start, options.end]
    };
  },
  'mention': function(options) {
    var length = options.end - options.start;
    var id = chance.natural();
    var name = chance.name();
    var username = chance.pad(name.replace(/\s/, ''), length, chance.character({alpha: true})).substring(0, length - 1).toLowerCase();
    return {
      screen_name: username,
      name: name,
      id: id,
      id_str: String(id),
      indices: [options.start, options.end]
    };
  }
};

function getIndices(entity) {
  return entity.map(function(e) {
    return e.indices;
  });
}

function findIndices(indices, index) {
  return indices.filter(function(pair) {
    return index >= pair[0] && index < pair[1];
  })[0];
}

function ignoreCharacter(character) {
  return [" ", "'", ".", ","].indexOf(character) >= 0;
}

function replace(source, text, start, end) {
  return source.substring(0, start) + text + source.substring(end);
}

function anonymizeEntities(arr, generator) {
  return arr.map(function(entity) {
    return chance[generator]({start: entity.indices[0], end: entity.indices[1]});
  });
}

function replaceEntities(text, entities, replacement) {
  return entities.reduce(function(text, entity) {
    return replace(text, replacement(entity), entity.indices[0], entity.indices[1]);
  }, text);
}
