var editor;

function init() {
  var elem = document.getElementById('editor');
  var row = document.createElement('div');
  row.className = 'row';
  elem.appendChild(row);
  editor = {
    elem: elem,
    row: row,
    columns: [],
    inputs: [],
    maxColumns: 3,
    rows: 1,
    x: 0,
    y: 0
  };
  newColumn(editor, 0);
  editor.inputs[0][0].focus();

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
      editor.inputs[editor.x][editor.y].focus();
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
            newColumn(editor, editor.y)
          }
        }
        if (editor.inputs[editor.x][editor.y].className === 'empty') {
          replaceEmpty(editor, editor.x, editor.y);
        }
        editor.inputs[editor.x][editor.y].focus();
        console.log(editor);
      } else if (event.keyCode == 13) { // ENTER
        if (event.shiftKey) {
          if (editor.y > 0) {
            editor.y--;
          }
        } else {
          editor.y++;
          if (editor.y >= editor.rows) {
            console.log('add empties');
            for (var c = 0; c < editor.columns.length; c++) {
              if (c == editor.x) {
                var input = newInput();
                editor.columns[c].appendChild(input);
                editor.inputs[c][editor.y] = input;
              } else {
                var empty = newEmptyInput();
                editor.columns[c].appendChild(empty);
                editor.inputs[c][editor.y] = empty;
              }
            }
            editor.rows++;
          }
        }
        if (editor.inputs[editor.x][editor.y].className === 'empty') {
          replaceEmpty(editor, editor.x, editor.y);
        }
        editor.inputs[editor.x][editor.y].focus();
//        console.log(editor);
      }
    }
  }, false);
}

function newEmptyInput() {
  var div = document.createElement('div');
  div.className = 'empty';
  div.innerHTML = '&nbsp;';
  return div;
}

function replaceEmpty(ed, x, y) {
  var input = newInput();
  ed.columns[x].replaceChild(input, ed.inputs[x][y]);
  ed.inputs[x][y] = input;
}

function newInput() {
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'node';
  return input;
}

function newColumn(ed, row) {
  var cinputs = [];
  var col = document.createElement('div');
  col.className = 'four col';
  for (var i = 0; i < row; i++) {
    var empty = newEmptyInput();
    col.appendChild(empty);
    cinputs.push(empty);
  }
  var input = newInput();
  col.appendChild(input);
  cinputs.push(input);
  for (var i = row + 1; i < ed.rows; i++) {
    var empty = newEmptyInput();
    col.appendChild(empty);
    cinputs.push(empty);
  }
  ed.row.appendChild(col);
  ed.columns.push(col);
  ed.inputs[ed.inputs.length] = cinputs;
  console.log(ed.inputs);
}
