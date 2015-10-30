/**
 * vufind.typeahead.js 0.1
 * ~ @crhallberg
 */
(function ( $ ) {

  $.fn.autocomplete = function(settings, ops) {

    var options = $.extend( {}, $.fn.autocomplete.options, settings );
    function show() {
      $.fn.autocomplete.element.removeClass(options.hidingClass);
    }
    function hide() {
      $.fn.autocomplete.element.addClass(options.hidingClass);
      cache = [];
    }

    function populate(value, input, element) {
      input.val(value);
      hide();
    }

    function createList(data, input, element) {
      var op = $('<div/>');
      for (var i=0, len=Math.min(options.maxResults, data.length); i<len; i++) {
        if (typeof data[i] === 'string') {
          data[i] = {val: data[i]};
        }
        var item = typeof data[i].href === 'undefined'
          ? $('<div/>').attr('value', data[i].val)
                      .html(data[i].val)
                      .addClass('item')
          : $('<a/>').attr('href', data[i].href)
                    .attr('value', data[i].val)
                    .attr('acitem', true)
                    .html(data[i].val)
                    .addClass('item')
        if (typeof data[i].description !== 'undefined') {
          item.append($('<small/>').text(data[i].description));
        }
        op.append(item);
      }
      element.html(op.html());
      element.find('.item').mousedown(function() {
        populate($(this).attr('value'), input, element)
      });
      show();
      align(input, element);
    }

    var cache = [];
    function search(input, element) {
      if (xhr) xhr.abort();
      if (input.val().length >= options.minLength) {
        element.html('<i class="item loading">'+options.loadingString+'</i>');
        var term = input.val();
        if (options.cache && typeof cache[term] !== "undefined") {
          if (cache[term].length === 0) {
            hide();
          } else {
            createList(cache[term], input, element);
          }
        } else if (typeof options.handler !== "undefined") {
          options.handler(input.val(), function(data) {
            cache[term] = data;
            if (data.length === 0) {
              hide();
            } else {
              createList(data, input, element);
            }
          });
        }
        input.data('selected', -1);
      } else {
        hide();
      }
    }

    function align(input, element) {
      var offset = input[0].getBoundingClientRect();
      element.css({
        position: 'absolute',
        top: offset.top + offset.height,
        left: offset.left,
        maxWidth: offset.width * 2,
        minWidth: offset.width,
        zIndex: 50
      });
    }

    function setup(input, element) {
      if (typeof element === 'undefined') {
        element = $('<div/>')
          .addClass('autocomplete-results hidden')
          .text('<i class="item loading">'+options.loadingString+'</i>');
      }
      align(input, element);
      $('body').append(element);
      input.data('selected', -1);

      input.blur(function(e) {
        if (e.target.acitem) {
          setTimeout(hide, 10);
        } else {
          hide();
        }
      });
      input.click(function() {
        align(input, element);
        if (element.hasClass(options.hidingClass)) {
          search(input, element);
        }
      });
      input.focus(function() {
        align(input, element);
        if (element.hasClass(options.hidingClass)) {
          search(input, element);
        }
      });
      input.keyup(function(event) {
        if (event.ctrlKey) {
          return;
        }
        switch (event.which) {
          case 37:
          case 38:
          case 39:
          case 9:
          case 13: {
            return;
          }
          case 40: {
            if ($(this).data('selected') === -1) {
              search(input, element)
              return;
            }
          }
          default: {
            if (
              event.which === 8  ||   // backspace
              event.which === 46 ||   // delete
              (event.which >= 48 &&   // letters
               event.which <= 90) ||
              (event.which >= 96 &&   // numpad
               event.which <= 111)
            ) {
              search(input, element);
            }
          }
        }
      });
      input.keydown(function(event) {
        var element = $.fn.autocomplete.element;
        var position = $(this).data('selected');
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
            show();
            event.preventDefault();
            if (position < options.maxResults) {
              position++;
              element.find('.item.selected').removeClass('selected');
              element.find('.item:eq('+position+')').addClass('selected');
              $(this).data('selected', position);
            }
            break;
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
                populate(selected.attr('value'), $(this), element);
                element.find('.item.selected').removeClass('selected');
              }
            }
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
      if (!$.fn.autocomplete.element) {
        $.fn.autocomplete.element = setup(input);
      } else {
        setup(input, $.fn.autocomplete.element);
      }

      if (typeof settings === "string") {
        if (settings === "show") {
          show();
        } else if (settings === "hide") {
          hide();
        }
        return input;
      }

      return input;

    });
  };

  $.fn.autocomplete.element = false;
  $.fn.autocomplete.options = {
    ajaxDelay: 200,
    cache: true,
    hidingClass: 'hidden',
    highlight: true,
    loadingString: 'Loading...',
    maxResults: 20,
    minLength: 3,
    minResults: 1
  };

  var xhr = false;
  var timer = false;
  $.fn.autocomplete.ajax = function(ops) {
    if (timer) clearTimeout(timer);
    if (xhr) xhr.abort();
    timer = setTimeout(
      function() { xhr = $.ajax(ops); },
      $.fn.autocomplete.options.ajaxDelay
    );
  }

}( jQuery ));
