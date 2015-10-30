function addNewTerm(type) {
  if (typeof type === 'undefined') {
    type = 'predicate';
  }
  if (editor.terms.length > 0) {
    console.log(editor.terms[editor.terms.length-1].value);
    if (editor.terms[editor.terms.length-1].value === 'rdf:type') {
      type = 'type';
    }
  }
  var div = document.createElement('div');
  div.className = type;
  var input = document.createElement('input');
  input.type = 'text';
  input.index = editor.terms.length;
  input.onkeydown = control;
  $(input).autocomplete({
    maxResults: 10,
    loadingString: 'Loading...',
    handler: function(query, cb) {
      cb(autocomplete(input, query));
    }
  });
  div.appendChild(input);
  editor.appendChild(div);
  editor.terms.push(input);
  input.focus();
  return input;
}

function autocomplete(op, query) {
  if ('undefined' === typeof completeSets[op.parentNode.className]) {
    return [];
  }
  return $.map(
    completeSets[op.parentNode.className],
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
    } else if (8 === e.which) { // BACKSPACE
      this.parentNode.className = outdent[this.parentNode.className];
    } else if (46 === e.which) {
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

var editor;
function init() {
  editor = document.getElementById('editor');
  editor.terms = [];
  addNewTerm('subject');
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

var completeSets = {
  predicate: [],
  type: [],
  datatype: []
};
function parseJSONs(jsons) {
  for (var i = 0; i < jsons.length; i++) {
    // console.log(jsons[i].namespace);
    for (var j = 0; j < jsons[i].classes.length; j++) {
      var item = { label: jsons[i].namespace + ':' + jsons[i].classes[j].attr };
      if (typeof jsons[i].classes[j].description !== 'undefined') {
        item.description = jsons[i].classes[j].description;
      }
      completeSets.type.push(item);
    }
    for (var j = 0; j < jsons[i].predicates.length; j++) {
      var item = { label: jsons[i].namespace + ':' + jsons[i].predicates[j].attr };
      if (typeof jsons[i].predicates[j].description !== 'undefined') {
        item.description = jsons[i].predicates[j].description;
      }
      completeSets.predicate.push(item);
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
  }
  editor.className = '';
  document.getElementById('loading').className = 'hidden';
}
