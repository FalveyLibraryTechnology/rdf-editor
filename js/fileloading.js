function load(file, bar) {
  var p = new Promise(
    function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', file, true);
      xhr.responseType = 'json';
      xhr.onreadystatechange = function() {
        var DONE = this.DONE || 4;
        if (this.readyState === DONE) {
          resolve(this.response);
          bar.value = bar.value + 1;
        }
      };
      xhr.send();
    }
  );
  return p;
}
function loadAll(files) {
  var bar = document.getElementById('loading');
  bar.value = 0;
  bar.max = files.length;
  var promises = [];
  for(var i=0; i<files.length; i++) {
    promises.push(load(files[i], bar));
  }
  return Promise.all(promises);
}
