var tree, current = {
  subject: false,
  predicate: false
};
function addNewTerm(type) {
  var input = document.createElement('input');
  input.type = 'text';
  input.onkeydown = control;
  input.onkeyup = contentControl;
  input.onfocus = function() {
    editor.focused = this.index;
    updateCurrents();
  }
  $(input).autocomplete({
    maxResults: 10,
    loadingString: 'Loading...',
    handler: function(query, cb) {
      cb(autocomplete(input, query));
    }
  });
  var div = document.createElement('div');
  div.className = type;
  if (typeof type === 'undefined') {
    type = 'predicate';
  }
  div.appendChild(input);
  if (typeof editor.focused === 'undefined') {
    editor.focused = -1;
  }
  input.index = editor.focused+1;
  if (input.index == editor.terms.length) {
    editor.appendChild(div);
    editor.terms.push(input);
  } else {
    $(div).insertAfter(editor.terms[editor.focused].parentNode);
    editor.terms.splice(editor.input, 0, input);
    for (var i=0; i<editor.terms.length; i++) {
      editor.terms[i].index = i;
    }
  }
  input.focus();
  return input;
}

function autocomplete(op, query) {
  var set = current.predicate === 'rdf:type'
    ? 'type'
    : op.parentNode.className
  if ('undefined' === typeof completeSets[set]) {
    return [];
  }
  var items = $.map(
    completeSets[set],
    function (word) {
      var regex = new RegExp(query, 'i');
      if (word.label.match(regex)) {
        if (typeof word.description === 'undefined') {
          return word.label;
        } else {
          return {
            val: word.label,
            description: word.description
          }
        }
      }
      return null;
    }
  );
  if (items.length < 10) {
    var dmatches = $.map(
      completeSets[set],
      function (word) {
        if (typeof word.description !== 'undefined') {
          var regex = new RegExp(query, 'i');
          if (word.description.match(regex)) {
            return {
              val: word.label,
              description: word.description
            }
          }
          return null;
        }
      }
    );
    var i = 0;
    while(items.length < 10 && i < dmatches.length) {
      items.push(dmatches[i++]);
    }
  }
  return items;
}

var indent = {
  'subject': 'predicate',
  'predicate': 'object',
  'object': 'object',
  'type': 'type',
};
var outdent = {
  'subject': 'subject',
  'predicate': 'subject',
  'object': 'predicate',
  'type': 'type',
};
function control(e) {
  var empty = this.value.length === 0;
  if (13 === e.which) { // ENTER
    e.preventDefault();
    if (empty) {
      this.parentNode.className = outdent[this.parentNode.className];
      updateCurrents();
    } else {
      var n = this.parentNode.className === 'predicate'
        ? 'object'
        : 'predicate';
      setTimeout(function() {
        addNewTerm(n);
      }, 50);
      return false;
    }
  } else if (e.ctrlKey && 38 === e.which) { // UP
    e.preventDefault();
    editor.terms[Math.max(0, this.index-1)].focus();
  } else if (e.ctrlKey && 40 === e.which) { // DOWN
    e.preventDefault();
    editor.terms[Math.min(editor.terms.length-1, this.index+1)].focus();
  } else if (empty) {
    if (9 === e.which) { // TAB
      e.preventDefault();
      this.parentNode.className = e.shiftKey
        ? outdent[this.parentNode.className]
        : indent[this.parentNode.className];
      updateCurrents();
    } else if (8 === e.which) { // BACKSPACE
      this.parentNode.className = outdent[this.parentNode.className];
      updateCurrents();
    } else if (46 === e.which) { // DELETE
      var oldIndex = this.index;
      editor.terms.splice(this.index, 1);
      for (var i=0; i<editor.terms.length; i++) {
        editor.terms[i].index = i;
      }
      editor.removeChild(this.parentNode);
      editor.terms[Math.min(oldIndex, editor.terms.length-1)].focus();
    }
  }
}
function contentControl() {
  if (
    (this.parentElement.className === 'object'
    || this.parentElement.className === 'lang')
    && this.value.match(/\^\^/)
  ) {
    this.value = this.value.substr(0, this.value.length-2);
    var it = addNewTerm('type');
    it.value = 'xsd:';
  } else if (
    (this.parentElement.className === 'object'
    || this.parentElement.className === 'type')
    && this.value.match(/\@/)
  ) {
    this.value = this.value.substr(0, this.value.length-2);
    var it = addNewTerm('lang');
    it.value = 'lang:';
  }
}

function updateCurrents() {
  current.subject = false;
  current.predicate = false;
  for (var i=editor.focused+1; i-- && (!current.subject || !current.predicate); ) {
    if (false === current.subject && editor.terms[i].parentNode.className === 'subject') {
      current.subject = editor.terms[i].value;
    }
    if (false === current.predicate && editor.terms[i].parentNode.className === 'predicate') {
      current.predicate = editor.terms[i].value;
    }
  }
  if (current.subject.length == 0) {
    current.predicate = false;
  }
}

var editor;
function init() {
  editor = document.getElementById('editor');
  editor.terms = [];
  addNewTerm('subject');
  loadAll([
    './authorities/dc.json',
    './authorities/foaf.json',
    './authorities/languages.json',
    './authorities/owl.json',
    './authorities/rdf.json',
    './authorities/rdfschema.json',
    './authorities/schema.org.json',
    './authorities/xsd.json',
  ]).then(parseJSONs);
}

var completeSets = {
  predicate: [],
  type: [],
  datatype: [],
  lang: []
};
function parseJSONs(jsons) {
  for (var i = 0; i < jsons.length; i++) {
    if (!!jsons[i].classes) {
      for (var j = 0; j < jsons[i].classes.length; j++) {
        var item = { label: jsons[i].namespace + ':' + jsons[i].classes[j].attr };
        if (typeof jsons[i].classes[j].description !== 'undefined') {
          item.description = jsons[i].classes[j].description;
        }
        completeSets.type.push(item);
      }
    }
    if (!!jsons[i].predicates) {
      for (var j = 0; j < jsons[i].predicates.length; j++) {
        var item = { label: jsons[i].namespace + ':' + jsons[i].predicates[j].attr };
        if (typeof jsons[i].predicates[j].description !== 'undefined') {
          item.description = jsons[i].predicates[j].description;
        }
        completeSets.predicate.push(item);
      }
    }
    if (!!jsons[i].datatypes) {
      for (var j = 0; j < jsons[i].datatypes.length; j++) {
        var item = { label: jsons[i].namespace + ':' + jsons[i].datatypes[j].attr };
        if (typeof jsons[i].datatypes[j].description !== 'undefined') {
          item.description = jsons[i].datatypes[j].description;
        }
        completeSets.datatype.push(item);
      }
    }
    if (!!jsons[i].languages) {
      for (var j = 0; j < jsons[i].languages.length; j++) {
        var item = { label: jsons[i].namespace + ':' + jsons[i].languages[j].attr };
        if (typeof jsons[i].languages[j].description !== 'undefined') {
          item.description = jsons[i].languages[j].description;
        }
        completeSets.lang.push(item);
      }
    }
  }
  editor.className = '';
  document.getElementById('loading').className = 'hidden';
}
