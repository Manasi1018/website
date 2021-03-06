

  }



  Tooltip.prototype.getDelegateOptions = function () {

    var options  = {}

    var defaults = this.getDefaults()



    this._options && $.each(this._options, function (key, value) {

      if (defaults[key] != value) options[key] = value

    })



    return options

  }



  Tooltip.prototype.enter = function (obj) {

    var self = obj instanceof this.constructor ?

      obj : $(obj.currentTarget).data('bs.' + this.type)



    if (!self) {

      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())

      $(obj.currentTarget).data('bs.' + this.type, self)

    }



    if (obj instanceof $.Event) {

      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true

    }



    if (self.tip().hasClass('in') || self.hoverState == 'in') {

      self.hoverState = 'in'

      return

    }



    clearTimeout(self.timeout)



    self.hoverState = 'in'



    if (!self.options.delay || !self.options.delay.show) return self.show()



    self.timeout = setTimeout(function () {

      if (self.hoverState == 'in') self.show()

    }, self.options.delay.show)

  }



  Tooltip.prototype.isInStateTrue = function () {

    for (var key in this.inState) {

      if (this.inState[key]) return true

    }



    return false

  }



  Tooltip.prototype.leave = function (obj) {

    var self = obj instanceof this.constructor ?

      obj : $(obj.currentTarget).data('bs.' + this.type)



    if (!self) {

      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())

      $(obj.currentTarget).data('bs.' + this.type, self)

    }



    if (obj instanceof $.Event) {

      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false

    }



    if (self.isInStateTrue()) return



    clearTimeout(self.timeout)



    self.hoverState = 'out'



    if (!self.options.delay || !self.options.delay.hide) return self.hide()



    self.timeout = setTimeout(function () {

      if (self.hoverState == 'out') self.hide()

    }, self.options.delay.hide)

  }



  Tooltip.prototype.show = function () {

    var e = $.Event('show.bs.' + this.type)



    if (this.hasContent() && this.enabled) {

      this.$element.trigger(e)



      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])

      if (e.isDefaultPrevented() || !inDom) return

      var that = this



      var $tip = this.tip()



      var tipId = this.getUID(this.type)



      this.setContent()

      $tip.attr('id', tipId)

      this.$element.attr('aria-describedby', tipId)



      if (this.options.animation) $tip.addClass('fade')



      var placement = typeof this.options.placement == 'function' ?

        this.options.placement.call(this, $tip[0], this.$element[0]) :

        this.options.placement



      var autoToken = /\s?auto?\s?/i

      var autoPlace = autoToken.test(placement)

      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'



      $tip

        .detach()

        .css({ top: 0, left: 0, display: 'block' })

        .addClass(placement)

        .data('bs.' + this.type, this)



      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

      this.$element.trigger('inserted.bs.' + this.type)



      var pos          = this.getPosition()

      var actualWidth  = $tip[0].offsetWidth

      var actualHeight = $tip[0].offsetHeight



      if (autoPlace) {

        var orgPlacement = placement

        var viewportDim = this.getPosition(this.$viewport)



        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top'    :

                    placement == 'top'    && pos.top    - actualHeight < viewportDim.top    ? 'bottom' :

                    placement == 'right'  && pos.right  + actualWidth  > viewportDim.width  ? 'left'   :

                    placement == 'left'   && pos.left   - actualWidth  < viewportDim.left   ? 'right'  :

                    placement



        $tip

          .removeClass(orgPlacement)

          .addClass(placement)

      }



      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)



      this.applyPlacement(calculatedOffset, placement)



      var complete = function () {

        var prevHoverState = that.hoverState

        that.$element.trigger('shown.bs.' + that.type)

        that.hoverState = null



        if (prevHoverState == 'out') that.leave(that)

      }



      $.support.transition && this.$tip.hasClass('fade') ?

        $tip

          .one('bsTransitionEnd', complete)

          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :

        complete()

    }

  }



  Tooltip.prototype.applyPlacement = function (offset, placement) {

    var $tip   = this.tip()

    var width  = $tip[0].offsetWidth

    var height = $tip[0].offsetHeight



    // manually read margins because getBoundingClientRect includes difference

    var marginTop = parseInt($tip.css('margin-top'), 10)

    var marginLeft = parseInt($tip.css('margin-left'), 10)



    // we must check for NaN for ie 8/9

    if (isNaN(marginTop))  marginTop  = 0

    if (isNaN(marginLeft)) marginLeft = 0



    offset.top  += marginTop

    offset.left += marginLeft



    // $.fn.offset doesn't round pixel values

    // so we use setOffset directly with our own function B-0

    $.offset.setOffset($tip[0], $.extend({

      using: function (props) {

        $tip.css({

          top: Math.round(props.top),

          left: Math.round(props.left)

        })

      }

    }, offset), 0)



    $tip.addClass('in')



    // check to see if placing tip in new offset caused the tip to resize itself

    var actualWidth  = $tip[0].offsetWidth

    var actualHeight = $tip[0].offsetHeight



    if (placement == 'top' && actualHeight != height) {

      offset.top = offset.top + height - actualHeight

    }



    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)



    if (delta.left) offset.left += delta.left

    else offset.top += delta.top



    var isVertical          = /top|bottom/.test(placement)

    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight

    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'



    $tip.offset(offset)

    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)

  }



  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {

    this.arrow()

      .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')

      .css(isVertical ? 'top' : 'left', '')

  }



  Tooltip.prototype.setContent = function () {

    var $tip  = this.tip()

    var title = this.getTitle()



    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)

    $tip.removeClass('fade in top bottom left right')

  }



  Tooltip.prototype.hide = function (callback) {

    var that = this

    var $tip = $(this.$tip)

    var e    = $.Event('hide.bs.' + this.type)



    function complete() {

      if (that.hoverState != 'in') $tip.detach()

      that.$element

        .removeAttr('aria-describedby')

        .trigger('hidden.bs.' + that.type)

      callback && callback()

    }



    this.$element.trigger(e)



    if (e.isDefaultPrevented()) return



    $tip.removeClass('in')



    $.support.transition && $tip.hasClass('fade') ?

      $tip

        .one('bsTransitionEnd', complete)

        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :

      complete()



    this.hoverState = null



    return this

  }



  Tooltip.prototype.fixTitle = function () {

    var $e = this.$element

    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {

      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')

    }

  }



  Tooltip.prototype.hasContent = function () {

    return this.getTitle()

  }



  Tooltip.prototype.getPosition = function ($element) {

    $element   = $element || this.$element



    var el     = $element[0]

    var isBody = el.tagName == 'BODY'



    var elRect    = el.getBoundingClientRect()

    if (elRect.width == null) {

      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093

      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })

    }

    var elOffset  = isBody ? { top: 0, left: 0 } : $element.offset()

    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }

    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null



    return $.extend({}, elRect, scroll, outerDims, elOffset)

  }



  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {

    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :

           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :

           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :

        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }



  }



  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {

    var delta = { top: 0, left: 0 }

    if (!this.$viewport) return delta



    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0

    var viewportDimensions = this.getPosition(this.$viewport)



    if (/right|left/.test(placement)) {

      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll

      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight

      if (topEdgeOffset < viewportDimensions.top) { // top overflow

        delta.top = viewportDimensions.top - topEdgeOffset

      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow

        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset

      }

    } else {

      var leftEdgeOffset  = pos.left - viewportPadding

      var rightEdgeOffset = pos.left + viewportPadding + actualWidth

      if (leftEdgeOffset < viewportDimensions.left) { // left overflow

        delta.left = viewportDimensions.left - leftEdgeOffset

      } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow

        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset

      }

    }



    return delta

  }



  Tooltip.prototype.getTitle = function () {

    var title

    var $e = this.$element

    var o  = this.options



    title = $e.attr('data-original-title')

      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)



    return title

  }



  Tooltip.prototype.getUID = function (prefix) {

    do prefix += ~~(Math.random() * 1000000)

    while (document.getElementById(prefix))

    return prefix

  }



  Tooltip.prototype.tip = function () {

    if (!this.$tip) {

      this.$tip = $(this.options.template)

      if (this.$tip.length != 1) {

        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')

      }

    }

    return this.$tip

  }



  Tooltip.prototype.arrow = function () {

    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))

  }



  Tooltip.prototype.enable = function () {

    this.enabled = true

  }



  Tooltip.prototype.disable = function () {

    this.enabled = false

  }



  Tooltip.prototype.toggleEnabled = function () {

    this.enabled = !this.enabled

  }



  Tooltip.prototype.toggle = function (e) {

    var self = this

    if (e) {

      self = $(e.currentTarget).data('bs.' + this.type)

      if (!self) {

        self = new this.constructor(e.currentTarget, this.getDelegateOptions())

        $(e.currentTarget).data('bs.' + this.type, self)

      }

    }



    if (e) {

      self.inState.click = !self.inState.click

      if (self.isInStateTrue()) self.enter(self)

      else self.leave(self)

    } else {

      self.tip().hasClass('in') ? self.leave(self) : self.enter(self)

    }

  }



  Tooltip.prototype.destroy = function () {

    var that = this

    clearTimeout(this.timeout)

    this.hide(function () {

      that.$element.off('.' + that.type).removeData('bs.' + that.type)

      if (that.$tip) {

        that.$tip.detach()

      }

      that.$tip = null

      that.$arrow = null

      that.$viewport = null

    })

  }





  // TOOLTIP PLUGIN DEFINITION

  // =========================



  function Plugin(option) {

    return this.each(function () {

      var $this   = $(this)

      var data    = $this.data('bs.tooltip')

      var options = typeof option == 'object' && option



      if (!data && /destroy|hide/.test(option)) return

      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))

      if (typeof option == 'string') data[option]()

    })

  }



  var old = $.fn.tooltip



  $.fn.tooltip             = Plugin

  $.fn.tooltip.Constructor = Tooltip





  // TOOLTIP NO CONFLICT

  // ===================



  $.fn.tooltip.noConflict = function () {

    $.fn.tooltip = old

    return this

  }



}(jQuery);



