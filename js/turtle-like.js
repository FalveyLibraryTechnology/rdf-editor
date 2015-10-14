var editor;

function init() {
  editor = $('<textarea rows="20"></textarea>');
  $('#editor').append(editor);
  tabOverride.set(editor);
  tabOverride.autoIndent(false);
  tabOverride.tabSize(4);
  loadAll([
    './authorities/foaf.json',
    './authorities/xsd.json',
    './authorities/schema.org.json',
    './authorities/rdf.json',
    './authorities/rdfschema.json',
  ]).then(parseJSONs);
}

function parseJSONs(jsons) {
  var classes = [];
  var predicates = [];
  for (var i = 0; i < jsons.length; i++) {
    console.log(jsons[i].namespace);
    for (var j = 0; j < jsons[i].classes.length; j++) {
      classes.push(jsons[i].namespace + ':' + jsons[i].classes[j].attr);
    }
    for (var j = 0; j < jsons[i].predicates.length; j++) {
      predicates.push(jsons[i].namespace + ':' + jsons[i].predicates[j].attr);
    }
  }
  editor.textcomplete([
    { // tech companies
      words: predicates,
      match: /\n[ ]{4}\b([\w\:]{2,})$/,
      search: function (term, callback) {
        callback($.map(this.words, function (word) {
          return word.indexOf(term) > -1 ? word : null;
        }));
      },
      index: 1,
      replace: function (word) {
        return '\n    ' + word + '\n        ';
      }
    },
    { // tech companies
      words: classes,
      match: /\n[ ]{8}\b([\w\:]{2,})$/,
      search: function (term, callback) {
        callback($.map(this.words, function (word) {
          return word.indexOf(term) > -1 ? word : null;
        }));
      },
      index: 1,
      replace: function (word) {
        return '\n        ' + word + '\n        ';
      }
    }
  ]);
}
