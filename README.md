# bespoke-meta-markdown

Prefix slides with YAML meta data, configure behaviour based
on the meta data.

## Usage

Simply drop it in as a replacement for bespoke-marked, 

```javascript
var markdown = require('bespoke-meta-markdown');
bespoke.from('article', [
  markdown(config)
]);
```

### Config

Default config:

```javascript
var defaults = {
  master: function (slide, value) {
    slide.classList.add(value);
  }
};  
```

To take advantage of this default behavior insert YAML data in a slide

```markdown

---

<!--
master: myClass
-->

# title of slide

* bullet
* list

---

```

To configure your own behavior, simply define methods
on the configuration object

```javascript
var markdown = require('bespoke-meta-markdown');
bespoke.from('article', [
  markdown({
    copyright: function(slide, info) {
      slide.innerHTML += '<p>&copy; ' + info.owner + ' ' + info.year  + '</p>';
    }
  })
]);
```

To turn off default behaviour set master to null

```javascript
var markdown = require('bespoke-meta-markdown');
bespoke.from('article', [
  markdown({master: null});
]);
```

The `this` context of each configuration method is 
the bespoke `deck` object, for cases where YAML configuration
could affect all slides:

```javascript
var markdown = require('bespoke-meta-markdown');
bespoke.from('article', [
  markdown({
    skip: function (slide, bool) {
      if (!bool) {return;}
      var deck = this;
      deck.slides.splice(deck.slides.indexOf(slide), 1);
      deck.parent.removeChild(slide);
    }
  })
]);
```



## Package managers

### npm

```bash
$ npm install bespoke-meta-markdown
```

## Graceful Reloads

As of 1.3.x bespoke-meta-markdown supplies a `reload` method which
allows slides loaded from markdown to be reloaded in place, instead
of a full refresh.

The `reload` method is supplied on the function object returned
when the exported function is called.

```javascript
require('bespoke-meta-markdown') 
  => function metaMarkdown(config) 
    => function bespokePlugin(deck, ...)
    #reload function(file, LR)
```

The idea is to tie it into live reload 

```javascript
var markdown = require('bespoke-meta-markdown');
var md = markdown();
bespoke.from('article', [md]);

LiveReload.addPlugin(MarkdownPlugin)  

function MarkdownPlugin(window, host) {
  this.window = window;
  this.host = host;
}

MarkdownPlugin.prototype.reload = function (path, opts) {
  path = path.split('/');
  var file = path[path.length-1];
  if (file.split('.')[1] !== 'md') { return false; }
  md.reload(file, this); //<-- using the bespoke-meta-markdown reload method
  return true;
}
```




## Credits

This plugin was built with [generator-bespokeplugin](https://github.com/markdalgleish/generator-bespokeplugin).

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