/* ========================================================================

 * Bootstrap: popover.js v3.3.6

 * http://getbootstrap.com/javascript/#popovers

 * ========================================================================

 * Copyright 2011-2015 Twitter, Inc.

 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)

 * ======================================================================== */





+function ($) {

  'use strict';



  // POPOVER PUBLIC CLASS DEFINITION

  // ===============================



  var Popover = function (element, options) {

    this.init('popover', element, options)

  }



  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')



  Popover.VERSION  = '3.3.6'



  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {

    placement: 'right',

    trigger: 'click',

    content: '',

    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'

  })





  // NOTE: POPOVER EXTENDS tooltip.js

  // ================================



  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)



  Popover.prototype.constructor = Popover



  Popover.prototype.getDefaults = function () {

    return Popover.DEFAULTS

  }



  Popover.prototype.setContent = function () {

    var $tip    = this.tip()

    var title   = this.getTitle()

    var content = this.getContent()



    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)

    $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events

      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'

    ](content)



    $tip.removeClass('fade top bottom left right in')



    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do

    // this manually by checking the contents.

    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()

  }



  Popover.prototype.hasContent = function () {

    return this.getTitle() || this.getContent()

  }



  Popover.prototype.getContent = function () {

    var $e = this.$element

    var o  = this.options



    return $e.attr('data-content')

      || (typeof o.content == 'function' ?

            o.content.call($e[0]) :

            o.content)

  }



  Popover.prototype.arrow = function () {

    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))

  }





  // POPOVER PLUGIN DEFINITION

  // =========================



  function Plugin(option) {

    return this.each(function () {

      var $this   = $(this)

      var data    = $this.data('bs.popover')

      var options = typeof option == 'object' && option



      if (!data && /destroy|hide/.test(option)) return

      if (!data) $this.data('bs.popover', (data = new Popover(this, options)))

      if (typeof option == 'string') data[option]()

    })

  }



  var old = $.fn.popover



  $.fn.popover             = Plugin

  $.fn.popover.Constructor = Popover





  // POPOVER NO CONFLICT

  // ===================



  $.fn.popover.noConflict = function () {

    $.fn.popover = old

    return this

  }



}(jQuery);



