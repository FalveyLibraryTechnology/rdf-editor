var editor;

function init() {
  editor = $('<textarea rows="20"></textarea>');
  $('#editor').append(editor);
  tabOverride.set(editor);
  tabOverride.autoIndent(false);
  tabOverride.tabSize(4);
  $.getJSON('./authorities/foaf.json', function(foaf) {
    var classes = [];
    for (var i=0; i<foaf.classes.length; i++) {
      classes.push(foaf.namespace+':'+foaf.classes[i].attr);
    }
    var predicates = [];
    for (var i=0; i<foaf.predicates.length; i++) {
      predicates.push(foaf.namespace+':'+foaf.predicates[i].attr);
    }
    editor.textcomplete([
      { // tech companies
        words: predicates,
        match: /\n[ ]{4}\b(\w{2,})$/,
        search: function (term, callback) {
          callback($.map(this.words, function (word) {
            return term === '**'
              ? word
              : word.indexOf(term) > -1 ? word : null;
          }));
        },
        index: 1,
        replace: function (word) {
          return '\n    ' + word + '\n        ';
        }
      },
      { // tech companies
        words: classes,
        match: /\n[ ]{8}\b(\w{2,})$/,
        search: function (term, callback) {
          callback($.map(this.words, function (word) {
            return term === '**'
              ? word
              : word.indexOf(term) > -1 ? word : null;
          }));
        },
        index: 1,
        replace: function (word) {
          return '\n        ' + word + '\n        ';
        }
      }
    ]);
  });
}
