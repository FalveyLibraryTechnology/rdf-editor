/**
 * vufind.typeahead.js 0.10
 * ~ @crhallberg
 */
(function ( $ ) {
  var xhr = false;

  $.fn.autocomplete = function(settings) {

    var options = $.extend( {}, $.fn.autocomplete.options, settings );

    function align(input, element) {
      var position = input.position();
      element.css({
        position: 'absolute',
        top: position.top + input.outerHeight(),
        left: position.left,
        minWidth: input.width(),
        maxWidth: Math.max(input.width(), input.closest('form').width()),
        zIndex: 50
      });
    }

    function show() {
      $.fn.autocomplete.element.removeClass(options.hidingClass);
    }
    function hide() {
      $.fn.autocomplete.element.addClass(options.hidingClass);
    }

    function populate(data, input, eventType) {
      input.val(data.value);
      input.data('selection', data);
      if (options.callback) {
        options.callback(data, input, eventType);
      }
      hide();
    }

    function dataToListEl(data, length, term) {
      var shell = $('<div/>').addClass('list');
      if (options.highlight) {
        // escape term for regex
        // https://github.com/sindresorhus/escape-string-regexp/blob/master/index.js
        var escapedTerm = term.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
      }
      var regex = new RegExp('('+escapedTerm+')', 'ig');
      for (var i=0; i<length; i++) {
        if (typeof data[i] === 'string') {
          data[i] = {value: data[i]};
        }
        if ('undefined' === typeof data[i].value) {
          if (typeof data[i].label !== 'undefined') {
            data[i].value = data[i].label;
          } else {
            continue;
          }
        }
        // HTML
        var item = typeof data[i].href === 'undefined'
          ? $('<div/>')
          : $('<a/>').attr('href', data[i].href);
        var content = typeof data[i].label !== 'undefined'
          ? data[i].label
          : data[i].value;
        if (options.highlight) {
          content = content.replace(regex, '<b>$1</b>');
        }
        // Data
        item.attr('data-index', i+0)
            .attr('data-value', data[i].value)
            .data(data[i])
            .addClass('item')
            .html(content);
        if (typeof data[i].description !== 'undefined') {
          item.append($('<small/>').text(data[i].description));
        }
        if (typeof data[i].broader == 'string') {
          item.addClass('broader');
        }
        if (typeof data[i].narrower == 'string') {
          item.addClass('narrower');
        }
        shell.append(item);
      }
      return shell;
    }
    function createList(data, input) {
      var shell = $('<div/>').addClass('list');
      var length = Math.min(options.maxResults, data.length);
      input.data('length', length);
      var list = dataToListEl(data, length, input.val());
      list.find('.item').mouseover(function() {
        $.fn.autocomplete.element.find('.item.selected').removeClass('selected');
        $(this).addClass('selected');
        input.data('selected', $(this).data('index'));
      });
      $.fn.autocomplete.element.html(list);
      $.fn.autocomplete.element.find('.item').mousedown(function() {
        populate($(this).data(), input, {mouse: true});
      });
      align(input, $.fn.autocomplete.element);
    }

    function search(input, element) {
      if (xhr) { xhr.abort(); }
      if (input.val().length >= options.minLength) {
        element.html('<i class="item loading">'+options.loadingString+'</i>');
        show();
        align(input, $.fn.autocomplete.element);
        var term = input.val();
        var cid = input.data('cache-id');
        if (options.cache && typeof $.fn.autocomplete.cache[cid][term] !== "undefined") {
          if ($.fn.autocomplete.cache[cid][term].length === 0) {
            hide();
          } else {
            createList($.fn.autocomplete.cache[cid][term], input, element);
          }
        } else if (typeof options.handler !== "undefined") {
          options.handler(input.val(), function(data) {
            $.fn.autocomplete.cache[cid][term] = data;
            if (data.length === 0) {
              hide();
            } else {
              createList(data, input, element);
            }
          });
        } else {
          console.error('handler function not provided for autocomplete');
        }
        input.data('selected', -1);
      } else {
        hide();
      }
    }

    function setup(input, element) {
      if (typeof element === 'undefined') {
        element = $('<div/>')
          .addClass('autocomplete-results hidden')
          .html('<div class="list"><i class="item loading">'+options.loadingString+'</i></div>');
        align(input, element);
        $(document.body).append(element);
        $(window).resize(function() {
          align(input, element);
        });
      }

      input.data('selected', -1);
      input.data('length', 0);

      if (options.cache) {
        var cid = Math.floor(Math.random()*1000);
        input.data('cache-id', cid);
        $.fn.autocomplete.cache[cid] = {};
      }

      input.blur(function(e) {
        if (e.target.acitem) {
          setTimeout(hide, 10);
        } else {
          hide();
        }
      });
      input.click(function() {
        search(input, element);
      });
      input.focus(function() {
        search(input, element);
      });
      input.keyup(function(event) {
        // Ignore navigation keys
        // - Ignore control functions
        if (event.ctrlKey) {
          return;
        }
        // - Function keys (F1 - F15)
        if (112 <= event.which && event.which <= 126) {
          return;
        }
        switch (event.which) {
          case 9:    // tab
          case 13:   // enter
          case 16:   // shift
          case 20:   // caps lock
          case 27:   // esc
          case 33:   // page up
          case 34:   // page down
          case 35:   // end
          case 36:   // home
          case 37:   // arrows
          case 38:
          case 39:
          case 40:
          case 45:   // insert
          case 144:  // num lock
          case 145:  // scroll lock
          case 19:   // pause/break
            return;
          default:
            search(input, element);
        }
      });

      input.keydown(function(event) {
        var element = $.fn.autocomplete.element;
        var position = $(this).data('selected');

        function animateSlide(dir) {
          return new Promise(function (resolve, reject) {
            var iter = 0;
            var frames = 60;
            var time = 100; // milliseconds
            if (!dir) dir = 1;
            var diff = dir * $.fn.autocomplete.element.width() / frames;
            $.fn.autocomplete.element.css('margin-left', '0px');
            function slide() {
              if (iter++ < frames) {
                $.fn.autocomplete.element.find('.list.old').css('margin-left', '+='+diff+'px');
                $.fn.autocomplete.element.find('.side.list').css('left', '+='+diff+'px');
                setTimeout(slide, time/frames);
              } else {
                resolve();
              }
            }
            slide();
          });
        }
        function createSidemenu(searchFunc, dir) {
          if (position > -1 && $.fn.autocomplete.element.find('.side.list').length === 0) {
            event.preventDefault();
            $.fn.autocomplete.element.find('.list').addClass('old');
            var sidelist = $('<div>'+$.fn.autocomplete.options.loadingString+'...</div>')
            if (dir > 0) {
              sidelist.addClass('side list left');
            } else {
              sidelist.addClass('side list right');
            }
            searchFunc(element.find('.item.selected').data(), function(data) {
              var length = Math.min(options.maxResults, data.length);
              sidelist.html(dataToListEl(data, length, input.val()));
              // sidelist.find('.item:eq('+position+')').addClass('selected');
              $.fn.autocomplete.element.append(sidelist.height('100%'));
              animateSlide(dir).then(function() {
                createList(data, input);
                input.data('selected', -1);
                $.fn.autocomplete.element.css('margin-left', '0');
              });
            });
          }
        }

        switch (event.which) {
          // arrow keys through items
          case 38: {
            event.preventDefault();
            element.find('.item.selected').removeClass('selected');
            if (position > 0) {
              position--;
              element.find('.item:eq('+position+')').addClass('selected');
              $(this).data('selected', position);
            } else {
              $(this).data('selected', -1);
            }
            break;
          }
          case 40: {
            event.preventDefault();
            if ($.fn.autocomplete.element.hasClass(options.hidingClass)) {
              search(input, element);
            } else if (position < input.data('length')-1) {
              position++;
              element.find('.item.selected').removeClass('selected');
              element.find('.item:eq('+position+')').addClass('selected');
              $(this).data('selected', position);
            }
            break;
          }
          case 37: { // left key
            if (position > -1) {
              event.preventDefault();
              if (element.find('.item.selected').hasClass('broader')) {
                createSidemenu(options.broadSearch, 1);
              }
              break;
            }
          }
          case 39: { // right key
            if (position > -1) {
              event.preventDefault();
              if (element.find('.item.selected').hasClass('narrower')) {
                createSidemenu(options.narrowSearch, -1);
              }
              break;
            }
          }
          // enter to nav or populate
          case 9:
          case 13: {
            var selected = element.find('.item.selected');
            if (selected.length > 0) {
              event.preventDefault();
              if (event.which === 13 && selected.attr('href')) {
                location.assign(selected.attr('href'));
              } else {
                populate(selected.data(), $(this), element, {key: true});
                element.find('.item.selected').removeClass('selected');
                $(this).data('selected', -1);
              }
            }
            break;
          }
          // hide on escape
          case 27: {
            hide();
            $(this).data('selected', -1);
            break;
          }
        }
      });

      if (
        typeof options.data    === "undefined" &&
        typeof options.handler === "undefined" &&
        typeof options.preload === "undefined" &&
        typeof options.remote  === "undefined"
      ) {
        return input;
      }

      return element;
    }

    return this.each(function() {

      var input = $(this);

      if (typeof settings === "string") {
        if (settings === "show") {
          show();
          align(input, $.fn.autocomplete.element);
        } else if (settings === "hide") {
          hide();
        } else if (settings === "clear cache" && options.cache) {
          var cid = parseInt(input.data('cache-id'));
          $.fn.autocomplete.cache[cid] = {};
        }
        return input;
      } else {
        if (!$.fn.autocomplete.element) {
          $.fn.autocomplete.element = setup(input);
        } else {
          setup(input, $.fn.autocomplete.element);
        }
      }

      return input;

    });
  };

  var timer = false;
  if (typeof $.fn.autocomplete.cache === 'undefined') {
    $.fn.autocomplete.cache = {};
    $.fn.autocomplete.element = false;
    $.fn.autocomplete.options = {
      ajaxDelay: 200,
      cache: true,
      hidingClass: 'hidden',
      highlight: true,
      loadingString: 'Loading...',
      maxResults: 20,
      minLength: 3
    };
    $.fn.autocomplete.ajax = function(ops) {
      if (timer) clearTimeout(timer);
      if (xhr) { xhr.abort(); }
      timer = setTimeout(
        function() { xhr = $.ajax(ops); },
        $.fn.autocomplete.options.ajaxDelay
      );
    }
  }

}( jQuery ));