/* ========================================================================

 * Bootstrap: scrollspy.js v3.3.6

 * http://getbootstrap.com/javascript/#scrollspy

 * ========================================================================

 * Copyright 2011-2015 Twitter, Inc.

 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)

 * ======================================================================== */





+function ($) {

  'use strict';



  // SCROLLSPY CLASS DEFINITION

  // ==========================



  function ScrollSpy(element, options) {

    this.$body          = $(document.body)

    this.$scrollElement = $(element).is(document.body) ? $(window) : $(element)

    this.options        = $.extend({}, ScrollSpy.DEFAULTS, options)

    this.selector       = (this.options.target || '') + ' .nav li > a'

    this.offsets        = []

    this.targets        = []

    this.activeTarget   = null

    this.scrollHeight   = 0



    this.$scrollElement.on('scroll.bs.scrollspy', $.proxy(this.process, this))

    this.refresh()

    this.process()

  }



  ScrollSpy.VERSION  = '3.3.6'



  ScrollSpy.DEFAULTS = {

    offset: 10

  }



  ScrollSpy.prototype.getScrollHeight = function () {

    return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight)

  }



  ScrollSpy.prototype.refresh = function () {

    var that          = this

    var offsetMethod  = 'offset'

    var offsetBase    = 0



    this.offsets      = []

    this.targets      = []

    this.scrollHeight = this.getScrollHeight()



    if (!$.isWindow(this.$scrollElement[0])) {

      offsetMethod = 'position'

      offsetBase   = this.$scrollElement.scrollTop()

    }



    this.$body

      .find(this.selector)

      .map(function () {

        var $el   = $(this)

        var href  = $el.data('target') || $el.attr('href')

        var $href = /^#./.test(href) && $(href)



        return ($href

          && $href.length

          && $href.is(':visible')

          && [[$href[offsetMethod]().top + offsetBase, href]]) || null

      })

      .sort(function (a, b) { return a[0] - b[0] })

      .each(function () {

        that.offsets.push(this[0])

        that.targets.push(this[1])

      })

  }



  ScrollSpy.prototype.process = function () {

    var scrollTop    = this.$scrollElement.scrollTop() + this.options.offset

    var scrollHeight = this.getScrollHeight()

    var maxScroll    = this.options.offset + scrollHeight - this.$scrollElement.height()

    var offsets      = this.offsets

    var targets      = this.targets

    var activeTarget = this.activeTarget

    var i



    if (this.scrollHeight != scrollHeight) {

      this.refresh()

    }



    if (scrollTop >= maxScroll) {

      return activeTarget != (i = targets[targets.length - 1]) && this.activate(i)

    }



    if (activeTarget && scrollTop < offsets[0]) {

      this.activeTarget = null

      return this.clear()

    }



    for (i = offsets.length; i--;) {

      activeTarget != targets[i]

        && scrollTop >= offsets[i]

        && (offsets[i + 1] === undefined || scrollTop < offsets[i + 1])

        && this.activate(targets[i])

    }

  }



  ScrollSpy.prototype.activate = function (target) {

    this.activeTarget = target



    this.clear()



    var selector = this.selector +

      '[data-target="' + target + '"],' +

      this.selector + '[href="' + target + '"]'



    var active = $(selector)

      .parents('li')

      .addClass('active')



    if (active.parent('.dropdown-menu').length) {

      active = active

        .closest('li.dropdown')

        .addClass('active')

    }



    active.trigger('activate.bs.scrollspy')

  }



  ScrollSpy.prototype.clear = function () {

    $(this.selector)

      .parentsUntil(this.options.target, '.active')

      .removeClass('active')

  }





  // SCROLLSPY PLUGIN DEFINITION

  // ===========================



  function Plugin(option) {

    return this.each(function () {

      var $this   = $(this)

      var data    = $this.data('bs.scrollspy')

      var options = typeof option == 'object' && option



      if (!data) $this.data('bs.scrollspy', (data = new ScrollSpy(this, options)))

      if (typeof option == 'string') data[option]()

    })

  }



  var old = $.fn.scrollspy



  $.fn.scrollspy             = Plugin

  $.fn.scrollspy.Constructor = ScrollSpy





  // SCROLLSPY NO CONFLICT

  // =====================



  $.fn.scrollspy.noConflict = function () {

    $.fn.scrollspy = old

    return this

  }





  // SCROLLSPY DATA-API

  // ==================



  $(window).on('load.bs.scrollspy.data-api', function () {

    $('[data-spy="scroll"]').each(function () {

      var $spy = $(this)

      Plugin.call($spy, $spy.data())

    })

  })



}(jQuery);



