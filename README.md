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

To take advantage of this default behaviour insert YAML data in a slide

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

## Package managers

### npm

```bash
$ npm install bespoke-meta-markdown
```


## Credits

This plugin was built with [generator-bespokeplugin](https://github.com/markdalgleish/generator-bespokeplugin).

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
