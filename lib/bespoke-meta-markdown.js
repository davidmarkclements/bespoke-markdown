var markdown = require('bespoke-markdown');
var yaml = require('js-yaml');
var defaults = {
  master: function (slide, value) {
    slide.classList.add(value);
  }
}

function processMeta(slide, config) {
  if (slide.firstChild.nodeType !== 8) {return;}

  var meta = yaml.load(slide.firstChild.nodeValue);

  Object.keys(meta).forEach(function (key) {
    if (key in config) { 
      config[key](slide, meta[key]);
    }
  });
}

module.exports = function(config) {
  config = config || {};
  config.__proto__ = defaults;
  return function(deck) {
    markdown()(deck);
    deck.slides.forEach(function(slide) {
      processMeta(slide, config)
    })
    return;
    var mode = getPluginMode(deck);

    switch (mode) {
      case 'transform-marked-elements-only':
        processDeckForMarkdownAttributes(deck);
        break;
      case 'transform-content-of-all-slides':
        deck.slides.forEach(markdownSlide);
        break;
    }
  };
};