/* ========================================================================

 * Bootstrap: tab.js v3.3.6

 * http://getbootstrap.com/javascript/#tabs

 * ========================================================================

 * Copyright 2011-2015 Twitter, Inc.

 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)

 * ======================================================================== */





+function ($) {

  'use strict';



  // TAB CLASS DEFINITION

  // ====================



  var Tab = function (element) {

    // jscs:disable requireDollarBeforejQueryAssignment

    this.element = $(element)

    // jscs:enable requireDollarBeforejQueryAssignment

  }



  Tab.VERSION = '3.3.6'



  Tab.TRANSITION_DURATION = 150



  Tab.prototype.show = function () {

    var $this    = this.element

    var $ul      = $this.closest('ul:not(.dropdown-menu)')

    var selector = $this.data('target')



    if (!selector) {

      selector = $this.attr('href')

      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7

    }



    if ($this.parent('li').hasClass('active')) return



    var $previous = $ul.find('.active:last a')

    var hideEvent = $.Event('hide.bs.tab', {

      relatedTarget: $this[0]

    })

    var showEvent = $.Event('show.bs.tab', {

      relatedTarget: $previous[0]

    })



    $previous.trigger(hideEvent)

    $this.trigger(showEvent)



    if (showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return



    var $target = $(selector)



    this.activate($this.closest('li'), $ul)

    this.activate($target, $target.parent(), function () {

      $previous.trigger({

        type: 'hidden.bs.tab',

        relatedTarget: $this[0]

      })

      $this.trigger({

        type: 'shown.bs.tab',

        relatedTarget: $previous[0]

      })

    })

  }



  Tab.prototype.activate = function (element, container, callback) {

    var $active    = container.find('> .active')

    var transition = callback

      && $.support.transition

      && ($active.length && $active.hasClass('fade') || !!container.find('> .fade').length)



    function next() {

      $active

        .removeClass('active')

        .find('> .dropdown-menu > .active')

          .removeClass('active')

        .end()

        .find('[data-toggle="tab"]')

          .attr('aria-expanded', false)



      element

        .addClass('active')

        .find('[data-toggle="tab"]')

          .attr('aria-expanded', true)



      if (transition) {

        element[0].offsetWidth // reflow for transition

        element.addClass('in')

      } else {

        element.removeClass('fade')

      }



      if (element.parent('.dropdown-menu').length) {

        element

          .closest('li.dropdown')

            .addClass('active')

          .end()

          .find('[data-toggle="tab"]')

            .attr('aria-expanded', true)

      }



      callback && callback()

    }



    $active.length && transition ?

      $active

        .one('bsTransitionEnd', next)

        .emulateTransitionEnd(Tab.TRANSITION_DURATION) :

      next()



    $active.removeClass('in')

  }





  // TAB PLUGIN DEFINITION

  // =====================



  function Plugin(option) {

    return this.each(function () {

      var $this = $(this)

      var data  = $this.data('bs.tab')



      if (!data) $this.data('bs.tab', (data = new Tab(this)))

      if (typeof option == 'string') data[option]()

    })

  }



  var old = $.fn.tab



  $.fn.tab             = Plugin

  $.fn.tab.Constructor = Tab





  // TAB NO CONFLICT

  // ===============



  $.fn.tab.noConflict = function () {

    $.fn.tab = old

    return this

  }





  // TAB DATA-API

  // ============



  var clickHandler = function (e) {

    e.preventDefault()

    Plugin.call($(this), 'show')

  }



  $(document)

    .on('click.bs.tab.data-api', '[data-toggle="tab"]', clickHandler)

    .on('click.bs.tab.data-api', '[data-toggle="pill"]', clickHandler)



}(jQuery);



/* ========================================================================

 * Bootstrap: affix.js v3.3.6

 * http://getbootstrap.com/javascript/#affix

 * ========================================================================

 * Copyright 2011-2015 Twitter, Inc.

 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)

 * ======================================================================== */





+function ($) {

  'use strict';



  // AFFIX CLASS DEFINITION

  // ======================



  var Affix = function (element, options) {

    this.options = $.extend({}, Affix.DEFAULTS, options)



    this.$target = $(this.options.target)

      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))

      .on('click.bs.affix.data-api',  $.proxy(this.checkPositionWithEventLoop, this))



    this.$element     = $(element)

    this.affixed      = null

    this.unpin        = null

    this.pinnedOffset = null



    this.checkPosition()

  }



  Affix.VERSION  = '3.3.6'



  Affix.RESET    = 'affix affix-top affix-bottom'



  Affix.DEFAULTS = {

    offset: 0,

    target: window

  }



  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {

    var scrollTop    = this.$target.scrollTop()

    var position     = this.$element.offset()

    var targetHeight = this.$target.height()



    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false



    if (this.affixed == 'bottom') {

      if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'

      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'

    }



    var initializing   = this.affixed == null

    var colliderTop    = initializing ? scrollTop : position.top

    var colliderHeight = initializing ? targetHeight : height



    if (offsetTop != null && scrollTop <= offsetTop) return 'top'

    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'



    return false

  }



  Affix.prototype.getPinnedOffset = function () {

    if (this.pinnedOffset) return this.pinnedOffset

    this.$element.removeClass(Affix.RESET).addClass('affix')

    var scrollTop = this.$target.scrollTop()

    var position  = this.$element.offset()

    return (this.pinnedOffset = position.top - scrollTop)

  }



  Affix.prototype.checkPositionWithEventLoop = function () {

    setTimeout($.proxy(this.checkPosition, this), 1)

  }



  Affix.prototype.checkPosition = function () {

    if (!this.$element.is(':visible')) return



    var height       = this.$element.height()

    var offset       = this.options.offset

    var offsetTop    = offset.top

    var offsetBottom = offset.bottom

    var scrollHeight = Math.max($(document).height(), $(document.body).height())



    if (typeof offset != 'object')         offsetBottom = offsetTop = offset

    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element)

    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)



    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)



    if (this.affixed != affix) {

      if (this.unpin != null) this.$element.css('top', '')



      var affixType = 'affix' + (affix ? '-' + affix : '')

      var e         = $.Event(affixType + '.bs.affix')



      this.$element.trigger(e)



      if (e.isDefaultPrevented()) return



      this.affixed = affix

      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null



      this.$element

        .removeClass(Affix.RESET)

        .addClass(affixType)

        .trigger(affixType.replace('affix', 'affixed') + '.bs.affix')

    }



    if (affix == 'bottom') {

      this.$element.offset({

        top: scrollHeight - height - offsetBottom

      })

    }

  }





  // AFFIX PLUGIN DEFINITION

  // =======================



  function Plugin(option) {

    return this.each(function () {

      var $this   = $(this)

      var data    = $this.data('bs.affix')

      var options = typeof option == 'object' && option



      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))

      if (typeof option == 'string') data[option]()

    })

  }



  var old = $.fn.affix



  $.fn.affix             = Plugin

  $.fn.affix.Constructor = Affix





  // AFFIX NO CONFLICT

  // =================



  $.fn.affix.noConflict = function () {

    $.fn.affix = old

    return this

  }





  // AFFIX DATA-API

  // ==============



  $(window).on('load', function () {

    $('[data-spy="affix"]').each(function () {

      var $spy = $(this)

      var data = $spy.data()



      data.offset = data.offset || {}



      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom

      if (data.offsetTop    != null) data.offset.top    = data.offsetTop



      Plugin.call($spy, data)

    })

  })



}(jQuery);