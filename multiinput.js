function EditorFactory(id) {
  var elem = document.getElementById(id),
      row = document.createElement('div');
  row.className = 'row';
  elem.appendChild(row);
  var editor = {
    elem: elem,
    row: row,
    columns: [],
    inputs: [],
    maxColumns: 3,
    rows: 1,
    x: 0,
    y: 0,
    // Focus element
    focus: function () {
      this.inputs[editor.x][editor.y].focus();
    },
    // Create new input
    newInput: function () {
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'node';
      return input;
    },
    // Create input placeholder
    newEmptyInput: function () {
      var div = document.createElement('div');
      div.className = 'empty';
      div.innerHTML = '&nbsp;';
      return div;
    },
    // Replace placeholder with element
    replaceEmpty: function (x, y) {
      var input = this.newInput();
      this.columns[x].replaceChild(input, this.inputs[x][y]);
      this.inputs[x][y] = input;
    },
    // Add a column to right
    addColumn: function (row) {
      if (typeof row === 'undefined') {
        row = 0;
      }
      var cinputs = [],
          col = document.createElement('div');
      col.className = 'four col';
      for (var i = 0; i < row; i++) {
        var empty = this.newEmptyInput();
        col.appendChild(empty);
        cinputs.push(empty);
      }
      var input = this.newInput();
      col.appendChild(input);
      cinputs.push(input);
      for (var i = row + 1; i < this.rows; i++) {
        var empty = this.newEmptyInput();
        col.appendChild(empty);
        cinputs.push(empty);
      }
      this.row.appendChild(col);
      this.columns.push(col);
      this.inputs[this.inputs.length] = cinputs;
      console.log(this.inputs);
    },
    // Add a row (fill in placeholders)
    addRow: function () {
      console.log('add empties');
      for (var c = 0; c < this.columns.length; c++) {
        if (c == this.x) {
          var input = this.newInput();
          this.columns[c].appendChild(input);
          this.inputs[c][this.y] = input;
        } else {
          var empty = this.newEmptyInput();
          this.columns[c].appendChild(empty);
          this.inputs[c][this.y] = empty;
        }
      }
      editor.rows++;
    }
  };
  editor.addColumn(0);
  editor.focus();
  return editor;
}

var editor;
function init() {
  editor = EditorFactory('editor');
  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey) {
      console.log(event.keyCode);
      if (event.keyCode === 37) { // LEFT
        if (editor.x > 0) editor.x--;
      } else if (event.keyCode === 38) { // UP
        if (editor.y > 0) editor.y--;
      } else if (event.keyCode === 39) { // RIGHT
        if (editor.x < editor.columns.length - 1) editor.x++;
      } else if (event.keyCode === 40) { // DOWN
        if (editor.x < editor.rows - 1) editor.y++;
      }
      editor.focus();
    } else {
      if (event.keyCode == 9) { // TAB
        event.preventDefault();
        if (event.shiftKey) {
          if (editor.x > 0) {
            editor.x--;
          }
        } else if (editor.x < editor.maxColumns - 1) {
          editor.x++;
          if (editor.x >= editor.columns.length) {
            editor.addColumn(editor.y)
          }
        }
        if (editor.inputs[editor.x][editor.y].className === 'empty') {
          editor.replaceEmpty(editor.x, editor.y);
        }
        editor.focus();
        console.log(editor);
      } else if (event.keyCode == 13) { // ENTER
        if (event.shiftKey) {
          if (editor.y > 0) {
            editor.y--;
          }
        } else {
          editor.y++;
          if (editor.y >= editor.rows) {
            editor.addRow();
          }
        }
        if (editor.inputs[editor.x][editor.y].className === 'empty') {
          editor.replaceEmpty(editor.x, editor.y);
        }
        editor.focus();
        //        console.log(editor);
      }
    }
  }, false);
}
