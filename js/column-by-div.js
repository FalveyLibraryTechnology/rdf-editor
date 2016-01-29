/*
TODO: autocomplete: val -> value
TODO: autocomplete: label, value, description
TODO: autocomplete: store whole object
TODO: Toggle between URI and label
TODO: Visual style to show "this is not a literal"
TODO: Generate full tree
TODO: Render RDF
TODO: Buttons for type and lang
TODO: Blank nodes in object -> right to definition
*/

var serviceURL = false;
var tree, current = {
  subject: false,
  predicate: false
};

function addNewTerm(type) {
  if (
    editor.focused < editor.terms.length - 1 && editor.terms[editor.focused + 1].value == ''
  ) {
    var next = editor.terms[editor.focused + 1];
    // next.parentNode.className = type;
    next.focus();
    return next;
  }
  var input = document.createElement('input');
  input.type = 'text';
  input.onkeydown = control;
  input.onkeyup = contentControl;
  input.onfocus = function () {
    editor.focused = this.index;
    updateCurrents();
  }
  input.onblur = validate;
  var div = document.createElement('div');
  div.className = type;
  if (typeof type === 'undefined') {
    type = 'predicate';
  }
  // Autocomplete
  function callback(value, eventType) {
    if (eventType.mouse) {
      var n = input.parentNode.className === 'predicate' ? 'object' : 'predicate';
      setTimeout(function () {
        addNewTerm(n);
      }, 50);
    }
  }
  if (type == 'object') {
    $(input).autocomplete({
      maxResults: 10,
      handler: function (query, cb) {
        $.fn.autocomplete.ajax({
          url: serviceURL + query,
          dataType:'json',
          success: function(objs) {
            var datums = [];
            for (var i=0;i<objs.length;i++) {
              objs[i].val = objs[i].label;
              datums.push(objs[i]);
            }
            cb(datums);
          }
        });
        cb(autocomplete(input, query));
      },
      callback: callback
    });
  } else {
    $(input).autocomplete({
      maxResults: 10,
      handler: function (query, cb) {
        cb(autocomplete(input, query));
      },
      callback: callback
    });
  }
  div.appendChild(input);
  if (typeof editor.focused === 'undefined') {
    editor.focused = -1;
  }
  input.index = editor.focused + 1;
  if (input.index == editor.terms.length) {
    editor.appendChild(div);
    editor.terms.push(input);
  } else {
    $(div).insertAfter(editor.terms[editor.focused].parentNode);
    editor.terms.splice(editor.input, 0, input);
    for (var i = 0; i < editor.terms.length; i++) {
      editor.terms[i].index = i;
    }
  }
  input.focus();
  return input;
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
      var n = this.parentNode.className === 'predicate' ? 'object' : 'predicate';
      setTimeout(function () {
        addNewTerm(n);
      }, 50);
      return false;
    }
  } else if (e.ctrlKey && 38 === e.which) { // UP
    e.preventDefault();
    editor.terms[Math.max(0, this.index - 1)].focus();
  } else if (e.ctrlKey && 40 === e.which) { // DOWN
    e.preventDefault();
    editor.terms[Math.min(editor.terms.length - 1, this.index + 1)].focus();
  } else if (empty) {
    if (9 === e.which) { // TAB
      e.preventDefault();
      this.parentNode.className = e.shiftKey ? outdent[this.parentNode.className] : indent[this.parentNode.className];
      updateCurrents();
    } else if (8 === e.which) { // BACKSPACE
      this.parentNode.className = outdent[this.parentNode.className];
      updateCurrents();
    } else if (46 === e.which) { // DELETE
      var oldIndex = this.index;
      editor.terms.splice(this.index, 1);
      for (var i = 0; i < editor.terms.length; i++) {
        editor.terms[i].index = i;
      }
      editor.removeChild(this.parentNode);
      editor.terms[Math.min(oldIndex, editor.terms.length - 1)].focus();
    }
  }
}

