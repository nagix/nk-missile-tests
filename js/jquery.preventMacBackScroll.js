//
// Prevent horizontal scroll for Back page in Mac 10.7+
//
// Mac OSX Lion introduces a nasty behavior: when you are scrolling and
// the element (or its parents) are no longer scrollable, then horizontal
// scrolling with two fingers will trigger back page or next page.
//
// For now this plugin provides a way to prevent that behavior for Chrome
// in the case you're scrolling up or left where you can't scroll anymore,
// which triggers back/next page.
//
// Supported browsers: Mac OSX Chrome, Mac OSX Safari, Mac OSX Firefox
// On all other browsers this script won't do anything
//
// Depends on: jQuery 1.2.6+
// Depends on: jquery.mousewheel.js
//
// by Pablo Villalba for http://teambox.com
//
// Licensed under the MIT License
//

(function ($) {

  // This code is only valid for Mac
  if (!navigator.userAgent.match(/Macintosh/)) {
    return;
  }

  // Detect browsers
  // http://stackoverflow.com/questions/5899783/detect-safari-using-jquery
  var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
  var is_safari = navigator.userAgent.indexOf("Safari") > -1;
  var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;

  // Handle scroll events in Chrome, Safari, and Firefox
  if (is_chrome || is_safari || is_firefox) {

    // TODO: This only prevents scroll when reaching the topmost or leftmost
    // positions of a container. It doesn't handle rightmost or bottom,
    // and Lion scroll can be triggered by scrolling right (or bottom) and then
    // scrolling left without raising your fingers from the scroll position.
    $(window).on('mousewheel', function (e) {

      var prevent_left, prevent_up;

      // If none of the parents can be scrolled left when we try to scroll left
      prevent_left = e.deltaX < 0 && $(e.target).parents().filter(function() {
        return $(this).scrollLeft() > 0;
      }).length === 0;


      // If none of the parents can be scrolled up when we try to scroll up
      prevent_up = e.deltaY > 0 && !$(e.target).parents().filter(function() {
        return $(this).scrollTop() > 0;
      }).length === 0;

      // Prevent futile scroll, which would trigger the Back/Next page event
      if (prevent_left || prevent_up) {
        e.preventDefault();
      }
    });

  }

}(jQuery));
