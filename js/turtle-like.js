var SUBJECT = 0,
    PREDICATE = 1,
    OBJECT = 2,
    TYPE = 3;
var editor,
    editorStage = SUBJECT,
    editorStageJustChanged = false;

function init() {
  editor = $('<textarea rows="20"></textarea>');
  $('#editor').append(editor);
  $('#editor').on('keyup', function(e) {
    if (13 === e.which) {
      e.preventDefault();
      switch (editorStage) {
        case SUBJECT:
          if (!editorStageJustChanged) {
            insertAtCursor(e.target, '    ');
            editorStage = PREDICATE;
          }
          break;
        case PREDICATE:
          if (editorStageJustChanged) {
            e.target.value = e.target.value.substr(0, e.target.value.length-5);
            e.target.value += '\n';
            editorStage = SUBJECT;
          }
          break;
        case PREDICATE:
            e.target.value = e.target.value.substr(0, e.target.value.length-5);
            e.target.value += '\n';
            editorStage = SUBJECT;
          }
          break;
      }
      editorStageJustChanged = true;
    } else {
      editorStageJustChanged = false;
    }
    $('#debug').text(editorStage + " " + editorStageJustChanged);
  });
  loadAll([
    './authorities/dc.json',
    './authorities/foaf.json',
    './authorities/owl.json',
    './authorities/rdf.json',
    './authorities/rdfschema.json',
    './authorities/schema.org.json',
    './authorities/xsd.json',
  ]).then(parseJSONs);
}

function parseJSONs(jsons) {
  var classes = [];
  var predicates = [];
  var datatypes = [];
  for (var i = 0; i < jsons.length; i++) {
    console.log(jsons[i].namespace);
    for (var j = 0; j < jsons[i].classes.length; j++) {
      classes.push(jsons[i].namespace + ':' + jsons[i].classes[j].attr);
    }
    for (var j = 0; j < jsons[i].predicates.length; j++) {
      predicates.push(jsons[i].namespace + ':' + jsons[i].predicates[j].attr);
    }
    if (!!jsons[i].datatypes) {
      for (var j = 0; j < jsons[i].datatypes.length; j++) {
        datatypes.push(jsons[i].namespace + ':' + jsons[i].datatypes[j].attr);
      }
    }
  }
  editor.textcomplete([
    { // predicates
      words: predicates,
      match: /\n[ ]{4}\b([\w\:]{2,})$/,
      search: function (term, callback) {
        callback($.map(this.words, function (word) {
          return word.indexOf(term) > -1 ? word : null;
        }));
      },
      index: 1,
      replace: function (word) {
        editorStage = OBJECT;
        return '\n    ' + word + '\n        ';
      }
    },
    { // rdf:type
      words: classes,
      match: /\n[ ]{4}rdf:type\n[ ]{8}\b([\w\:]*)$/,
      search: function (term, callback) {
        var regex = new RegExp(term, 'i');
        callback($.map(this.words, function (word) {
          return word.match(regex) ? word : null;
        }));
      },
      index: 1,
      replace: function (word) {
        editorStage = PREDICATE;
        return '\n    rdf:type\n        ' + word + '\n    ';
      }
    }
  ]);
  $('#editor').show();
  $('progress').hide();
}

function insertAtCursor(myField, myValue) {
  //IE support
  if (document.selection) {
    myField.focus();
    sel = document.selection.createRange();
    sel.text = myValue;
  }
  //MOZILLA and others
  else if (myField.selectionStart || myField.selectionStart == '0') {
    var startPos = myField.selectionStart;
    var endPos = myField.selectionEnd;
    myField.value = myField.value.substring(0, startPos)
        + myValue
        + myField.value.substring(endPos, myField.value.length);
  } else {
    myField.value += myValue;
  }
}
