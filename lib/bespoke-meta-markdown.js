var marked = require('marked'),
    hljs = require('highlight.js'),
    yaml = require('js-yaml'),
    hljsRenderer = new marked.Renderer();

var defaults = {
  master: function (slide, value) {
    slide.classList.add(value);
  }
};


function grabMeta(slide) {
  var firstChild = slide.firstChild;
  if (!firstChild || firstChild.nodeType !== 8) {return;}
  var meta = yaml.load(firstChild.nodeValue);
  meta._comment = firstChild;
  slide.removeChild(firstChild);
  return meta;
}

function processMeta(slide, meta, config, deck) {

  Object.keys(meta).forEach(function (key) {
    if (key !== 'marked-options' && config[key] instanceof Function) { 
      config[key].call(deck, slide, meta[key]);
    }
  });
}

hljsRenderer.code = function(code, lang, escaped) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      code = hljs.highlight(lang, code).value;
    } catch (e) {
    }
  }

  return '<pre><code'
    + (lang ? ' class="hljs ' + this.options.langPrefix + lang + '"'
        : ' class="hljs"')
    + '>'
    + code
    + '\n</code></pre>\n';
};

marked.setOptions({
  renderer: hljsRenderer,
  highlight: function(code, lang) {
    var params = [code];
    if (lang) {
      params.push([lang]);
    }
    return hljs.highlightAuto.apply(this, params).value;
  }
});




/**
 * Fetches the content of a file through AJAX.
 * @param {string} path the path of the file to fetch
 * @param {Function} callbackSuccess
 * @param {Function} callbackError
 */
var fetchFile = function(path, callbackSuccess, callbackError) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callbackSuccess(xhr.responseText);
      } else {
        callbackError();
      }
    }
  };
  xhr.open('GET', path, false);
  try {
    xhr.send();
  } catch (e) {
    callbackError();
  }
};

var markdown = function(slide, config, deck) {
  var meta = grabMeta(slide);
  var comment = meta._comment;
  slide.innerHTML = marked(slide.innerHTML, meta['marked-options']);
  processMeta(slide, meta, config, deck);

  if (comment) {
    slide.insertBefore(comment, slide.firstChild);
  }
};

var createSlide = function(deck, slide, config) {
  var newSlide = document.createElement('section'),
      index;

  newSlide.className = 'bespoke-slide';
  if (typeof slide !== 'undefined' && slide instanceof HTMLElement) {
    deck.parent.insertBefore(newSlide, slide);
    index = deck.slides.indexOf(slide);
    deck.slides.splice(index, 0, newSlide);
  } else {
    deck.parent.appendChild(newSlide);
    deck.slides.push(newSlide);
  }

  return newSlide;
};

var removeSlide = function(deck, slide) {
  var slideIndex = deck.slides.indexOf(slide);
  deck.slides.splice(slideIndex, 1);
  deck.parent.removeChild(slide);
};

var slidify = function(deck, slide, config) {
  var markdownAttribute = slide.getAttribute('data-markdown'),
      slideIndex = deck.slides.indexOf(slide);

  switch (true) {
    // data-markdown="path-to-file.md" (so we load the .md file)
    case markdownAttribute && markdownAttribute.trim() !== '':
      fetchFile(markdownAttribute.trim(), function(fileContents) {
        var slidesContent = fileContents.split(/\r?\n---\r?\n/);
        slidesContent.forEach(function(slideContent) {
          var slideContainer = createSlide(deck, slide);
          slideContainer.innerHTML = (slideContent || '').trim();
          markdown(slideContainer, config, deck);
        });

        // removes original slide
        removeSlide(deck, slide);

      }, function() {
        slide.innerHTML = 'Error loading the .md file for this slide.';
      });
      break;

    // data-markdown="" or data-markdown (so we markdown the content)
    case markdownAttribute !== null:
      markdown(slide, config, deck);
      break;

    // plain html slide. Don't do anything
    default:
      break;
  }
};

var processDeckForMarkdownAttributes = function(deck, config) {
  var markdownAttribute = deck.parent.getAttribute('data-markdown'),
      slide;

  if (markdownAttribute && markdownAttribute.trim()) {
    // <article data-markdown="...">
    // load the whole deck from md file
    // we create an initial slide with the same markdown attribute
    slide = createSlide(deck, config);
    slide.setAttribute('data-markdown', markdownAttribute);
  }

  // traverse slides to see which are html and which are md (data-markdown)
  deck.slides.forEach(function(slide) {
    slidify(deck, slide, config);
  });
};

/**
 * Checks whether we should consider for markdown rendering:
 * - elements with the attribute data-markdown, if at least one element has
 * that. It can be one or some slides or the parent object (full presentation).
 * - the content of all slides, if no element has data-markdown.
 */
var getPluginMode = function(deck) {
  var hasDataMarkdownAttribute,
      elements = [];

  elements.push(deck.parent);
  deck.slides.forEach(function(slide) {
    elements.push(slide);
  });
  hasDataMarkdownAttribute = elements.some(function(current) {
    return current.getAttribute('data-markdown') !== null;
  });

  return hasDataMarkdownAttribute ? 'transform-marked-elements-only' :
    'transform-content-of-all-slides';
};

module.exports = function(config) {
  config = config || {};
  config.__proto__ = defaults;

  function metamd(deck) {
    metamd.deck = deck;
    var mode = getPluginMode(deck);

    switch (mode) {
      case 'transform-marked-elements-only':
        processDeckForMarkdownAttributes(deck, config);
        break;
      case 'transform-content-of-all-slides':
        deck.slides.forEach(function (slide) {
          markdown(slide, config, deck);
        });
        break;
    }
  }

  metamd.reload = function (file, LR) {
    var deck = metamd.deck;
    fetchFile(file, function(fileContents) {

      var slidesContent = fileContents.split(/\r?\n---\r?\n/);
      var current = deck.slide();
      var diff, count;
      var clone = Object.create(deck);

      clone.parent = clone.parent.cloneNode();
      clone.slides = [];

      slidesContent.forEach(function(slideContent, ix) {
        var slide = clone.slides[ix] || createSlide(clone);
        slide.className = 'bespoke-slide';
        slide.innerHTML = (slideContent || '').trim();
        markdown(slide, config, clone);
      });

      count = clone.slides.length;
      diff = deck.slides.length - count;

      clone.slides.forEach(function (slide, ix) {
        deck.slides[ix].innerHTML = slide.innerHTML;
      });

      if (diff) { dispatchEvent(new Event('resize')); }

      //prune dupes 
      while (diff > 0) {
        removeSlide(deck, deck.slides[count + diff-- - 1]);
      }


      deck.slide(current < 0 ? 0 : current);
      

    }, function() {
         if (LR) {
          LR.host.console.log('Error reloading ' + file);
        }
    });

  };

  return metamd;
};

function load(slidesContent, deck, config) {

}



module.exports.marked = marked;