function contentControl() {
  if (this.parentElement.className === 'predicate' || this.parentElement.className === 'object') {
    if (this.value.match(/\^\^/)) {
      this.value = this.value.substr(0, this.value.length - 2);
      var it = addNewTerm('type');
      it.value = 'xsd:';
    } else if (this.value.match(/\@/)) {
      this.value = this.value.substr(0, this.value.length - 2);
      var it = addNewTerm('lang');
      it.value = 'lang:';
    }
  }
  if (this.value.substr(0, 2) == '_:') {
    $(this.parentNode).addClass('blank');
  }
}

function validate() {
  if (this.parentNode.className === 'object') {
    if (this.value.length > 0) {
      // http://snipplr.com/view/6889/regular-expressions-for-uri-validationparsing/
      var regexUrl = /^(https?):\/\/((?:[a-z0-9.-]|%[0-9A-F]{2}){3,})(?::(\d+))?((?:\/(?:[a-z0-9-._~!$&'()*+,;=:@]|%[0-9A-F]{2})*)*)(?:\?((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?(?:#((?:[a-z0-9-._~!$&'()*+,;=:\/?@]|%[0-9A-F]{2})*))?$/i;
      var regexUri = /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i;
      var regexString = /^".*"$/;
      if (this.value.match(regexUrl)) {
        if (typeof this.helper === 'undefined') {
          // AJAX for useful data
          var link = document.createElement('a');
          link.href = this.value;
          link.innerHTML = 'link';
          link.target = '_new';
          link.onclick = function (e) {
            e.stopPropagation();
            return true;
          }
          var span = document.createElement('span');
          span.appendChild(link);
          span.onclick = function () {
            this.className = 'hidden';
          }
          $(this.parentNode).prepend(span);
          this.helper = link;
        } else {
          this.helper.href = this.value;
          this.helper.parentNode.className = '';
          this.helper.focus();
        }
        $.ajax({
          url: this.value,
          success: function (data) {
            this.helper.innerHTML = $(data).filter('title').html();
          }
        });
      } else if (!this.value.match(regexUri) && !this.value.match(regexString)) {
        this.value = '"' + this.value.replace(/^["\s\uFEFF\xA0]+|["\s\uFEFF\xA0]+$/g, '') + '"';
      }
    }
  }
}

function updateCurrents() {
  current.subject = false;
  current.predicate = false;
  for (var i = editor.focused + 1; i-- && (!current.subject || !current.predicate);) {
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
  load('./config.json', false).then(function (config) {
    loadAll(config.ontologies).then(parseConfigs);
    serviceURL = config.subject_service;
  });
}

var namespaces = [];
var predicates = [];

function parseConfigs(jsons) {
  for (var i = 0; i < jsons.length; i++) {
    for (var j = 0; j < jsons[i].predicates.length; j++) {
      jsons[i].predicates[j].uri = jsons[i].uri + jsons[i].predicates[j].attr;
      predicates.push(jsons[i].predicates[j]);
      namespaces.push({
        namespace: jsons[i].namespace,
        uri: jsons[i].namespace
      });
    }
  }
  editor.className = '';
  document.getElementById('loading').className = 'hidden';
}

function autocomplete(el, query) {
  var parts = query.split(':');
  var group = false;
  if (parts.length > 1) {
    query = parts[1];
    var grex = new RegExp(parts[0], 'i');
    for (var i = 0; i < namespaces.length; i++) {
      if (namespaces[i].namespace.match(grex)) {
        group = namespaces[i].uri;
        break;
      }
    }
  }
  var regex = new RegExp(query, 'i');
  var group_regex = new RegExp(group, 'i');

  return predicates.filter(function(op) {
    if (group && !op.uri.match(group_regex)) {
      return false;
    }
    return op.uri.match(regex);
  }).map(function(op) {
    if ('undefined' === typeof op.description) {
      return op.label;
    } else {
      return {
        val: op.uri,
        description: op.description
      }
    }
  });
}
