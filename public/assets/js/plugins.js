/*!
 * Datepicker for Bootstrap v1.7.0-dev (https://github.com/uxsolutions/bootstrap-datepicker)
 *
 * Licensed under the Apache License v2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 */

(function(factory) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(function($, undefined) {
    function UTCDate() {
        return new Date(Date.UTC.apply(Date, arguments));
    }

    function UTCToday() {
        var today = new Date();
        return UTCDate(today.getFullYear(), today.getMonth(), today.getDate());
    }

    function isUTCEquals(date1, date2) {
        return (
            date1.getUTCFullYear() === date2.getUTCFullYear() &&
            date1.getUTCMonth() === date2.getUTCMonth() &&
            date1.getUTCDate() === date2.getUTCDate()
        );
    }

    function alias(method, deprecationMsg) {
        return function() {
            if (deprecationMsg !== undefined) {
                $.fn.datepicker.deprecated(deprecationMsg);
            }

            return this[method].apply(this, arguments);
        };
    }

    function isValidDate(d) {
        return d && !isNaN(d.getTime());
    }

    var DateArray = (function() {
        var extras = {
            get: function(i) {
                return this.slice(i)[0];
            },
            contains: function(d) {
                // Array.indexOf is not cross-browser;
                // $.inArray doesn't work with Dates
                var val = d && d.valueOf();
                for (var i = 0, l = this.length; i < l; i++)
                    // Use date arithmetic to allow dates with different times to match
                    if (0 <= this[i].valueOf() - val && this[i].valueOf() - val < 1000 * 60 * 60 * 24)
                        return i;
                return -1;
            },
            remove: function(i) {
                this.splice(i, 1);
            },
            replace: function(new_array) {
                if (!new_array)
                    return;
                if (!$.isArray(new_array))
                    new_array = [new_array];
                this.clear();
                this.push.apply(this, new_array);
            },
            clear: function() {
                this.length = 0;
            },
            copy: function() {
                var a = new DateArray();
                a.replace(this);
                return a;
            }
        };

        return function() {
            var a = [];
            a.push.apply(a, arguments);
            $.extend(a, extras);
            return a;
        };
    })();


    // Picker object

    var Datepicker = function(element, options) {
        $.data(element, 'datepicker', this);
        this._process_options(options);

        this.dates = new DateArray();
        this.viewDate = this.o.defaultViewDate;
        this.focusDate = null;

        this.element = $(element);
        this.isInput = this.element.is('input');
        this.inputField = this.isInput ? this.element : this.element.find('input');
        this.component = this.element.hasClass('date') ? this.element.find('.add-on, .input-group-addon, .btn') : false;
        if (this.component && this.component.length === 0)
            this.component = false;
        this.isInline = !this.component && this.element.is('div');

        this.picker = $(DPGlobal.template);

        // Checking templates and inserting
        if (this._check_template(this.o.templates.leftArrow)) {
            this.picker.find('.prev').html(this.o.templates.leftArrow);
        }

        if (this._check_template(this.o.templates.rightArrow)) {
            this.picker.find('.next').html(this.o.templates.rightArrow);
        }

        this._buildEvents();
        this._attachEvents();

        if (this.isInline) {
            this.picker.addClass('datepicker-inline').appendTo(this.element);
        } else {
            this.picker.addClass('datepicker-dropdown dropdown-menu');
        }

        if (this.o.rtl) {
            this.picker.addClass('datepicker-rtl');
        }

        if (this.o.calendarWeeks) {
            this.picker.find('.datepicker-days .datepicker-switch, thead .datepicker-title, tfoot .today, tfoot .clear')
                .attr('colspan', function(i, val) {
                    return Number(val) + 1;
                });
        }

        this._process_options({
            startDate: this._o.startDate,
            endDate: this._o.endDate,
            daysOfWeekDisabled: this.o.daysOfWeekDisabled,
            daysOfWeekHighlighted: this.o.daysOfWeekHighlighted,
            datesDisabled: this.o.datesDisabled
        });

        this._allow_update = false;
        this.setViewMode(this.o.startView);
        this._allow_update = true;

        this.fillDow();
        this.fillMonths();

        this.update();

        if (this.isInline) {
            this.show();
        }
    };

    Datepicker.prototype = {
        constructor: Datepicker,

        _resolveViewName: function(view) {
            $.each(DPGlobal.viewModes, function(i, viewMode) {
                if (view === i || $.inArray(view, viewMode.names) !== -1) {
                    view = i;
                    return false;
                }
            });

            return view;
        },

        _resolveDaysOfWeek: function(daysOfWeek) {
            if (!$.isArray(daysOfWeek))
                daysOfWeek = daysOfWeek.split(/[,\s]*/);
            return $.map(daysOfWeek, Number);
        },

        _check_template: function(tmp) {
            try {
                // If empty
                if (tmp === undefined || tmp === "") {
                    return false;
                }
                // If no html, everything ok
                if ((tmp.match(/[<>]/g) || []).length <= 0) {
                    return true;
                }
                // Checking if html is fine
                var jDom = $(tmp);
                return jDom.length > 0;
            } catch (ex) {
                return false;
            }
        },

        _process_options: function(opts) {
            // Store raw options for reference
            this._o = $.extend({}, this._o, opts);
            // Processed options
            var o = this.o = $.extend({}, this._o);

            // Check if "de-DE" style date is available, if not language should
            // fallback to 2 letter code eg "de"
            var lang = o.language;
            if (!dates[lang]) {
                lang = lang.split('-')[0];
                if (!dates[lang])
                    lang = defaults.language;
            }
            o.language = lang;

            // Retrieve view index from any aliases
            o.startView = this._resolveViewName(o.startView);
            o.minViewMode = this._resolveViewName(o.minViewMode);
            o.maxViewMode = this._resolveViewName(o.maxViewMode);

            // Check view is between min and max
            o.startView = Math.max(this.o.minViewMode, Math.min(this.o.maxViewMode, o.startView));

            // true, false, or Number > 0
            if (o.multidate !== true) {
                o.multidate = Number(o.multidate) || false;
                if (o.multidate !== false)
                    o.multidate = Math.max(0, o.multidate);
            }
            o.multidateSeparator = String(o.multidateSeparator);

            o.weekStart %= 7;
            o.weekEnd = (o.weekStart + 6) % 7;

            var format = DPGlobal.parseFormat(o.format);
            if (o.startDate !== -Infinity) {
                if (!!o.startDate) {
                    if (o.startDate instanceof Date)
                        o.startDate = this._local_to_utc(this._zero_time(o.startDate));
                    else
                        o.startDate = DPGlobal.parseDate(o.startDate, format, o.language, o.assumeNearbyYear);
                } else {
                    o.startDate = -Infinity;
                }
            }
            if (o.endDate !== Infinity) {
                if (!!o.endDate) {
                    if (o.endDate instanceof Date)
                        o.endDate = this._local_to_utc(this._zero_time(o.endDate));
                    else
                        o.endDate = DPGlobal.parseDate(o.endDate, format, o.language, o.assumeNearbyYear);
                } else {
                    o.endDate = Infinity;
                }
            }

            o.daysOfWeekDisabled = this._resolveDaysOfWeek(o.daysOfWeekDisabled || []);
            o.daysOfWeekHighlighted = this._resolveDaysOfWeek(o.daysOfWeekHighlighted || []);

            o.datesDisabled = o.datesDisabled || [];
            if (!$.isArray(o.datesDisabled)) {
                o.datesDisabled = o.datesDisabled.split(',');
            }
            o.datesDisabled = $.map(o.datesDisabled, function(d) {
                return DPGlobal.parseDate(d, format, o.language, o.assumeNearbyYear);
            });

            var plc = String(o.orientation).toLowerCase().split(/\s+/g),
                _plc = o.orientation.toLowerCase();
            plc = $.grep(plc, function(word) {
                return /^auto|left|right|top|bottom$/.test(word);
            });
            o.orientation = {
                x: 'auto',
                y: 'auto'
            };
            if (!_plc || _plc === 'auto')
            ; // no action
            else if (plc.length === 1) {
                switch (plc[0]) {
                    case 'top':
                    case 'bottom':
                        o.orientation.y = plc[0];
                        break;
                    case 'left':
                    case 'right':
                        o.orientation.x = plc[0];
                        break;
                }
            } else {
                _plc = $.grep(plc, function(word) {
                    return /^left|right$/.test(word);
                });
                o.orientation.x = _plc[0] || 'auto';

                _plc = $.grep(plc, function(word) {
                    return /^top|bottom$/.test(word);
                });
                o.orientation.y = _plc[0] || 'auto';
            }
            if (o.defaultViewDate instanceof Date || typeof o.defaultViewDate === 'string') {
                o.defaultViewDate = DPGlobal.parseDate(o.defaultViewDate, format, o.language, o.assumeNearbyYear);
            } else if (o.defaultViewDate) {
                var year = o.defaultViewDate.year || new Date().getFullYear();
                var month = o.defaultViewDate.month || 0;
                var day = o.defaultViewDate.day || 1;
                o.defaultViewDate = UTCDate(year, month, day);
            } else {
                o.defaultViewDate = UTCToday();
            }
        },
        _events: [],
        _secondaryEvents: [],
        _applyEvents: function(evs) {
            for (var i = 0, el, ch, ev; i < evs.length; i++) {
                el = evs[i][0];
                if (evs[i].length === 2) {
                    ch = undefined;
                    ev = evs[i][1];
                } else if (evs[i].length === 3) {
                    ch = evs[i][1];
                    ev = evs[i][2];
                }
                el.on(ev, ch);
            }
        },
        _unapplyEvents: function(evs) {
            for (var i = 0, el, ev, ch; i < evs.length; i++) {
                el = evs[i][0];
                if (evs[i].length === 2) {
                    ch = undefined;
                    ev = evs[i][1];
                } else if (evs[i].length === 3) {
                    ch = evs[i][1];
                    ev = evs[i][2];
                }
                el.off(ev, ch);
            }
        },
        _buildEvents: function() {
            var events = {
                keyup: $.proxy(function(e) {
                    if ($.inArray(e.keyCode, [27, 37, 39, 38, 40, 32, 13, 9]) === -1)
                        this.update();
                }, this),
                keydown: $.proxy(this.keydown, this),
                paste: $.proxy(this.paste, this)
            };

            if (this.o.showOnFocus === true) {
                events.focus = $.proxy(this.show, this);
            }

            if (this.isInput) { // single input
                this._events = [
                    [this.element, events]
                ];
            }
            // component: input + button
            else if (this.component && this.inputField.length) {
                this._events = [
                    // For components that are not readonly, allow keyboard nav
                    [this.inputField, events],
                    [this.component, {
                        click: $.proxy(this.show, this)
                    }]
                ];
            } else {
                this._events = [
                    [this.element, {
                        click: $.proxy(this.show, this),
                        keydown: $.proxy(this.keydown, this)
                    }]
                ];
            }
            this._events.push(
                // Component: listen for blur on element descendants
                [this.element, '*', {
                    blur: $.proxy(function(e) {
                        this._focused_from = e.target;
                    }, this)
                }],
                // Input: listen for blur on element
                [this.element, {
                    blur: $.proxy(function(e) {
                        this._focused_from = e.target;
                    }, this)
                }]
            );

            if (this.o.immediateUpdates) {
                // Trigger input updates immediately on changed year/month
                this._events.push([this.element, {
                    'changeYear changeMonth': $.proxy(function(e) {
                        this.update(e.date);
                    }, this)
                }]);
            }

            this._secondaryEvents = [
                [this.picker, {
                    click: $.proxy(this.click, this)
                }],
                [this.picker, '.prev, .next', {
                    click: $.proxy(this.navArrowsClick, this)
                }],
                [$(window), {
                    resize: $.proxy(this.place, this)
                }],
                [$(document), {
                    'mousedown touchstart': $.proxy(function(e) {
                        // Clicked outside the datepicker, hide it
                        if (!(
                                this.element.is(e.target) ||
                                this.element.find(e.target).length ||
                                this.picker.is(e.target) ||
                                this.picker.find(e.target).length ||
                                this.isInline
                            )) {
                            this.hide();
                        }
                    }, this)
                }]
            ];
        },
        _attachEvents: function() {
            this._detachEvents();
            this._applyEvents(this._events);
        },
        _detachEvents: function() {
            this._unapplyEvents(this._events);
        },
        _attachSecondaryEvents: function() {
            this._detachSecondaryEvents();
            this._applyEvents(this._secondaryEvents);
        },
        _detachSecondaryEvents: function() {
            this._unapplyEvents(this._secondaryEvents);
        },
        _trigger: function(event, altdate) {
            var date = altdate || this.dates.get(-1),
                local_date = this._utc_to_local(date);

            this.element.trigger({
                type: event,
                date: local_date,
                viewMode: this.viewMode,
                dates: $.map(this.dates, this._utc_to_local),
                format: $.proxy(function(ix, format) {
                    if (arguments.length === 0) {
                        ix = this.dates.length - 1;
                        format = this.o.format;
                    } else if (typeof ix === 'string') {
                        format = ix;
                        ix = this.dates.length - 1;
                    }
                    format = format || this.o.format;
                    var date = this.dates.get(ix);
                    return DPGlobal.formatDate(date, format, this.o.language);
                }, this)
            });
        },

        show: function() {
            if (this.inputField.prop('disabled') || (this.inputField.prop('readonly') && this.o.enableOnReadonly === false))
                return;
            if (!this.isInline)
                this.picker.appendTo(this.o.container);
            this.place();
            this.picker.show();
            this._attachSecondaryEvents();
            this._trigger('show');
            if ((window.navigator.msMaxTouchPoints || 'ontouchstart' in document) && this.o.disableTouchKeyboard) {
                $(this.element).blur();
            }
            return this;
        },

        hide: function() {
            if (this.isInline || !this.picker.is(':visible'))
                return this;
            this.focusDate = null;
            this.picker.hide().detach();
            this._detachSecondaryEvents();
            this.setViewMode(this.o.startView);

            if (this.o.forceParse && this.inputField.val())
                this.setValue();
            this._trigger('hide');
            return this;
        },

        destroy: function() {
            this.hide();
            this._detachEvents();
            this._detachSecondaryEvents();
            this.picker.remove();
            delete this.element.data().datepicker;
            if (!this.isInput) {
                delete this.element.data().date;
            }
            return this;
        },

        paste: function(e) {
            var dateString;
            if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.types &&
                $.inArray('text/plain', e.originalEvent.clipboardData.types) !== -1) {
                dateString = e.originalEvent.clipboardData.getData('text/plain');
            } else if (window.clipboardData) {
                dateString = window.clipboardData.getData('Text');
            } else {
                return;
            }
            this.setDate(dateString);
            this.update();
            e.preventDefault();
        },

        _utc_to_local: function(utc) {
            if (!utc) {
                return utc;
            }

            var local = new Date(utc.getTime() + (utc.getTimezoneOffset() * 60000));

            if (local.getTimezoneOffset() !== utc.getTimezoneOffset()) {
                local = new Date(utc.getTime() + (local.getTimezoneOffset() * 60000));
            }

            return local;
        },
        _local_to_utc: function(local) {
            return local && new Date(local.getTime() - (local.getTimezoneOffset() * 60000));
        },
        _zero_time: function(local) {
            return local && new Date(local.getFullYear(), local.getMonth(), local.getDate());
        },
        _zero_utc_time: function(utc) {
            return utc && UTCDate(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
        },

        getDates: function() {
            return $.map(this.dates, this._utc_to_local);
        },

        getUTCDates: function() {
            return $.map(this.dates, function(d) {
                return new Date(d);
            });
        },

        getDate: function() {
            return this._utc_to_local(this.getUTCDate());
        },

        getUTCDate: function() {
            var selected_date = this.dates.get(-1);
            if (selected_date !== undefined) {
                return new Date(selected_date);
            } else {
                return null;
            }
        },

        clearDates: function() {
            this.inputField.val('');
            this.update();
            this._trigger('changeDate');

            if (this.o.autoclose) {
                this.hide();
            }
        },

        setDates: function() {
            var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
            this.update.apply(this, args);
            this._trigger('changeDate');
            this.setValue();
            return this;
        },

        setUTCDates: function() {
            var args = $.isArray(arguments[0]) ? arguments[0] : arguments;
            this.setDates.apply(this, $.map(args, this._utc_to_local));
            return this;
        },

        setDate: alias('setDates'),
        setUTCDate: alias('setUTCDates'),
        remove: alias('destroy', 'Method `remove` is deprecated and will be removed in version 2.0. Use `destroy` instead'),

        setValue: function() {
            var formatted = this.getFormattedDate();
            this.inputField.val(formatted);
            return this;
        },

        getFormattedDate: function(format) {
            if (format === undefined)
                format = this.o.format;

            var lang = this.o.language;
            return $.map(this.dates, function(d) {
                return DPGlobal.formatDate(d, format, lang);
            }).join(this.o.multidateSeparator);
        },

        getStartDate: function() {
            return this.o.startDate;
        },

        setStartDate: function(startDate) {
            this._process_options({
                startDate: startDate
            });
            this.update();
            this.updateNavArrows();
            return this;
        },

        getEndDate: function() {
            return this.o.endDate;
        },

        setEndDate: function(endDate) {
            this._process_options({
                endDate: endDate
            });
            this.update();
            this.updateNavArrows();
            return this;
        },

        setDaysOfWeekDisabled: function(daysOfWeekDisabled) {
            this._process_options({
                daysOfWeekDisabled: daysOfWeekDisabled
            });
            this.update();
            return this;
        },

        setDaysOfWeekHighlighted: function(daysOfWeekHighlighted) {
            this._process_options({
                daysOfWeekHighlighted: daysOfWeekHighlighted
            });
            this.update();
            return this;
        },

        setDatesDisabled: function(datesDisabled) {
            this._process_options({
                datesDisabled: datesDisabled
            });
            this.update();
            return this;
        },

        place: function() {
            if (this.isInline)
                return this;
            var calendarWidth = this.picker.outerWidth(),
                calendarHeight = this.picker.outerHeight(),
                visualPadding = 10,
                container = $(this.o.container),
                windowWidth = container.width(),
                scrollTop = this.o.container === 'body' ? $(document).scrollTop() : container.scrollTop(),
                appendOffset = container.offset();

            var parentsZindex = [0];
            this.element.parents().each(function() {
                var itemZIndex = $(this).css('z-index');
                if (itemZIndex !== 'auto' && Number(itemZIndex) !== 0) parentsZindex.push(Number(itemZIndex));
            });
            var zIndex = Math.max.apply(Math, parentsZindex) + this.o.zIndexOffset;
            var offset = this.component ? this.component.parent().offset() : this.element.offset();
            var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(false);
            var width = this.component ? this.component.outerWidth(true) : this.element.outerWidth(false);
            var left = offset.left - appendOffset.left;
            var top = offset.top - appendOffset.top;

            if (this.o.container !== 'body') {
                top += scrollTop;
            }

            this.picker.removeClass(
                'datepicker-orient-top datepicker-orient-bottom ' +
                'datepicker-orient-right datepicker-orient-left'
            );

            if (this.o.orientation.x !== 'auto') {
                this.picker.addClass('datepicker-orient-' + this.o.orientation.x);
                if (this.o.orientation.x === 'right')
                    left -= calendarWidth - width;
            }
            // auto x orientation is best-placement: if it crosses a window
            // edge, fudge it sideways
            else {
                if (offset.left < 0) {
                    // component is outside the window on the left side. Move it into visible range
                    this.picker.addClass('datepicker-orient-left');
                    left -= offset.left - visualPadding;
                } else if (left + calendarWidth > windowWidth) {
                    // the calendar passes the widow right edge. Align it to component right side
                    this.picker.addClass('datepicker-orient-right');
                    left += width - calendarWidth;
                } else {
                    if (this.o.rtl) {
                        // Default to right
                        this.picker.addClass('datepicker-orient-right');
                    } else {
                        // Default to left
                        this.picker.addClass('datepicker-orient-left');
                    }
                }
            }

            // auto y orientation is best-situation: top or bottom, no fudging,
            // decision based on which shows more of the calendar
            var yorient = this.o.orientation.y,
                top_overflow;
            if (yorient === 'auto') {
                top_overflow = -scrollTop + top - calendarHeight;
                yorient = top_overflow < 0 ? 'bottom' : 'top';
            }

            this.picker.addClass('datepicker-orient-' + yorient);
            if (yorient === 'top')
                top -= calendarHeight + parseInt(this.picker.css('padding-top'));
            else
                top += height;

            if (this.o.rtl) {
                var right = windowWidth - (left + width);
                this.picker.css({
                    top: top,
                    right: right,
                    zIndex: zIndex
                });
            } else {
                this.picker.css({
                    top: top,
                    left: left,
                    zIndex: zIndex
                });
            }
            return this;
        },

        _allow_update: true,
        update: function() {
            if (!this._allow_update)
                return this;

            var oldDates = this.dates.copy(),
                dates = [],
                fromArgs = false;
            if (arguments.length) {
                $.each(arguments, $.proxy(function(i, date) {
                    if (date instanceof Date)
                        date = this._local_to_utc(date);
                    dates.push(date);
                }, this));
                fromArgs = true;
            } else {
                dates = this.isInput ?
                    this.element.val() :
                    this.element.data('date') || this.inputField.val();
                if (dates && this.o.multidate)
                    dates = dates.split(this.o.multidateSeparator);
                else
                    dates = [dates];
                delete this.element.data().date;
            }

            dates = $.map(dates, $.proxy(function(date) {
                return DPGlobal.parseDate(date, this.o.format, this.o.language, this.o.assumeNearbyYear);
            }, this));
            dates = $.grep(dates, $.proxy(function(date) {
                return (!this.dateWithinRange(date) ||
                    !date
                );
            }, this), true);
            this.dates.replace(dates);

            if (this.o.updateViewDate) {
                if (this.dates.length)
                    this.viewDate = new Date(this.dates.get(-1));
                else if (this.viewDate < this.o.startDate)
                    this.viewDate = new Date(this.o.startDate);
                else if (this.viewDate > this.o.endDate)
                    this.viewDate = new Date(this.o.endDate);
                else
                    this.viewDate = this.o.defaultViewDate;
            }

            if (fromArgs) {
                // setting date by clicking
                this.setValue();
                this.element.change();
            } else if (this.dates.length) {
                // setting date by typing
                if (typeof this.o.format === 'string') {
                    if ((String(this.element[0].value).length === String(this.o.format).length) && (String(oldDates) !== String(this.dates)))
                        this._trigger('changeDate');
                    this.element.change();
                } else if (String(oldDates) !== String(this.dates)) {
                    this._trigger('changeDate');
                    this.element.change();
                }
            }
            if (!this.dates.length && oldDates.length) {
                this._trigger('clearDate');
                this.element.change();
            }

            this.fill();
            return this;
        },

        fillDow: function() {
            var dowCnt = this.o.weekStart,
                html = '<tr>';
            if (this.o.calendarWeeks) {
                html += '<th class="cw">&#160;</th>';
            }
            while (dowCnt < this.o.weekStart + 7) {
                html += '<th class="dow';
                if ($.inArray(dowCnt, this.o.daysOfWeekDisabled) !== -1)
                    html += ' disabled';
                html += '">' + dates[this.o.language].daysMin[(dowCnt++) % 7] + '</th>';
            }
            html += '</tr>';
            this.picker.find('.datepicker-days thead').append(html);
        },

        fillMonths: function() {
            var localDate = this._utc_to_local(this.viewDate);
            var html = '';
            var focused;
            for (var i = 0; i < 12; i++) {
                focused = localDate && localDate.getMonth() === i ? ' focused' : '';
                html += '<span class="month' + focused + '">' + dates[this.o.language].monthsShort[i] + '</span>';
            }
            this.picker.find('.datepicker-months td').html(html);
        },

        setRange: function(range) {
            if (!range || !range.length)
                delete this.range;
            else
                this.range = $.map(range, function(d) {
                    return d.valueOf();
                });
            this.fill();
        },

        getClassNames: function(date) {
            var cls = [],
                year = this.viewDate.getUTCFullYear(),
                month = this.viewDate.getUTCMonth(),
                today = UTCToday();
            if (date.getUTCFullYear() < year || (date.getUTCFullYear() === year && date.getUTCMonth() < month)) {
                cls.push('old');
            } else if (date.getUTCFullYear() > year || (date.getUTCFullYear() === year && date.getUTCMonth() > month)) {
                cls.push('new');
            }
            if (this.focusDate && date.valueOf() === this.focusDate.valueOf())
                cls.push('focused');
            // Compare internal UTC date with UTC today, not local today
            if (this.o.todayHighlight && isUTCEquals(date, today)) {
                cls.push('today');
            }
            if (this.dates.contains(date) !== -1)
                cls.push('active');
            if (!this.dateWithinRange(date)) {
                cls.push('disabled');
            }
            if (this.dateIsDisabled(date)) {
                cls.push('disabled', 'disabled-date');
            }
            if ($.inArray(date.getUTCDay(), this.o.daysOfWeekHighlighted) !== -1) {
                cls.push('highlighted');
            }

            if (this.range) {
                if (date > this.range[0] && date < this.range[this.range.length - 1]) {
                    cls.push('range');
                }
                if ($.inArray(date.valueOf(), this.range) !== -1) {
                    cls.push('selected');
                }
                if (date.valueOf() === this.range[0]) {
                    cls.push('range-start');
                }
                if (date.valueOf() === this.range[this.range.length - 1]) {
                    cls.push('range-end');
                }
            }
            return cls;
        },

        _fill_yearsView: function(selector, cssClass, factor, year, startYear, endYear, beforeFn) {
            var html = '';
            var step = factor / 10;
            var view = this.picker.find(selector);
            var startVal = Math.floor(year / factor) * factor;
            var endVal = startVal + step * 9;
            var focusedVal = Math.floor(this.viewDate.getFullYear() / step) * step;
            var selected = $.map(this.dates, function(d) {
                return Math.floor(d.getUTCFullYear() / step) * step;
            });

            var classes, tooltip, before;
            for (var currVal = startVal - step; currVal <= endVal + step; currVal += step) {
                classes = [cssClass];
                tooltip = null;

                if (currVal === startVal - step) {
                    classes.push('old');
                } else if (currVal === endVal + step) {
                    classes.push('new');
                }
                if ($.inArray(currVal, selected) !== -1) {
                    classes.push('active');
                }
                if (currVal < startYear || currVal > endYear) {
                    classes.push('disabled');
                }
                if (currVal === focusedVal) {
                    classes.push('focused');
                }

                if (beforeFn !== $.noop) {
                    before = beforeFn(new Date(currVal, 0, 1));
                    if (before === undefined) {
                        before = {};
                    } else if (typeof before === 'boolean') {
                        before = {
                            enabled: before
                        };
                    } else if (typeof before === 'string') {
                        before = {
                            classes: before
                        };
                    }
                    if (before.enabled === false) {
                        classes.push('disabled');
                    }
                    if (before.classes) {
                        classes = classes.concat(before.classes.split(/\s+/));
                    }
                    if (before.tooltip) {
                        tooltip = before.tooltip;
                    }
                }

                html += '<span class="' + classes.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + '>' + currVal + '</span>';
            }

            view.find('.datepicker-switch').text(startVal + '-' + endVal);
            view.find('td').html(html);
        },

        fill: function() {
            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
                startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
                endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
                endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
                todaytxt = dates[this.o.language].today || dates['en'].today || '',
                cleartxt = dates[this.o.language].clear || dates['en'].clear || '',
                titleFormat = dates[this.o.language].titleFormat || dates['en'].titleFormat,
                tooltip,
                before;
            if (isNaN(year) || isNaN(month))
                return;
            this.picker.find('.datepicker-days .datepicker-switch')
                .text(DPGlobal.formatDate(d, titleFormat, this.o.language));
            this.picker.find('tfoot .today')
                .text(todaytxt)
                .toggle(this.o.todayBtn !== false);
            this.picker.find('tfoot .clear')
                .text(cleartxt)
                .toggle(this.o.clearBtn !== false);
            this.picker.find('thead .datepicker-title')
                .text(this.o.title)
                .toggle(this.o.title !== '');
            this.updateNavArrows();
            this.fillMonths();
            var prevMonth = UTCDate(year, month, 0),
                day = prevMonth.getUTCDate();
            prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7) % 7);
            var nextMonth = new Date(prevMonth);
            if (prevMonth.getUTCFullYear() < 100) {
                nextMonth.setUTCFullYear(prevMonth.getUTCFullYear());
            }
            nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
            nextMonth = nextMonth.valueOf();
            var html = [];
            var weekDay, clsName;
            while (prevMonth.valueOf() < nextMonth) {
                weekDay = prevMonth.getUTCDay();
                if (weekDay === this.o.weekStart) {
                    html.push('<tr>');
                    if (this.o.calendarWeeks) {
                        // ISO 8601: First week contains first thursday.
                        // ISO also states week starts on Monday, but we can be more abstract here.
                        var
                            // Start of current week: based on weekstart/current date
                            ws = new Date(+prevMonth + (this.o.weekStart - weekDay - 7) % 7 * 864e5),
                            // Thursday of this week
                            th = new Date(Number(ws) + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
                            // First Thursday of year, year from thursday
                            yth = new Date(Number(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay()) % 7 * 864e5),
                            // Calendar week: ms between thursdays, div ms per day, div 7 days
                            calWeek = (th - yth) / 864e5 / 7 + 1;
                        html.push('<td class="cw">' + calWeek + '</td>');
                    }
                }
                clsName = this.getClassNames(prevMonth);
                clsName.push('day');

                if (this.o.beforeShowDay !== $.noop) {
                    before = this.o.beforeShowDay(this._utc_to_local(prevMonth));
                    if (before === undefined)
                        before = {};
                    else if (typeof before === 'boolean')
                        before = {
                            enabled: before
                        };
                    else if (typeof before === 'string')
                        before = {
                            classes: before
                        };
                    if (before.enabled === false)
                        clsName.push('disabled');
                    if (before.classes)
                        clsName = clsName.concat(before.classes.split(/\s+/));
                    if (before.tooltip)
                        tooltip = before.tooltip;
                }

                //Check if uniqueSort exists (supported by jquery >=1.12 and >=2.2)
                //Fallback to unique function for older jquery versions
                if ($.isFunction($.uniqueSort)) {
                    clsName = $.uniqueSort(clsName);
                } else {
                    clsName = $.unique(clsName);
                }

                // Creative Tim - we added a div inside each td for design purposes
                html.push('<td class="' + clsName.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + (this.o.dateCells ? ' data-date="' + prevMonth.getTime().toString() + '"' : '') + '><div>' + prevMonth.getUTCDate() + '</div></td>');
                tooltip = null;
                if (weekDay === this.o.weekEnd) {
                    html.push('</tr>');
                }
                prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
            }
            this.picker.find('.datepicker-days tbody').html(html.join(''));

            var monthsTitle = dates[this.o.language].monthsTitle || dates['en'].monthsTitle || 'Months';
            var months = this.picker.find('.datepicker-months')
                .find('.datepicker-switch')
                .text(this.o.maxViewMode < 2 ? monthsTitle : year)
                .end()
                .find('tbody span').removeClass('active');

            $.each(this.dates, function(i, d) {
                if (d.getUTCFullYear() === year)
                    months.eq(d.getUTCMonth()).addClass('active');
            });

            if (year < startYear || year > endYear) {
                months.addClass('disabled');
            }
            if (year === startYear) {
                months.slice(0, startMonth).addClass('disabled');
            }
            if (year === endYear) {
                months.slice(endMonth + 1).addClass('disabled');
            }

            if (this.o.beforeShowMonth !== $.noop) {
                var that = this;
                $.each(months, function(i, month) {
                    var moDate = new Date(year, i, 1);
                    var before = that.o.beforeShowMonth(moDate);
                    if (before === undefined)
                        before = {};
                    else if (typeof before === 'boolean')
                        before = {
                            enabled: before
                        };
                    else if (typeof before === 'string')
                        before = {
                            classes: before
                        };
                    if (before.enabled === false && !$(month).hasClass('disabled'))
                        $(month).addClass('disabled');
                    if (before.classes)
                        $(month).addClass(before.classes);
                    if (before.tooltip)
                        $(month).prop('title', before.tooltip);
                });
            }

            // Generating decade/years picker
            this._fill_yearsView(
                '.datepicker-years',
                'year',
                10,
                year,
                startYear,
                endYear,
                this.o.beforeShowYear
            );

            // Generating century/decades picker
            this._fill_yearsView(
                '.datepicker-decades',
                'decade',
                100,
                year,
                startYear,
                endYear,
                this.o.beforeShowDecade
            );

            // Generating millennium/centuries picker
            this._fill_yearsView(
                '.datepicker-centuries',
                'century',
                1000,
                year,
                startYear,
                endYear,
                this.o.beforeShowCentury
            );
        },

        updateNavArrows: function() {
            if (!this._allow_update)
                return;

            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
                startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
                endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
                endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
                prevIsDisabled,
                nextIsDisabled,
                factor = 1;
            switch (this.viewMode) {
                case 0:
                    prevIsDisabled = year <= startYear && month <= startMonth;
                    nextIsDisabled = year >= endYear && month >= endMonth;
                    break;
                case 4:
                    factor *= 10;
                    /* falls through */
                case 3:
                    factor *= 10;
                    /* falls through */
                case 2:
                    factor *= 10;
                    /* falls through */
                case 1:
                    prevIsDisabled = Math.floor(year / factor) * factor <= startYear;
                    nextIsDisabled = Math.floor(year / factor) * factor + factor >= endYear;
                    break;
            }

            this.picker.find('.prev').toggleClass('disabled', prevIsDisabled);
            this.picker.find('.next').toggleClass('disabled', nextIsDisabled);
        },

        click: function(e) {
            e.preventDefault();
            e.stopPropagation();

            var target, dir, day, year, month;
            target = $(e.target);

            // Clicked on the switch
            if (target.hasClass('datepicker-switch') && this.viewMode !== this.o.maxViewMode) {
                this.setViewMode(this.viewMode + 1);
            }

            // Clicked on today button
            if (target.hasClass('today') && !target.hasClass('day')) {
                this.setViewMode(0);
                this._setDate(UTCToday(), this.o.todayBtn === 'linked' ? null : 'view');
            }

            // Clicked on clear button
            if (target.hasClass('clear')) {
                this.clearDates();
            }

            if (!target.hasClass('disabled')) {
                // Clicked on a day
                if (target.hasClass('day')) {
                    day = Number(target.text());
                    year = this.viewDate.getUTCFullYear();
                    month = this.viewDate.getUTCMonth();

                    if (target.hasClass('old') || target.hasClass('new')) {
                        dir = target.hasClass('old') ? -1 : 1;
                        month = (month + dir + 12) % 12;
                        if ((dir === -1 && month === 11) || (dir === 1 && month === 0)) {
                            year += dir;
                            if (this.o.updateViewDate) {
                                this._trigger('changeYear', this.viewDate);
                            }
                        }
                        if (this.o.updateViewDate) {
                            this._trigger('changeMonth', this.viewDate);
                        }
                    }
                    this._setDate(UTCDate(year, month, day));
                }

                // Clicked on a month, year, decade, century
                if (target.hasClass('month') ||
                    target.hasClass('year') ||
                    target.hasClass('decade') ||
                    target.hasClass('century')) {
                    this.viewDate.setUTCDate(1);

                    day = 1;
                    if (this.viewMode === 1) {
                        month = target.parent().find('span').index(target);
                        year = this.viewDate.getUTCFullYear();
                        this.viewDate.setUTCMonth(month);
                    } else {
                        month = 0;
                        year = Number(target.text());
                        this.viewDate.setUTCFullYear(year);
                    }

                    this._trigger(DPGlobal.viewModes[this.viewMode - 1].e, this.viewDate);

                    if (this.viewMode === this.o.minViewMode) {
                        this._setDate(UTCDate(year, month, day));
                    } else {
                        this.setViewMode(this.viewMode - 1);
                        this.fill();
                    }
                }
            }

            if (this.picker.is(':visible') && this._focused_from) {
                this._focused_from.focus();
            }
            delete this._focused_from;
        },

        // Clicked on prev or next
        navArrowsClick: function(e) {
            var target = $(e.target);
            var dir = target.hasClass('prev') ? -1 : 1;
            if (this.viewMode !== 0) {
                dir *= DPGlobal.viewModes[this.viewMode].navStep * 12;
            }
            this.viewDate = this.moveMonth(this.viewDate, dir);
            this._trigger(DPGlobal.viewModes[this.viewMode].e, this.viewDate);
            this.fill();
        },

        _toggle_multidate: function(date) {
            var ix = this.dates.contains(date);
            if (!date) {
                this.dates.clear();
            }

            if (ix !== -1) {
                if (this.o.multidate === true || this.o.multidate > 1 || this.o.toggleActive) {
                    this.dates.remove(ix);
                }
            } else if (this.o.multidate === false) {
                this.dates.clear();
                this.dates.push(date);
            } else {
                this.dates.push(date);
            }

            if (typeof this.o.multidate === 'number')
                while (this.dates.length > this.o.multidate)
                    this.dates.remove(0);
        },

        _setDate: function(date, which) {
            if (!which || which === 'date')
                this._toggle_multidate(date && new Date(date));
            if ((!which && this.o.updateViewDate) || which === 'view')
                this.viewDate = date && new Date(date);

            this.fill();
            this.setValue();
            if (!which || which !== 'view') {
                this._trigger('changeDate');
            }
            this.inputField.trigger('change');
            if (this.o.autoclose && (!which || which === 'date')) {
                this.hide();
            }
        },

        moveDay: function(date, dir) {
            var newDate = new Date(date);
            newDate.setUTCDate(date.getUTCDate() + dir);

            return newDate;
        },

        moveWeek: function(date, dir) {
            return this.moveDay(date, dir * 7);
        },

        moveMonth: function(date, dir) {
            if (!isValidDate(date))
                return this.o.defaultViewDate;
            if (!dir)
                return date;
            var new_date = new Date(date.valueOf()),
                day = new_date.getUTCDate(),
                month = new_date.getUTCMonth(),
                mag = Math.abs(dir),
                new_month, test;
            dir = dir > 0 ? 1 : -1;
            if (mag === 1) {
                test = dir === -1
                    // If going back one month, make sure month is not current month
                    // (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
                    ?
                    function() {
                        return new_date.getUTCMonth() === month;
                    }
                    // If going forward one month, make sure month is as expected
                    // (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
                    :
                    function() {
                        return new_date.getUTCMonth() !== new_month;
                    };
                new_month = month + dir;
                new_date.setUTCMonth(new_month);
                // Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
                new_month = (new_month + 12) % 12;
            } else {
                // For magnitudes >1, move one month at a time...
                for (var i = 0; i < mag; i++)
                    // ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
                    new_date = this.moveMonth(new_date, dir);
                // ...then reset the day, keeping it in the new month
                new_month = new_date.getUTCMonth();
                new_date.setUTCDate(day);
                test = function() {
                    return new_month !== new_date.getUTCMonth();
                };
            }
            // Common date-resetting loop -- if date is beyond end of month, make it
            // end of month
            while (test()) {
                new_date.setUTCDate(--day);
                new_date.setUTCMonth(new_month);
            }
            return new_date;
        },

        moveYear: function(date, dir) {
            return this.moveMonth(date, dir * 12);
        },

        moveAvailableDate: function(date, dir, fn) {
            do {
                date = this[fn](date, dir);

                if (!this.dateWithinRange(date))
                    return false;

                fn = 'moveDay';
            }
            while (this.dateIsDisabled(date));

            return date;
        },

        weekOfDateIsDisabled: function(date) {
            return $.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1;
        },

        dateIsDisabled: function(date) {
            return (
                this.weekOfDateIsDisabled(date) ||
                $.grep(this.o.datesDisabled, function(d) {
                    return isUTCEquals(date, d);
                }).length > 0
            );
        },

        dateWithinRange: function(date) {
            return date >= this.o.startDate && date <= this.o.endDate;
        },

        keydown: function(e) {
            if (!this.picker.is(':visible')) {
                if (e.keyCode === 40 || e.keyCode === 27) { // allow down to re-show picker
                    this.show();
                    e.stopPropagation();
                }
                return;
            }
            var dateChanged = false,
                dir, newViewDate,
                focusDate = this.focusDate || this.viewDate;
            switch (e.keyCode) {
                case 27: // escape
                    if (this.focusDate) {
                        this.focusDate = null;
                        this.viewDate = this.dates.get(-1) || this.viewDate;
                        this.fill();
                    } else
                        this.hide();
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case 37: // left
                case 38: // up
                case 39: // right
                case 40: // down
                    if (!this.o.keyboardNavigation || this.o.daysOfWeekDisabled.length === 7)
                        break;
                    dir = e.keyCode === 37 || e.keyCode === 38 ? -1 : 1;
                    if (this.viewMode === 0) {
                        if (e.ctrlKey) {
                            newViewDate = this.moveAvailableDate(focusDate, dir, 'moveYear');

                            if (newViewDate)
                                this._trigger('changeYear', this.viewDate);
                        } else if (e.shiftKey) {
                            newViewDate = this.moveAvailableDate(focusDate, dir, 'moveMonth');

                            if (newViewDate)
                                this._trigger('changeMonth', this.viewDate);
                        } else if (e.keyCode === 37 || e.keyCode === 39) {
                            newViewDate = this.moveAvailableDate(focusDate, dir, 'moveDay');
                        } else if (!this.weekOfDateIsDisabled(focusDate)) {
                            newViewDate = this.moveAvailableDate(focusDate, dir, 'moveWeek');
                        }
                    } else if (this.viewMode === 1) {
                        if (e.keyCode === 38 || e.keyCode === 40) {
                            dir = dir * 4;
                        }
                        newViewDate = this.moveAvailableDate(focusDate, dir, 'moveMonth');
                    } else if (this.viewMode === 2) {
                        if (e.keyCode === 38 || e.keyCode === 40) {
                            dir = dir * 4;
                        }
                        newViewDate = this.moveAvailableDate(focusDate, dir, 'moveYear');
                    }
                    if (newViewDate) {
                        this.focusDate = this.viewDate = newViewDate;
                        this.setValue();
                        this.fill();
                        e.preventDefault();
                    }
                    break;
                case 13: // enter
                    if (!this.o.forceParse)
                        break;
                    focusDate = this.focusDate || this.dates.get(-1) || this.viewDate;
                    if (this.o.keyboardNavigation) {
                        this._toggle_multidate(focusDate);
                        dateChanged = true;
                    }
                    this.focusDate = null;
                    this.viewDate = this.dates.get(-1) || this.viewDate;
                    this.setValue();
                    this.fill();
                    if (this.picker.is(':visible')) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (this.o.autoclose)
                            this.hide();
                    }
                    break;
                case 9: // tab
                    this.focusDate = null;
                    this.viewDate = this.dates.get(-1) || this.viewDate;
                    this.fill();
                    this.hide();
                    break;
            }
            if (dateChanged) {
                if (this.dates.length)
                    this._trigger('changeDate');
                else
                    this._trigger('clearDate');
                this.inputField.trigger('change');
            }
        },

        setViewMode: function(viewMode) {
            this.viewMode = viewMode;
            this.picker
                .children('div')
                .hide()
                .filter('.datepicker-' + DPGlobal.viewModes[this.viewMode].clsName)
                .show();
            this.updateNavArrows();
            this._trigger('changeViewMode', new Date(this.viewDate));
        }
    };

    var DateRangePicker = function(element, options) {
        $.data(element, 'datepicker', this);
        this.element = $(element);
        this.inputs = $.map(options.inputs, function(i) {
            return i.jquery ? i[0] : i;
        });
        delete options.inputs;

        this.keepEmptyValues = options.keepEmptyValues;
        delete options.keepEmptyValues;

        datepickerPlugin.call($(this.inputs), options)
            .on('changeDate', $.proxy(this.dateUpdated, this));

        this.pickers = $.map(this.inputs, function(i) {
            return $.data(i, 'datepicker');
        });
        this.updateDates();
    };
    DateRangePicker.prototype = {
        updateDates: function() {
            this.dates = $.map(this.pickers, function(i) {
                return i.getUTCDate();
            });
            this.updateRanges();
        },
        updateRanges: function() {
            var range = $.map(this.dates, function(d) {
                return d.valueOf();
            });
            $.each(this.pickers, function(i, p) {
                p.setRange(range);
            });
        },
        dateUpdated: function(e) {
            // `this.updating` is a workaround for preventing infinite recursion
            // between `changeDate` triggering and `setUTCDate` calling.  Until
            // there is a better mechanism.
            if (this.updating)
                return;
            this.updating = true;

            var dp = $.data(e.target, 'datepicker');

            if (dp === undefined) {
                return;
            }

            var new_date = dp.getUTCDate(),
                keep_empty_values = this.keepEmptyValues,
                i = $.inArray(e.target, this.inputs),
                j = i - 1,
                k = i + 1,
                l = this.inputs.length;
            if (i === -1)
                return;

            $.each(this.pickers, function(i, p) {
                if (!p.getUTCDate() && (p === dp || !keep_empty_values))
                    p.setUTCDate(new_date);
            });

            if (new_date < this.dates[j]) {
                // Date being moved earlier/left
                while (j >= 0 && new_date < this.dates[j]) {
                    this.pickers[j--].setUTCDate(new_date);
                }
            } else if (new_date > this.dates[k]) {
                // Date being moved later/right
                while (k < l && new_date > this.dates[k]) {
                    this.pickers[k++].setUTCDate(new_date);
                }
            }
            this.updateDates();

            delete this.updating;
        },
        destroy: function() {
            $.map(this.pickers, function(p) {
                p.destroy();
            });
            $(this.inputs).off('changeDate', this.dateUpdated);
            delete this.element.data().datepicker;
        },
        remove: alias('destroy', 'Method `remove` is deprecated and will be removed in version 2.0. Use `destroy` instead')
    };

    function opts_from_el(el, prefix) {
        // Derive options from element data-attrs
        var data = $(el).data(),
            out = {},
            inkey,
            replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])');
        prefix = new RegExp('^' + prefix.toLowerCase());

        function re_lower(_, a) {
            return a.toLowerCase();
        }
        for (var key in data)
            if (prefix.test(key)) {
                inkey = key.replace(replace, re_lower);
                out[inkey] = data[key];
            }
        return out;
    }

    function opts_from_locale(lang) {
        // Derive options from locale plugins
        var out = {};
        // Check if "de-DE" style date is available, if not language should
        // fallback to 2 letter code eg "de"
        if (!dates[lang]) {
            lang = lang.split('-')[0];
            if (!dates[lang])
                return;
        }
        var d = dates[lang];
        $.each(locale_opts, function(i, k) {
            if (k in d)
                out[k] = d[k];
        });
        return out;
    }

    var old = $.fn.datepicker;
    var datepickerPlugin = function(option) {
        var args = Array.apply(null, arguments);
        args.shift();
        var internal_return;
        this.each(function() {
            var $this = $(this),
                data = $this.data('datepicker'),
                options = typeof option === 'object' && option;
            if (!data) {
                var elopts = opts_from_el(this, 'date'),
                    // Preliminary otions
                    xopts = $.extend({}, defaults, elopts, options),
                    locopts = opts_from_locale(xopts.language),
                    // Options priority: js args, data-attrs, locales, defaults
                    opts = $.extend({}, defaults, locopts, elopts, options);
                if ($this.hasClass('input-daterange') || opts.inputs) {
                    $.extend(opts, {
                        inputs: opts.inputs || $this.find('input').toArray()
                    });
                    data = new DateRangePicker(this, opts);
                } else {
                    data = new Datepicker(this, opts);
                }
                $this.data('datepicker', data);
            }
            if (typeof option === 'string' && typeof data[option] === 'function') {
                internal_return = data[option].apply(data, args);
            }
        });

        if (
            internal_return === undefined ||
            internal_return instanceof Datepicker ||
            internal_return instanceof DateRangePicker
        )
            return this;

        if (this.length > 1)
            throw new Error('Using only allowed for the collection of a single element (' + option + ' function)');
        else
            return internal_return;
    };
    $.fn.datepicker = datepickerPlugin;

    var defaults = $.fn.datepicker.defaults = {
        assumeNearbyYear: false,
        autoclose: false,
        beforeShowDay: $.noop,
        beforeShowMonth: $.noop,
        beforeShowYear: $.noop,
        beforeShowDecade: $.noop,
        beforeShowCentury: $.noop,
        calendarWeeks: false,
        clearBtn: false,
        toggleActive: false,
        daysOfWeekDisabled: [],
        daysOfWeekHighlighted: [],
        datesDisabled: [],
        endDate: Infinity,
        forceParse: true,
        format: 'mm/dd/yyyy',
        keepEmptyValues: false,
        keyboardNavigation: true,
        language: 'en',
        minViewMode: 0,
        maxViewMode: 4,
        multidate: false,
        multidateSeparator: ',',
        orientation: "auto",
        rtl: false,
        startDate: -Infinity,
        startView: 0,
        todayBtn: false,
        todayHighlight: false,
        updateViewDate: true,
        weekStart: 0,
        disableTouchKeyboard: false,
        enableOnReadonly: true,
        showOnFocus: true,
        zIndexOffset: 10,
        container: 'body',
        immediateUpdates: false,
        dateCells: false,
        title: '',
        templates: {
            leftArrow: '&#x00AB;',
            rightArrow: '&#x00BB;'
        }
    };
    var locale_opts = $.fn.datepicker.locale_opts = [
        'format',
        'rtl',
        'weekStart'
    ];
    $.fn.datepicker.Constructor = Datepicker;
    var dates = $.fn.datepicker.dates = {
        en: {
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            today: "Today",
            clear: "Clear",
            titleFormat: "MM yyyy"
        }
    };

    var DPGlobal = {
        viewModes: [{
                names: ['days', 'month'],
                clsName: 'days',
                e: 'changeMonth'
            },
            {
                names: ['months', 'year'],
                clsName: 'months',
                e: 'changeYear',
                navStep: 1
            },
            {
                names: ['years', 'decade'],
                clsName: 'years',
                e: 'changeDecade',
                navStep: 10
            },
            {
                names: ['decades', 'century'],
                clsName: 'decades',
                e: 'changeCentury',
                navStep: 100
            },
            {
                names: ['centuries', 'millennium'],
                clsName: 'centuries',
                e: 'changeMillennium',
                navStep: 1000
            }
        ],
        validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
        nonpunctuation: /[^ -\/:-@\u5e74\u6708\u65e5\[-`{-~\t\n\r]+/g,
        parseFormat: function(format) {
            if (typeof format.toValue === 'function' && typeof format.toDisplay === 'function')
                return format;
            // IE treats \0 as a string end in inputs (truncating the value),
            // so it's a bad format delimiter, anyway
            var separators = format.replace(this.validParts, '\0').split('\0'),
                parts = format.match(this.validParts);
            if (!separators || !separators.length || !parts || parts.length === 0) {
                throw new Error("Invalid date format.");
            }
            return {
                separators: separators,
                parts: parts
            };
        },
        parseDate: function(date, format, language, assumeNearby) {
            if (!date)
                return undefined;
            if (date instanceof Date)
                return date;
            if (typeof format === 'string')
                format = DPGlobal.parseFormat(format);
            if (format.toValue)
                return format.toValue(date, format, language);
            var fn_map = {
                    d: 'moveDay',
                    m: 'moveMonth',
                    w: 'moveWeek',
                    y: 'moveYear'
                },
                dateAliases = {
                    yesterday: '-1d',
                    today: '+0d',
                    tomorrow: '+1d'
                },
                parts, part, dir, i, fn;
            if (date in dateAliases) {
                date = dateAliases[date];
            }
            if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/i.test(date)) {
                parts = date.match(/([\-+]\d+)([dmwy])/gi);
                date = new Date();
                for (i = 0; i < parts.length; i++) {
                    part = parts[i].match(/([\-+]\d+)([dmwy])/i);
                    dir = Number(part[1]);
                    fn = fn_map[part[2].toLowerCase()];
                    date = Datepicker.prototype[fn](date, dir);
                }
                return Datepicker.prototype._zero_utc_time(date);
            }

            parts = date && date.match(this.nonpunctuation) || [];

            function applyNearbyYear(year, threshold) {
                if (threshold === true)
                    threshold = 10;

                // if year is 2 digits or less, than the user most likely is trying to get a recent century
                if (year < 100) {
                    year += 2000;
                    // if the new year is more than threshold years in advance, use last century
                    if (year > ((new Date()).getFullYear() + threshold)) {
                        year -= 100;
                    }
                }

                return year;
            }

            var parsed = {},
                setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
                setters_map = {
                    yyyy: function(d, v) {
                        return d.setUTCFullYear(assumeNearby ? applyNearbyYear(v, assumeNearby) : v);
                    },
                    m: function(d, v) {
                        if (isNaN(d))
                            return d;
                        v -= 1;
                        while (v < 0) v += 12;
                        v %= 12;
                        d.setUTCMonth(v);
                        while (d.getUTCMonth() !== v)
                            d.setUTCDate(d.getUTCDate() - 1);
                        return d;
                    },
                    d: function(d, v) {
                        return d.setUTCDate(v);
                    }
                },
                val, filtered;
            setters_map['yy'] = setters_map['yyyy'];
            setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
            setters_map['dd'] = setters_map['d'];
            date = UTCToday();
            var fparts = format.parts.slice();
            // Remove noop parts
            if (parts.length !== fparts.length) {
                fparts = $(fparts).filter(function(i, p) {
                    return $.inArray(p, setters_order) !== -1;
                }).toArray();
            }
            // Process remainder
            function match_part() {
                var m = this.slice(0, parts[i].length),
                    p = parts[i].slice(0, m.length);
                return m.toLowerCase() === p.toLowerCase();
            }
            if (parts.length === fparts.length) {
                var cnt;
                for (i = 0, cnt = fparts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10);
                    part = fparts[i];
                    if (isNaN(val)) {
                        switch (part) {
                            case 'MM':
                                filtered = $(dates[language].months).filter(match_part);
                                val = $.inArray(filtered[0], dates[language].months) + 1;
                                break;
                            case 'M':
                                filtered = $(dates[language].monthsShort).filter(match_part);
                                val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
                                break;
                        }
                    }
                    parsed[part] = val;
                }
                var _date, s;
                for (i = 0; i < setters_order.length; i++) {
                    s = setters_order[i];
                    if (s in parsed && !isNaN(parsed[s])) {
                        _date = new Date(date);
                        setters_map[s](_date, parsed[s]);
                        if (!isNaN(_date))
                            date = _date;
                    }
                }
            }
            return date;
        },
        formatDate: function(date, format, language) {
            if (!date)
                return '';
            if (typeof format === 'string')
                format = DPGlobal.parseFormat(format);
            if (format.toDisplay)
                return format.toDisplay(date, format, language);
            var val = {
                d: date.getUTCDate(),
                D: dates[language].daysShort[date.getUTCDay()],
                DD: dates[language].days[date.getUTCDay()],
                m: date.getUTCMonth() + 1,
                M: dates[language].monthsShort[date.getUTCMonth()],
                MM: dates[language].months[date.getUTCMonth()],
                yy: date.getUTCFullYear().toString().substring(2),
                yyyy: date.getUTCFullYear()
            };
            val.dd = (val.d < 10 ? '0' : '') + val.d;
            val.mm = (val.m < 10 ? '0' : '') + val.m;
            date = [];
            var seps = $.extend([], format.separators);
            for (var i = 0, cnt = format.parts.length; i <= cnt; i++) {
                if (seps.length)
                    date.push(seps.shift());
                date.push(val[format.parts[i]]);
            }
            return date.join('');
        },
        headTemplate: '<thead>' +
            '<tr>' +
            '<th colspan="7" class="datepicker-title"></th>' +
            '</tr>' +
            '<tr>' +
            '<th class="prev">&laquo;</th>' +
            '<th colspan="5" class="datepicker-switch"></th>' +
            '<th class="next">&raquo;</th>' +
            '</tr>' +
            '</thead>',
        contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
        footTemplate: '<tfoot>' +
            '<tr>' +
            '<th colspan="7" class="today"></th>' +
            '</tr>' +
            '<tr>' +
            '<th colspan="7" class="clear"></th>' +
            '</tr>' +
            '</tfoot>'
    };
    DPGlobal.template = '<div class="datepicker">' +
        '<div class="datepicker-days">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        '<tbody></tbody>' +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datepicker-months">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datepicker-years">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datepicker-decades">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datepicker-centuries">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '</div>';

    $.fn.datepicker.DPGlobal = DPGlobal;


    /* DATEPICKER NO CONFLICT
     * =================== */

    $.fn.datepicker.noConflict = function() {
        $.fn.datepicker = old;
        return this;
    };

    /* DATEPICKER VERSION
     * =================== */
    $.fn.datepicker.version = '1.7.0-dev';

    $.fn.datepicker.deprecated = function(msg) {
        var console = window.console;
        if (console && console.warn) {
            console.warn('DEPRECATED: ' + msg);
        }
    };


    /* DATEPICKER DATA-API
     * ================== */

    $(document).on(
        'focus.datepicker.data-api click.datepicker.data-api',
        '[data-provide="datepicker"]',
        function(e) {
            var $this = $(this);
            if ($this.data('datepicker'))
                return;
            e.preventDefault();
            // component click requires us to explicitly show it
            datepickerPlugin.call($this, 'show');
        }
    );
    $(function() {
        datepickerPlugin.call($('[data-provide="datepicker-inline"]'));
    });

}));
/*



     Creative Tim Modifications

     Lines: 238, 239 was changed from top: 5px to top: 50% and we added margin-top: -13px. In this way the close button will be aligned vertically
     Line:222 - modified when the icon is set, we add the class "alert-with-icon", so there will be enough space for the icon.




*/


/*
 * Project: Bootstrap Notify = v3.1.5
 * Description: Turns standard Bootstrap alerts into "Growl-like" notifications.
 * Author: Mouse0270 aka Robert McIntosh
 * License: MIT License
 * Website: https://github.com/mouse0270/bootstrap-growl
 */

/* global define:false, require: false, jQuery:false */

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($) {
    // Create the defaults once
    var defaults = {
        element: 'body',
        position: null,
        type: "info",
        allow_dismiss: true,
        allow_duplicates: true,
        newest_on_top: false,
        showProgressbar: false,
        placement: {
            from: "top",
            align: "right"
        },
        offset: 20,
        spacing: 10,
        z_index: 1031,
        delay: 5000,
        timer: 1000,
        url_target: '_blank',
        mouse_over: null,
        animate: {
            enter: 'animated fadeInDown',
            exit: 'animated fadeOutUp'
        },
        onShow: null,
        onShown: null,
        onClose: null,
        onClosed: null,
        onClick: null,
        icon_type: 'class',
        template: '<div data-notify="container" class="col-11 col-sm-4 alert alert-{0}" role="alert"><button type="button" aria-hidden="true" class="close" data-notify="dismiss"><i class="nc-icon nc-simple-remove"></i></button><span data-notify="icon"></span> <span data-notify="title">{1}</span> <span data-notify="message">{2}</span><div class="progress" data-notify="progressbar"><div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div></div><a href="{3}" target="{4}" data-notify="url"></a></div>'
    };

    String.format = function() {
        var args = arguments;
        var str = arguments[0];
        return str.replace(/(\{\{\d\}\}|\{\d\})/g, function(str) {
            if (str.substring(0, 2) === "{{") return str;
            var num = parseInt(str.match(/\d/)[0]);
            return args[num + 1];
        });
    };

    function isDuplicateNotification(notification) {
        var isDupe = false;

        $('[data-notify="container"]').each(function(i, el) {
            var $el = $(el);
            var title = $el.find('[data-notify="title"]').html().trim();
            var message = $el.find('[data-notify="message"]').html().trim();

            // The input string might be different than the actual parsed HTML string!
            // (<br> vs <br /> for example)
            // So we have to force-parse this as HTML here!
            var isSameTitle = title === $("<div>" + notification.settings.content.title + "</div>").html().trim();
            var isSameMsg = message === $("<div>" + notification.settings.content.message + "</div>").html().trim();
            var isSameType = $el.hasClass('alert-' + notification.settings.type);

            if (isSameTitle && isSameMsg && isSameType) {
                //we found the dupe. Set the var and stop checking.
                isDupe = true;
            }
            return !isDupe;
        });

        return isDupe;
    }

    function Notify(element, content, options) {
        // Setup Content of Notify
        var contentObj = {
            content: {
                message: typeof content === 'object' ? content.message : content,
                title: content.title ? content.title : '',
                icon: content.icon ? content.icon : '',
                url: content.url ? content.url : '#',
                target: content.target ? content.target : '-'
            }
        };

        options = $.extend(true, {}, contentObj, options);
        this.settings = $.extend(true, {}, defaults, options);
        this._defaults = defaults;
        if (this.settings.content.target === "-") {
            this.settings.content.target = this.settings.url_target;
        }
        this.animations = {
            start: 'webkitAnimationStart oanimationstart MSAnimationStart animationstart',
            end: 'webkitAnimationEnd oanimationend MSAnimationEnd animationend'
        };

        if (typeof this.settings.offset === 'number') {
            this.settings.offset = {
                x: this.settings.offset,
                y: this.settings.offset
            };
        }

        //if duplicate messages are not allowed, then only continue if this new message is not a duplicate of one that it already showing
        if (this.settings.allow_duplicates || (!this.settings.allow_duplicates && !isDuplicateNotification(this))) {
            this.init();
        }
    }

    $.extend(Notify.prototype, {
        init: function() {
            var self = this;

            this.buildNotify();
            if (this.settings.content.icon) {
                this.setIcon();
            }
            if (this.settings.content.url != "#") {
                this.styleURL();
            }
            this.styleDismiss();
            this.placement();
            this.bind();

            this.notify = {
                $ele: this.$ele,
                update: function(command, update) {
                    var commands = {};
                    if (typeof command === "string") {
                        commands[command] = update;
                    } else {
                        commands = command;
                    }
                    for (var cmd in commands) {
                        switch (cmd) {
                            case "type":
                                this.$ele.removeClass('alert-' + self.settings.type);
                                this.$ele.find('[data-notify="progressbar"] > .progress-bar').removeClass('progress-bar-' + self.settings.type);
                                self.settings.type = commands[cmd];
                                this.$ele.addClass('alert-' + commands[cmd]).find('[data-notify="progressbar"] > .progress-bar').addClass('progress-bar-' + commands[cmd]);
                                break;
                            case "icon":
                                var $icon = this.$ele.find('[data-notify="icon"]');
                                if (self.settings.icon_type.toLowerCase() === 'class') {
                                    $icon.removeClass(self.settings.content.icon).addClass(commands[cmd]);
                                } else {
                                    if (!$icon.is('img')) {
                                        $icon.find('img');
                                    }
                                    $icon.attr('src', commands[cmd]);
                                }
                                self.settings.content.icon = commands[command];
                                break;
                            case "progress":
                                var newDelay = self.settings.delay - (self.settings.delay * (commands[cmd] / 100));
                                this.$ele.data('notify-delay', newDelay);
                                this.$ele.find('[data-notify="progressbar"] > div').attr('aria-valuenow', commands[cmd]).css('width', commands[cmd] + '%');
                                break;
                            case "url":
                                this.$ele.find('[data-notify="url"]').attr('href', commands[cmd]);
                                break;
                            case "target":
                                this.$ele.find('[data-notify="url"]').attr('target', commands[cmd]);
                                break;
                            default:
                                this.$ele.find('[data-notify="' + cmd + '"]').html(commands[cmd]);
                        }
                    }
                    var posX = this.$ele.outerHeight() + parseInt(self.settings.spacing) + parseInt(self.settings.offset.y);
                    self.reposition(posX);
                },
                close: function() {
                    self.close();
                }
            };

        },
        buildNotify: function() {
            var content = this.settings.content;
            this.$ele = $(String.format(this.settings.template, this.settings.type, content.title, content.message, content.url, content.target));
            this.$ele.attr('data-notify-position', this.settings.placement.from + '-' + this.settings.placement.align);
            if (!this.settings.allow_dismiss) {
                this.$ele.find('[data-notify="dismiss"]').css('display', 'none');
            }
            if ((this.settings.delay <= 0 && !this.settings.showProgressbar) || !this.settings.showProgressbar) {
                this.$ele.find('[data-notify="progressbar"]').remove();
            }
        },
        setIcon: function() {
            this.$ele.addClass('alert-with-icon');

            if (this.settings.icon_type.toLowerCase() === 'class') {
                this.$ele.find('[data-notify="icon"]').addClass(this.settings.content.icon);
            } else {
                if (this.$ele.find('[data-notify="icon"]').is('img')) {
                    this.$ele.find('[data-notify="icon"]').attr('src', this.settings.content.icon);
                } else {
                    this.$ele.find('[data-notify="icon"]').append('<img src="' + this.settings.content.icon + '" alt="Notify Icon" />');
                }
            }
        },
        styleDismiss: function() {
            this.$ele.find('[data-notify="dismiss"]').css({
                position: 'absolute',
                right: '10px',
                top: '50%',
                marginTop: '-13px',
                zIndex: this.settings.z_index + 2
            });
        },
        styleURL: function() {
            this.$ele.find('[data-notify="url"]').css({
                backgroundImage: 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)',
                height: '100%',
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',
                zIndex: this.settings.z_index + 1
            });
        },
        placement: function() {
            var self = this,
                offsetAmt = this.settings.offset.y,
                css = {
                    display: 'inline-block',
                    margin: '0px auto',
                    position: this.settings.position ? this.settings.position : (this.settings.element === 'body' ? 'fixed' : 'absolute'),
                    transition: 'all .5s ease-in-out',
                    zIndex: this.settings.z_index
                },
                hasAnimation = false,
                settings = this.settings;

            $('[data-notify-position="' + this.settings.placement.from + '-' + this.settings.placement.align + '"]:not([data-closing="true"])').each(function() {
                offsetAmt = Math.max(offsetAmt, parseInt($(this).css(settings.placement.from)) + parseInt($(this).outerHeight()) + parseInt(settings.spacing));
            });
            if (this.settings.newest_on_top === true) {
                offsetAmt = this.settings.offset.y;
            }
            css[this.settings.placement.from] = offsetAmt + 'px';

            switch (this.settings.placement.align) {
                case "left":
                case "right":
                    css[this.settings.placement.align] = this.settings.offset.x + 'px';
                    break;
                case "center":
                    css.left = 0;
                    css.right = 0;
                    break;
            }
            this.$ele.css(css).addClass(this.settings.animate.enter);
            $.each(Array('webkit-', 'moz-', 'o-', 'ms-', ''), function(index, prefix) {
                self.$ele[0].style[prefix + 'AnimationIterationCount'] = 1;
            });

            $(this.settings.element).append(this.$ele);

            if (this.settings.newest_on_top === true) {
                offsetAmt = (parseInt(offsetAmt) + parseInt(this.settings.spacing)) + this.$ele.outerHeight();
                this.reposition(offsetAmt);
            }

            if ($.isFunction(self.settings.onShow)) {
                self.settings.onShow.call(this.$ele);
            }

            this.$ele.one(this.animations.start, function() {
                hasAnimation = true;
            }).one(this.animations.end, function() {
                self.$ele.removeClass(self.settings.animate.enter);
                if ($.isFunction(self.settings.onShown)) {
                    self.settings.onShown.call(this);
                }
            });

            setTimeout(function() {
                if (!hasAnimation) {
                    if ($.isFunction(self.settings.onShown)) {
                        self.settings.onShown.call(this);
                    }
                }
            }, 600);
        },
        bind: function() {
            var self = this;

            this.$ele.find('[data-notify="dismiss"]').on('click', function() {
                self.close();
            });

            if ($.isFunction(self.settings.onClick)) {
                this.$ele.on('click', function(event) {
                    if (event.target != self.$ele.find('[data-notify="dismiss"]')[0]) {
                        self.settings.onClick.call(this, event);
                    }
                });
            }

            this.$ele.mouseover(function() {
                $(this).data('data-hover', "true");
            }).mouseout(function() {
                $(this).data('data-hover', "false");
            });
            this.$ele.data('data-hover', "false");

            if (this.settings.delay > 0) {
                self.$ele.data('notify-delay', self.settings.delay);
                var timer = setInterval(function() {
                    var delay = parseInt(self.$ele.data('notify-delay')) - self.settings.timer;
                    if ((self.$ele.data('data-hover') === 'false' && self.settings.mouse_over === "pause") || self.settings.mouse_over != "pause") {
                        var percent = ((self.settings.delay - delay) / self.settings.delay) * 100;
                        self.$ele.data('notify-delay', delay);
                        self.$ele.find('[data-notify="progressbar"] > div').attr('aria-valuenow', percent).css('width', percent + '%');
                    }
                    if (delay <= -(self.settings.timer)) {
                        clearInterval(timer);
                        self.close();
                    }
                }, self.settings.timer);
            }
        },
        close: function() {
            var self = this,
                posX = parseInt(this.$ele.css(this.settings.placement.from)),
                hasAnimation = false;

            this.$ele.attr('data-closing', 'true').addClass(this.settings.animate.exit);
            self.reposition(posX);

            if ($.isFunction(self.settings.onClose)) {
                self.settings.onClose.call(this.$ele);
            }

            this.$ele.one(this.animations.start, function() {
                hasAnimation = true;
            }).one(this.animations.end, function() {
                $(this).remove();
                if ($.isFunction(self.settings.onClosed)) {
                    self.settings.onClosed.call(this);
                }
            });

            setTimeout(function() {
                if (!hasAnimation) {
                    self.$ele.remove();
                    if (self.settings.onClosed) {
                        self.settings.onClosed(self.$ele);
                    }
                }
            }, 600);
        },
        reposition: function(posX) {
            var self = this,
                notifies = '[data-notify-position="' + this.settings.placement.from + '-' + this.settings.placement.align + '"]:not([data-closing="true"])',
                $elements = this.$ele.nextAll(notifies);
            if (this.settings.newest_on_top === true) {
                $elements = this.$ele.prevAll(notifies);
            }
            $elements.each(function() {
                $(this).css(self.settings.placement.from, posX);
                posX = (parseInt(posX) + parseInt(self.settings.spacing)) + $(this).outerHeight();
            });
        }
    });

    $.notify = function(content, options) {
        var plugin = new Notify(this, content, options);
        return plugin.notify;
    };
    $.notifyDefaults = function(options) {
        defaults = $.extend(true, {}, defaults, options);
        return defaults;
    };

    $.notifyClose = function(selector) {

        if (typeof selector === "undefined" || selector === "all") {
            $('[data-notify]').find('[data-notify="dismiss"]').trigger('click');
        } else if (selector === 'success' || selector === 'info' || selector === 'warning' || selector === 'danger') {
            $('.alert-' + selector + '[data-notify]').find('[data-notify="dismiss"]').trigger('click');
        } else if (selector) {
            $(selector + '[data-notify]').find('[data-notify="dismiss"]').trigger('click');
        } else {
            $('[data-notify-position="' + selector + '"]').find('[data-notify="dismiss"]').trigger('click');
        }
    };

    $.notifyCloseExcept = function(selector) {

        if (selector === 'success' || selector === 'info' || selector === 'warning' || selector === 'danger') {
            $('[data-notify]').not('.alert-' + selector).find('[data-notify="dismiss"]').trigger('click');
        } else {
            $('[data-notify]').not(selector).find('[data-notify="dismiss"]').trigger('click');
        }
    };


}));
/**
 * bootstrap-switch - Turn checkboxes and radio buttons into toggle switches.
 *
 * @version v3.3.4
 * @homepage https://bttstrp.github.io/bootstrap-switch
 * @author Mattia Larentis <mattia@larentis.eu> (http://larentis.eu)
 * @license Apache-2.0
 */

(function(a, b) {
    if ('function' == typeof define && define.amd) define(['jquery'], b);
    else if ('undefined' != typeof exports) b(require('jquery'));
    else {
        b(a.jquery), a.bootstrapSwitch = {
            exports: {}
        }.exports
    }
})(this, function(a) {
    'use strict';

    function c(j, k) {
        if (!(j instanceof k)) throw new TypeError('Cannot call a class as a function')
    }
    var d = function(j) {
            return j && j.__esModule ? j : {
                default: j
            }
        }(a),
        e = Object.assign || function(j) {
            for (var l, k = 1; k < arguments.length; k++)
                for (var m in l = arguments[k], l) Object.prototype.hasOwnProperty.call(l, m) && (j[m] = l[m]);
            return j
        },
        f = function() {
            function j(k, l) {
                for (var n, m = 0; m < l.length; m++) n = l[m], n.enumerable = n.enumerable || !1, n.configurable = !0, 'value' in n && (n.writable = !0), Object.defineProperty(k, n.key, n)
            }
            return function(k, l, m) {
                return l && j(k.prototype, l), m && j(k, m), k
            }
        }(),
        g = d.default || window.jQuery || window.$,
        h = function() {
            function j(k) {
                var l = this,
                    m = 1 < arguments.length && void 0 !== arguments[1] ? arguments[1] : {};
                c(this, j), this.$element = g(k), this.options = g.extend({}, g.fn.bootstrapSwitch.defaults, this._getElementOptions(), m), this.prevOptions = {}, this.$wrapper = g('<div>', {
                    class: function() {
                        var o = [];
                        return o.push(l.options.state ? 'on' : 'off'), l.options.size && o.push(l.options.size), l.options.disabled && o.push('disabled'), l.options.readonly && o.push('readonly'), l.options.indeterminate && o.push('indeterminate'), l.options.inverse && o.push('inverse'), l.$element.attr('id') && o.push('id-' + l.$element.attr('id')), o.map(l._getClass.bind(l)).concat([l.options.baseClass], l._getClasses(l.options.wrapperClass)).join(' ')
                    }
                }), this.$container = g('<div>', {
                    class: this._getClass('container')
                }), this.$on = g('<span>', {
                    html: this.options.onText,
                    class: this._getClass('handle-on') + ' ' + this._getClass(this.options.onColor)
                }), this.$off = g('<span>', {
                    html: this.options.offText,
                    class: this._getClass('handle-off') + ' ' + this._getClass(this.options.offColor)
                }), this.$label = g('<span>', {
                    html: this.options.labelText,
                    class: this._getClass('label')
                }), this.$element.on('init.bootstrapSwitch', this.options.onInit.bind(this, k)), this.$element.on('switchChange.bootstrapSwitch', function() {
                    for (var n = arguments.length, o = Array(n), p = 0; p < n; p++) o[p] = arguments[p];
                    !1 === l.options.onSwitchChange.apply(k, o) && (l.$element.is(':radio') ? g('[name="' + l.$element.attr('name') + '"]').trigger('previousState.bootstrapSwitch', !0) : l.$element.trigger('previousState.bootstrapSwitch', !0))
                }), this.$container = this.$element.wrap(this.$container).parent(), this.$wrapper = this.$container.wrap(this.$wrapper).parent(), this.$element.before(this.options.inverse ? this.$off : this.$on).before(this.$label).before(this.options.inverse ? this.$on : this.$off), this.options.indeterminate && this.$element.prop('indeterminate', !0), this._init(), this._elementHandlers(), this._handleHandlers(), this._labelHandlers(), this._formHandler(), this._externalLabelHandler(), this.$element.trigger('init.bootstrapSwitch', this.options.state)
            }
            return f(j, [{
                key: 'setPrevOptions',
                value: function() {
                    this.prevOptions = e({}, this.options)
                }
            }, {
                key: 'state',
                value: function(l, m) {
                    return 'undefined' == typeof l ? this.options.state : this.options.disabled || this.options.readonly || this.options.state && !this.options.radioAllOff && this.$element.is(':radio') ? this.$element : (this.$element.is(':radio') ? g('[name="' + this.$element.attr('name') + '"]').trigger('setPreviousOptions.bootstrapSwitch') : this.$element.trigger('setPreviousOptions.bootstrapSwitch'), this.options.indeterminate && this.indeterminate(!1), this.$element.prop('checked', !!l).trigger('change.bootstrapSwitch', m), this.$element)
                }
            }, {
                key: 'toggleState',
                value: function(l) {
                    return this.options.disabled || this.options.readonly ? this.$element : this.options.indeterminate ? (this.indeterminate(!1), this.state(!0)) : this.$element.prop('checked', !this.options.state).trigger('change.bootstrapSwitch', l)
                }
            }, {
                key: 'size',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.size : (null != this.options.size && this.$wrapper.removeClass(this._getClass(this.options.size)), l && this.$wrapper.addClass(this._getClass(l)), this._width(), this._containerPosition(), this.options.size = l, this.$element)
                }
            }, {
                key: 'animate',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.animate : this.options.animate === !!l ? this.$element : this.toggleAnimate()
                }
            }, {
                key: 'toggleAnimate',
                value: function() {
                    return this.options.animate = !this.options.animate, this.$wrapper.toggleClass(this._getClass('animate')), this.$element
                }
            }, {
                key: 'disabled',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.disabled : this.options.disabled === !!l ? this.$element : this.toggleDisabled()
                }
            }, {
                key: 'toggleDisabled',
                value: function() {
                    return this.options.disabled = !this.options.disabled, this.$element.prop('disabled', this.options.disabled), this.$wrapper.toggleClass(this._getClass('disabled')), this.$element
                }
            }, {
                key: 'readonly',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.readonly : this.options.readonly === !!l ? this.$element : this.toggleReadonly()
                }
            }, {
                key: 'toggleReadonly',
                value: function() {
                    return this.options.readonly = !this.options.readonly, this.$element.prop('readonly', this.options.readonly), this.$wrapper.toggleClass(this._getClass('readonly')), this.$element
                }
            }, {
                key: 'indeterminate',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.indeterminate : this.options.indeterminate === !!l ? this.$element : this.toggleIndeterminate()
                }
            }, {
                key: 'toggleIndeterminate',
                value: function() {
                    return this.options.indeterminate = !this.options.indeterminate, this.$element.prop('indeterminate', this.options.indeterminate), this.$wrapper.toggleClass(this._getClass('indeterminate')), this._containerPosition(), this.$element
                }
            }, {
                key: 'inverse',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.inverse : this.options.inverse === !!l ? this.$element : this.toggleInverse()
                }
            }, {
                key: 'toggleInverse',
                value: function() {
                    this.$wrapper.toggleClass(this._getClass('inverse'));
                    var l = this.$on.clone(!0),
                        m = this.$off.clone(!0);
                    return this.$on.replaceWith(m), this.$off.replaceWith(l), this.$on = m, this.$off = l, this.options.inverse = !this.options.inverse, this.$element
                }
            }, {
                key: 'onColor',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.onColor : (this.options.onColor && this.$on.removeClass(this._getClass(this.options.onColor)), this.$on.addClass(this._getClass(l)), this.options.onColor = l, this.$element)
                }
            }, {
                key: 'offColor',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.offColor : (this.options.offColor && this.$off.removeClass(this._getClass(this.options.offColor)), this.$off.addClass(this._getClass(l)), this.options.offColor = l, this.$element)
                }
            }, {
                key: 'onText',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.onText : (this.$on.html(l), this._width(), this._containerPosition(), this.options.onText = l, this.$element)
                }
            }, {
                key: 'offText',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.offText : (this.$off.html(l), this._width(), this._containerPosition(), this.options.offText = l, this.$element)
                }
            }, {
                key: 'labelText',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.labelText : (this.$label.html(l), this._width(), this.options.labelText = l, this.$element)
                }
            }, {
                key: 'handleWidth',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.handleWidth : (this.options.handleWidth = l, this._width(), this._containerPosition(), this.$element)
                }
            }, {
                key: 'labelWidth',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.labelWidth : (this.options.labelWidth = l, this._width(), this._containerPosition(), this.$element)
                }
            }, {
                key: 'baseClass',
                value: function() {
                    return this.options.baseClass
                }
            }, {
                key: 'wrapperClass',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.wrapperClass : (l || (l = g.fn.bootstrapSwitch.defaults.wrapperClass), this.$wrapper.removeClass(this._getClasses(this.options.wrapperClass).join(' ')), this.$wrapper.addClass(this._getClasses(l).join(' ')), this.options.wrapperClass = l, this.$element)
                }
            }, {
                key: 'radioAllOff',
                value: function(l) {
                    if ('undefined' == typeof l) return this.options.radioAllOff;
                    var m = !!l;
                    return this.options.radioAllOff === m ? this.$element : (this.options.radioAllOff = m, this.$element)
                }
            }, {
                key: 'onInit',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.onInit : (l || (l = g.fn.bootstrapSwitch.defaults.onInit), this.options.onInit = l, this.$element)
                }
            }, {
                key: 'onSwitchChange',
                value: function(l) {
                    return 'undefined' == typeof l ? this.options.onSwitchChange : (l || (l = g.fn.bootstrapSwitch.defaults.onSwitchChange), this.options.onSwitchChange = l, this.$element)
                }
            }, {
                key: 'destroy',
                value: function() {
                    var l = this.$element.closest('form');
                    return l.length && l.off('reset.bootstrapSwitch').removeData('bootstrap-switch'), this.$container.children().not(this.$element).remove(), this.$element.unwrap().unwrap().off('.bootstrapSwitch').removeData('bootstrap-switch'), this.$element
                }
            }, {
                key: '_getElementOptions',
                value: function() {
                    return {
                        state: this.$element.is(':checked'),
                        size: this.$element.data('size'),
                        animate: this.$element.data('animate'),
                        disabled: this.$element.is(':disabled'),
                        readonly: this.$element.is('[readonly]'),
                        indeterminate: this.$element.data('indeterminate'),
                        inverse: this.$element.data('inverse'),
                        radioAllOff: this.$element.data('radio-all-off'),
                        onColor: this.$element.data('on-color'),
                        offColor: this.$element.data('off-color'),
                        onText: this.$element.data('on-text'),
                        offText: this.$element.data('off-text'),
                        labelText: this.$element.data('label-text'),
                        handleWidth: this.$element.data('handle-width'),
                        labelWidth: this.$element.data('label-width'),
                        baseClass: this.$element.data('base-class'),
                        wrapperClass: this.$element.data('wrapper-class')
                    }
                }
            }, {
                key: '_width',
                value: function() {
                    var l = this,
                        m = this.$on.add(this.$off).add(this.$label).css('width', ''),
                        n = 'auto' === this.options.handleWidth ? Math.round(Math.max(this.$on.width(), this.$off.width())) : this.options.handleWidth;
                    return m.width(n), this.$label.width(function(o, p) {
                        return 'auto' === l.options.labelWidth ? p < n ? n : p : l.options.labelWidth
                    }), this._handleWidth = this.$on.outerWidth(), this._labelWidth = this.$label.outerWidth(), this.$container.width(2 * this._handleWidth + this._labelWidth), this.$wrapper.width(this._handleWidth + this._labelWidth)
                }
            }, {
                key: '_containerPosition',
                value: function() {
                    var l = this,
                        m = 0 < arguments.length && void 0 !== arguments[0] ? arguments[0] : this.options.state,
                        n = arguments[1];
                    this.$container.css('margin-left', function() {
                        var o = [0, '-' + l._handleWidth + 'px'];
                        return l.options.indeterminate ? '-' + l._handleWidth / 2 + 'px' : m ? l.options.inverse ? o[1] : o[0] : l.options.inverse ? o[0] : o[1]
                    })
                }
            }, {
                key: '_init',
                value: function() {
                    var l = this,
                        m = function() {
                            l.setPrevOptions(), l._width(), l._containerPosition(), setTimeout(function() {
                                if (l.options.animate) return l.$wrapper.addClass(l._getClass('animate'))
                            }, 50)
                        };
                    if (this.$wrapper.is(':visible')) return void m();
                    var n = window.setInterval(function() {
                        if (l.$wrapper.is(':visible')) return m(), window.clearInterval(n)
                    }, 50)
                }
            }, {
                key: '_elementHandlers',
                value: function() {
                    var l = this;
                    return this.$element.on({
                        'setPreviousOptions.bootstrapSwitch': this.setPrevOptions.bind(this),
                        'previousState.bootstrapSwitch': function() {
                            l.options = l.prevOptions, l.options.indeterminate && l.$wrapper.addClass(l._getClass('indeterminate')), l.$element.prop('checked', l.options.state).trigger('change.bootstrapSwitch', !0)
                        },
                        'change.bootstrapSwitch': function(n, o) {
                            n.preventDefault(), n.stopImmediatePropagation();
                            var p = l.$element.is(':checked');
                            l._containerPosition(p), p === l.options.state || (l.options.state = p, l.$wrapper.toggleClass(l._getClass('off')).toggleClass(l._getClass('on')), !o && (l.$element.is(':radio') && g('[name="' + l.$element.attr('name') + '"]').not(l.$element).prop('checked', !1).trigger('change.bootstrapSwitch', !0), l.$element.trigger('switchChange.bootstrapSwitch', [p])))
                        },
                        'focus.bootstrapSwitch': function(n) {
                            n.preventDefault(), l.$wrapper.addClass(l._getClass('focused'))
                        },
                        'blur.bootstrapSwitch': function(n) {
                            n.preventDefault(), l.$wrapper.removeClass(l._getClass('focused'))
                        },
                        'keydown.bootstrapSwitch': function(n) {
                            !n.which || l.options.disabled || l.options.readonly || (37 === n.which || 39 === n.which) && (n.preventDefault(), n.stopImmediatePropagation(), l.state(39 === n.which))
                        }
                    })
                }
            }, {
                key: '_handleHandlers',
                value: function() {
                    var l = this;
                    return this.$on.on('click.bootstrapSwitch', function(m) {
                        return m.preventDefault(), m.stopPropagation(), l.state(!1), l.$element.trigger('focus.bootstrapSwitch')
                    }), this.$off.on('click.bootstrapSwitch', function(m) {
                        return m.preventDefault(), m.stopPropagation(), l.state(!0), l.$element.trigger('focus.bootstrapSwitch')
                    })
                }
            }, {
                key: '_labelHandlers',
                value: function() {
                    var l = this;
                    this.$label.on({
                        click: function(o) {
                            o.stopPropagation()
                        },
                        'mousedown.bootstrapSwitch touchstart.bootstrapSwitch': function(o) {
                            l._dragStart || l.options.disabled || l.options.readonly || (o.preventDefault(), o.stopPropagation(), l._dragStart = (o.pageX || o.originalEvent.touches[0].pageX) - parseInt(l.$container.css('margin-left'), 10), l.options.animate && l.$wrapper.removeClass(l._getClass('animate')), l.$element.trigger('focus.bootstrapSwitch'))
                        },
                        'mousemove.bootstrapSwitch touchmove.bootstrapSwitch': function(o) {
                            if (null != l._dragStart) {
                                var p = (o.pageX || o.originalEvent.touches[0].pageX) - l._dragStart;
                                o.preventDefault(), p < -l._handleWidth || 0 < p || (l._dragEnd = p, l.$container.css('margin-left', l._dragEnd + 'px'))
                            }
                        },
                        'mouseup.bootstrapSwitch touchend.bootstrapSwitch': function(o) {
                            if (l._dragStart) {
                                if (o.preventDefault(), l.options.animate && l.$wrapper.addClass(l._getClass('animate')), l._dragEnd) {
                                    var p = l._dragEnd > -(l._handleWidth / 2);
                                    l._dragEnd = !1, l.state(l.options.inverse ? !p : p)
                                } else l.state(!l.options.state);
                                l._dragStart = !1
                            }
                        },
                        'mouseleave.bootstrapSwitch': function() {
                            l.$label.trigger('mouseup.bootstrapSwitch')
                        }
                    })
                }
            }, {
                key: '_externalLabelHandler',
                value: function() {
                    var l = this,
                        m = this.$element.closest('label');
                    m.on('click', function(n) {
                        n.preventDefault(), n.stopImmediatePropagation(), n.target === m[0] && l.toggleState()
                    })
                }
            }, {
                key: '_formHandler',
                value: function() {
                    var l = this.$element.closest('form');
                    l.data('bootstrap-switch') || l.on('reset.bootstrapSwitch', function() {
                        window.setTimeout(function() {
                            l.find('input').filter(function() {
                                return g(this).data('bootstrap-switch')
                            }).each(function() {
                                return g(this).bootstrapSwitch('state', this.checked)
                            })
                        }, 1)
                    }).data('bootstrap-switch', !0)
                }
            }, {
                key: '_getClass',
                value: function(l) {
                    return this.options.baseClass + '-' + l
                }
            }, {
                key: '_getClasses',
                value: function(l) {
                    return g.isArray(l) ? l.map(this._getClass.bind(this)) : [this._getClass(l)]
                }
            }]), j
        }();
    g.fn.bootstrapSwitch = function(j) {
        for (var l = arguments.length, m = Array(1 < l ? l - 1 : 0), n = 1; n < l; n++) m[n - 1] = arguments[n];
        return Array.prototype.reduce.call(this, function(o, p) {
            var q = g(p),
                r = q.data('bootstrap-switch'),
                s = r || new h(p, j);
            return r || q.data('bootstrap-switch', s), 'string' == typeof j ? s[j].apply(s, m) : o
        }, this)
    }, g.fn.bootstrapSwitch.Constructor = h, g.fn.bootstrapSwitch.defaults = {
        state: !0,
        size: null,
        animate: !0,
        disabled: !1,
        readonly: !1,
        indeterminate: !1,
        inverse: !1,
        radioAllOff: !1,
        onColor: 'primary',
        offColor: 'default',
        onText: 'ON',
        offText: 'OFF',
        labelText: '&nbsp',
        handleWidth: 'auto',
        labelWidth: 'auto',
        baseClass: 'bootstrap-switch',
        wrapperClass: 'wrapper',
        onInit: function() {},
        onSwitchChange: function() {}
    }
});
/* Chartist.js 0.9.4
 * Copyright © 2015 Gion Kunz
 * Free to use under the WTFPL license.
 * http://www.wtfpl.net/
 */

! function (a, b) {
    "function" == typeof define && define.amd ? define([], function () {
        return a.Chartist = b()
    }) : "object" == typeof exports ? module.exports = b() : a.Chartist = b()
}(this, function () {
    var a = {
        version: "0.9.4"
    };
    return function (a, b, c) {
            "use strict";
            c.noop = function (a) {
                return a
            }, c.alphaNumerate = function (a) {
                return String.fromCharCode(97 + a % 26)
            }, c.extend = function (a) {
                a = a || {};
                var b = Array.prototype.slice.call(arguments, 1);
                return b.forEach(function (b) {
                    for (var d in b) "object" != typeof b[d] || null === b[d] || b[d] instanceof Array ? a[d] = b[d] : a[d] = c.extend({}, a[d], b[d])
                }), a
            }, c.replaceAll = function (a, b, c) {
                return a.replace(new RegExp(b, "g"), c)
            }, c.stripUnit = function (a) {
                return "string" == typeof a && (a = a.replace(/[^0-9\+-\.]/g, "")), +a
            }, c.ensureUnit = function (a, b) {
                return "number" == typeof a && (a += b), a
            }, c.querySelector = function (a) {
                return a instanceof Node ? a : b.querySelector(a)
            }, c.times = function (a) {
                return Array.apply(null, new Array(a))
            }, c.sum = function (a, b) {
                return a + (b ? b : 0)
            }, c.mapMultiply = function (a) {
                return function (b) {
                    return b * a
                }
            }, c.mapAdd = function (a) {
                return function (b) {
                    return b + a
                }
            }, c.serialMap = function (a, b) {
                var d = [],
                    e = Math.max.apply(null, a.map(function (a) {
                        return a.length
                    }));
                return c.times(e).forEach(function (c, e) {
                    var f = a.map(function (a) {
                        return a[e]
                    });
                    d[e] = b.apply(null, f)
                }), d
            }, c.roundWithPrecision = function (a, b) {
                var d = Math.pow(10, b || c.precision);
                return Math.round(a * d) / d
            }, c.precision = 8, c.escapingMap = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }, c.serialize = function (a) {
                return null === a || void 0 === a ? a : ("number" == typeof a ? a = "" + a : "object" == typeof a && (a = JSON.stringify({
                    data: a
                })), Object.keys(c.escapingMap).reduce(function (a, b) {
                    return c.replaceAll(a, b, c.escapingMap[b])
                }, a))
            }, c.deserialize = function (a) {
                if ("string" != typeof a) return a;
                a = Object.keys(c.escapingMap).reduce(function (a, b) {
                    return c.replaceAll(a, c.escapingMap[b], b)
                }, a);
                try {
                    a = JSON.parse(a), a = void 0 !== a.data ? a.data : a
                } catch (b) {}
                return a
            }, c.createSvg = function (a, b, d, e) {
                var f;
                return b = b || "100%", d = d || "100%", Array.prototype.slice.call(a.querySelectorAll("svg")).filter(function (a) {
                    return a.getAttributeNS("http://www.w3.org/2000/xmlns/", c.xmlNs.prefix)
                }).forEach(function (b) {
                    a.removeChild(b)
                }), f = new c.Svg("svg").attr({
                    width: b,
                    height: d
                }).addClass(e).attr({
                    style: "width: " + b + "; height: " + d + ";"
                }), a.appendChild(f._node), f
            }, c.reverseData = function (a) {
                a.labels.reverse(), a.series.reverse();
                for (var b = 0; b < a.series.length; b++) "object" == typeof a.series[b] && void 0 !== a.series[b].data ? a.series[b].data.reverse() : a.series[b] instanceof Array && a.series[b].reverse()
            }, c.getDataArray = function (a, b, d) {
                function e(a) {
                    if (c.isFalseyButZero(a)) return void 0;
                    if ((a.data || a) instanceof Array) return (a.data || a).map(e);
                    if (a.hasOwnProperty("value")) return e(a.value);
                    if (d) {
                        var b = {};
                        return "string" == typeof d ? b[d] = c.getNumberOrUndefined(a) : b.y = c.getNumberOrUndefined(a), b.x = a.hasOwnProperty("x") ? c.getNumberOrUndefined(a.x) : b.x, b.y = a.hasOwnProperty("y") ? c.getNumberOrUndefined(a.y) : b.y, b
                    }
                    return c.getNumberOrUndefined(a)
                }
                return (b && !a.reversed || !b && a.reversed) && (c.reverseData(a), a.reversed = !a.reversed), a.series.map(e)
            }, c.normalizePadding = function (a, b) {
                return b = b || 0, "number" == typeof a ? {
                    top: a,
                    right: a,
                    bottom: a,
                    left: a
                } : {
                    top: "number" == typeof a.top ? a.top : b,
                    right: "number" == typeof a.right ? a.right : b,
                    bottom: "number" == typeof a.bottom ? a.bottom : b,
                    left: "number" == typeof a.left ? a.left : b
                }
            }, c.getMetaData = function (a, b) {
                var d = a.data ? a.data[b] : a[b];
                return d ? c.serialize(d.meta) : void 0
            }, c.orderOfMagnitude = function (a) {
                return Math.floor(Math.log(Math.abs(a)) / Math.LN10)
            }, c.projectLength = function (a, b, c) {
                return b / c.range * a
            }, c.getAvailableHeight = function (a, b) {
                return Math.max((c.stripUnit(b.height) || a.height()) - (b.chartPadding.top + b.chartPadding.bottom) - b.axisX.offset, 0)
            }, c.getHighLow = function (a, b, d) {
                function e(a) {
                    if (void 0 === a) return void 0;
                    if (a instanceof Array)
                        for (var b = 0; b < a.length; b++) e(a[b]);
                    else {
                        var c = d ? +a[d] : +a;
                        g && c > f.high && (f.high = c), h && c < f.low && (f.low = c)
                    }
                }
                b = c.extend({}, b, d ? b["axis" + d.toUpperCase()] : {});
                var f = {
                        high: void 0 === b.high ? -Number.MAX_VALUE : +b.high,
                        low: void 0 === b.low ? Number.MAX_VALUE : +b.low
                    },
                    g = void 0 === b.high,
                    h = void 0 === b.low;
                return (g || h) && e(a), (b.referenceValue || 0 === b.referenceValue) && (f.high = Math.max(b.referenceValue, f.high), f.low = Math.min(b.referenceValue, f.low)), f.high <= f.low && (0 === f.low ? f.high = 1 : f.low < 0 ? f.high = 0 : f.low = 0), f
            }, c.isNum = function (a) {
                return !isNaN(a) && isFinite(a)
            }, c.isFalseyButZero = function (a) {
                return !a && 0 !== a
            }, c.getNumberOrUndefined = function (a) {
                return isNaN(+a) ? void 0 : +a
            }, c.getMultiValue = function (a, b) {
                return c.isNum(a) ? +a : a ? a[b || "y"] || 0 : 0
            }, c.rho = function (a) {
                function b(a, c) {
                    return a % c === 0 ? c : b(c, a % c)
                }

                function c(a) {
                    return a * a + 1
                }
                if (1 === a) return a;
                var d, e = 2,
                    f = 2;
                if (a % 2 === 0) return 2;
                do e = c(e) % a, f = c(c(f)) % a, d = b(Math.abs(e - f), a); while (1 === d);
                return d
            }, c.getBounds = function (a, b, d, e) {
                var f, g, h, i = 0,
                    j = {
                        high: b.high,
                        low: b.low
                    };
                j.valueRange = j.high - j.low, j.oom = c.orderOfMagnitude(j.valueRange), j.step = Math.pow(10, j.oom), j.min = Math.floor(j.low / j.step) * j.step, j.max = Math.ceil(j.high / j.step) * j.step, j.range = j.max - j.min, j.numberOfSteps = Math.round(j.range / j.step);
                var k = c.projectLength(a, j.step, j),
                    l = d > k,
                    m = e ? c.rho(j.range) : 0;
                if (e && c.projectLength(a, 1, j) >= d) j.step = 1;
                else if (e && m < j.step && c.projectLength(a, m, j) >= d) j.step = m;
                else
                    for (;;) {
                        if (l && c.projectLength(a, j.step, j) <= d) j.step *= 2;
                        else {
                            if (l || !(c.projectLength(a, j.step / 2, j) >= d)) break;
                            if (j.step /= 2, e && j.step % 1 !== 0) {
                                j.step *= 2;
                                break
                            }
                        }
                        if (i++ > 1e3) throw new Error("Exceeded maximum number of iterations while optimizing scale step!")
                    }
                for (g = j.min, h = j.max; g + j.step <= j.low;) g += j.step;
                for (; h - j.step >= j.high;) h -= j.step;
                for (j.min = g, j.max = h, j.range = j.max - j.min, j.values = [], f = j.min; f <= j.max; f += j.step) j.values.push(c.roundWithPrecision(f));
                return j
            }, c.polarToCartesian = function (a, b, c, d) {
                var e = (d - 90) * Math.PI / 180;
                return {
                    x: a + c * Math.cos(e),
                    y: b + c * Math.sin(e)
                }
            }, c.createChartRect = function (a, b, d) {
                var e = !(!b.axisX && !b.axisY),
                    f = e ? b.axisY.offset : 0,
                    g = e ? b.axisX.offset : 0,
                    h = a.width() || c.stripUnit(b.width) || 0,
                    i = a.height() || c.stripUnit(b.height) || 0,
                    j = c.normalizePadding(b.chartPadding, d);
                h = Math.max(h, f + j.left + j.right), i = Math.max(i, g + j.top + j.bottom);
                var k = {
                    padding: j,
                    width: function () {
                        return this.x2 - this.x1
                    },
                    height: function () {
                        return this.y1 - this.y2
                    }
                };
                return e ? ("start" === b.axisX.position ? (k.y2 = j.top + g, k.y1 = Math.max(i - j.bottom, k.y2 + 1)) : (k.y2 = j.top, k.y1 = Math.max(i - j.bottom - g, k.y2 + 1)), "start" === b.axisY.position ? (k.x1 = j.left + f, k.x2 = Math.max(h - j.right, k.x1 + 1)) : (k.x1 = j.left, k.x2 = Math.max(h - j.right - f, k.x1 + 1))) : (k.x1 = j.left, k.x2 = Math.max(h - j.right, k.x1 + 1), k.y2 = j.top, k.y1 = Math.max(i - j.bottom, k.y2 + 1)), k
            }, c.createGrid = function (a, b, d, e, f, g, h, i) {
                var j = {};
                j[d.units.pos + "1"] = a, j[d.units.pos + "2"] = a, j[d.counterUnits.pos + "1"] = e, j[d.counterUnits.pos + "2"] = e + f;
                var k = g.elem("line", j, h.join(" "));
                i.emit("draw", c.extend({
                    type: "grid",
                    axis: d,
                    index: b,
                    group: g,
                    element: k
                }, j))
            }, c.createLabel = function (a, b, d, e, f, g, h, i, j, k, l) {
                var m, n = {};
                if (n[f.units.pos] = a + h[f.units.pos], n[f.counterUnits.pos] = h[f.counterUnits.pos], n[f.units.len] = b, n[f.counterUnits.len] = g - 10, k) {
                    var o = '<span class="' + j.join(" ") + '" style="' + f.units.len + ": " + Math.round(n[f.units.len]) + "px; " + f.counterUnits.len + ": " + Math.round(n[f.counterUnits.len]) + 'px">' + e[d] + "</span>";
                    m = i.foreignObject(o, c.extend({
                        style: "overflow: visible;"
                    }, n))
                } else m = i.elem("text", n, j.join(" ")).text(e[d]);
                l.emit("draw", c.extend({
                    type: "label",
                    axis: f,
                    index: d,
                    group: i,
                    element: m,
                    text: e[d]
                }, n))
            }, c.getSeriesOption = function (a, b, c) {
                if (a.name && b.series && b.series[a.name]) {
                    var d = b.series[a.name];
                    return d.hasOwnProperty(c) ? d[c] : b[c]
                }
                return b[c]
            }, c.optionsProvider = function (b, d, e) {
                function f(b) {
                    var f = h;
                    if (h = c.extend({}, j), d)
                        for (i = 0; i < d.length; i++) {
                            var g = a.matchMedia(d[i][0]);
                            g.matches && (h = c.extend(h, d[i][1]))
                        }
                    e && !b && e.emit("optionsChanged", {
                        previousOptions: f,
                        currentOptions: h
                    })
                }

                function g() {
                    k.forEach(function (a) {
                        a.removeListener(f)
                    })
                }
                var h, i, j = c.extend({}, b),
                    k = [];
                if (!a.matchMedia) throw "window.matchMedia not found! Make sure you're using a polyfill.";
                if (d)
                    for (i = 0; i < d.length; i++) {
                        var l = a.matchMedia(d[i][0]);
                        l.addListener(f), k.push(l)
                    }
                return f(!0), {
                    removeMediaQueryListeners: g,
                    getCurrentOptions: function () {
                        return c.extend({}, h)
                    }
                }
            }
        }(window, document, a),
        function (a, b, c) {
            "use strict";
            c.Interpolation = {}, c.Interpolation.none = function () {
                return function (a, b) {
                    for (var d = new c.Svg.Path, e = !0, f = 1; f < a.length; f += 2) {
                        var g = b[(f - 1) / 2];
                        void 0 === g.value ? e = !0 : e ? (d.move(a[f - 1], a[f], !1, g), e = !1) : d.line(a[f - 1], a[f], !1, g)
                    }
                    return d
                }
            }, c.Interpolation.simple = function (a) {
                var b = {
                    divisor: 2
                };
                a = c.extend({}, b, a);
                var d = 1 / Math.max(1, a.divisor);
                return function (a, b) {
                    for (var e = new c.Svg.Path, f = !0, g = 2; g < a.length; g += 2) {
                        var h = a[g - 2],
                            i = a[g - 1],
                            j = a[g],
                            k = a[g + 1],
                            l = (j - h) * d,
                            m = b[g / 2 - 1],
                            n = b[g / 2];
                        void 0 === m.value ? f = !0 : (f && e.move(h, i, !1, m), void 0 !== n.value && (e.curve(h + l, i, j - l, k, j, k, !1, n), f = !1))
                    }
                    return e
                }
            }, c.Interpolation.cardinal = function (a) {
                function b(a, b) {
                    for (var c = [], d = !0, e = 0; e < a.length; e += 2) void 0 === b[e / 2].value ? d = !0 : (d && (c.push({
                        pathCoordinates: [],
                        valueData: []
                    }), d = !1), c[c.length - 1].pathCoordinates.push(a[e], a[e + 1]), c[c.length - 1].valueData.push(b[e / 2]));
                    return c
                }
                var d = {
                    tension: 1
                };
                a = c.extend({}, d, a);
                var e = Math.min(1, Math.max(0, a.tension)),
                    f = 1 - e;
                return function g(a, d) {
                    var h = b(a, d);
                    if (h.length > 1) {
                        var i = [];
                        return h.forEach(function (a) {
                            i.push(g(a.pathCoordinates, a.valueData))
                        }), c.Svg.Path.join(i)
                    }
                    if (a = h[0].pathCoordinates, d = h[0].valueData, a.length <= 4) return c.Interpolation.none()(a, d);
                    for (var j, k = (new c.Svg.Path).move(a[0], a[1], !1, d[0]), l = 0, m = a.length; m - 2 * !j > l; l += 2) {
                        var n = [{
                            x: +a[l - 2],
                            y: +a[l - 1]
                        }, {
                            x: +a[l],
                            y: +a[l + 1]
                        }, {
                            x: +a[l + 2],
                            y: +a[l + 3]
                        }, {
                            x: +a[l + 4],
                            y: +a[l + 5]
                        }];
                        j ? l ? m - 4 === l ? n[3] = {
                            x: +a[0],
                            y: +a[1]
                        } : m - 2 === l && (n[2] = {
                            x: +a[0],
                            y: +a[1]
                        }, n[3] = {
                            x: +a[2],
                            y: +a[3]
                        }) : n[0] = {
                            x: +a[m - 2],
                            y: +a[m - 1]
                        } : m - 4 === l ? n[3] = n[2] : l || (n[0] = {
                            x: +a[l],
                            y: +a[l + 1]
                        }), k.curve(e * (-n[0].x + 6 * n[1].x + n[2].x) / 6 + f * n[2].x, e * (-n[0].y + 6 * n[1].y + n[2].y) / 6 + f * n[2].y, e * (n[1].x + 6 * n[2].x - n[3].x) / 6 + f * n[2].x, e * (n[1].y + 6 * n[2].y - n[3].y) / 6 + f * n[2].y, n[2].x, n[2].y, !1, d[(l + 2) / 2])
                    }
                    return k
                }
            }, c.Interpolation.step = function (a) {
                var b = {
                    postpone: !0
                };
                return a = c.extend({}, b, a),
                    function (b, d) {
                        for (var e = new c.Svg.Path, f = !0, g = 2; g < b.length; g += 2) {
                            var h = b[g - 2],
                                i = b[g - 1],
                                j = b[g],
                                k = b[g + 1],
                                l = d[g / 2 - 1],
                                m = d[g / 2];
                            void 0 === l.value ? f = !0 : (f && e.move(h, i, !1, l), void 0 !== m.value && (a.postpone ? e.line(j, i, !1, l) : e.line(h, k, !1, m), e.line(j, k, !1, m), f = !1))
                        }
                        return e
                    }
            }
        }(window, document, a),
        function (a, b, c) {
            "use strict";
            c.EventEmitter = function () {
                function a(a, b) {
                    d[a] = d[a] || [], d[a].push(b)
                }

                function b(a, b) {
                    d[a] && (b ? (d[a].splice(d[a].indexOf(b), 1), 0 === d[a].length && delete d[a]) : delete d[a])
                }

                function c(a, b) {
                    d[a] && d[a].forEach(function (a) {
                        a(b)
                    }), d["*"] && d["*"].forEach(function (c) {
                        c(a, b)
                    })
                }
                var d = [];
                return {
                    addEventHandler: a,
                    removeEventHandler: b,
                    emit: c
                }
            }
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a) {
                var b = [];
                if (a.length)
                    for (var c = 0; c < a.length; c++) b.push(a[c]);
                return b
            }

            function e(a, b) {
                var d = b || this.prototype || c.Class,
                    e = Object.create(d);
                c.Class.cloneDefinitions(e, a);
                var f = function () {
                    var a, b = e.constructor || function () {};
                    return a = this === c ? Object.create(e) : this, b.apply(a, Array.prototype.slice.call(arguments, 0)), a
                };
                return f.prototype = e, f["super"] = d, f.extend = this.extend, f
            }

            function f() {
                var a = d(arguments),
                    b = a[0];
                return a.splice(1, a.length - 1).forEach(function (a) {
                    Object.getOwnPropertyNames(a).forEach(function (c) {
                        delete b[c], Object.defineProperty(b, c, Object.getOwnPropertyDescriptor(a, c))
                    })
                }), b
            }
            c.Class = {
                extend: e,
                cloneDefinitions: f
            }
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, b, d) {
                return a && (this.data = a, this.eventEmitter.emit("data", {
                    type: "update",
                    data: this.data
                })), b && (this.options = c.extend({}, d ? this.options : this.defaultOptions, b), this.initializeTimeoutId || (this.optionsProvider.removeMediaQueryListeners(), this.optionsProvider = c.optionsProvider(this.options, this.responsiveOptions, this.eventEmitter))), this.initializeTimeoutId || this.createChart(this.optionsProvider.getCurrentOptions()), this
            }

            function e() {
                return this.initializeTimeoutId ? a.clearTimeout(this.initializeTimeoutId) : (a.removeEventListener("resize", this.resizeListener), this.optionsProvider.removeMediaQueryListeners()), this
            }

            function f(a, b) {
                return this.eventEmitter.addEventHandler(a, b), this
            }

            function g(a, b) {
                return this.eventEmitter.removeEventHandler(a, b), this
            }

            function h() {
                a.addEventListener("resize", this.resizeListener), this.optionsProvider = c.optionsProvider(this.options, this.responsiveOptions, this.eventEmitter), this.eventEmitter.addEventHandler("optionsChanged", function () {
                    this.update()
                }.bind(this)), this.options.plugins && this.options.plugins.forEach(function (a) {
                    a instanceof Array ? a[0](this, a[1]) : a(this)
                }.bind(this)), this.eventEmitter.emit("data", {
                    type: "initial",
                    data: this.data
                }), this.createChart(this.optionsProvider.getCurrentOptions()), this.initializeTimeoutId = void 0
            }

            function i(a, b, d, e, f) {
                this.container = c.querySelector(a), this.data = b, this.defaultOptions = d, this.options = e, this.responsiveOptions = f, this.eventEmitter = c.EventEmitter(), this.supportsForeignObject = c.Svg.isSupported("Extensibility"), this.supportsAnimations = c.Svg.isSupported("AnimationEventsAttribute"), this.resizeListener = function () {
                    this.update()
                }.bind(this), this.container && (this.container.__chartist__ && this.container.__chartist__.detach(), this.container.__chartist__ = this), this.initializeTimeoutId = setTimeout(h.bind(this), 0)
            }
            c.Base = c.Class.extend({
                constructor: i,
                optionsProvider: void 0,
                container: void 0,
                svg: void 0,
                eventEmitter: void 0,
                createChart: function () {
                    throw new Error("Base chart type can't be instantiated!")
                },
                update: d,
                detach: e,
                on: f,
                off: g,
                version: c.version,
                supportsForeignObject: !1
            })
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, d, e, f, g) {
                a instanceof Element ? this._node = a : (this._node = b.createElementNS(z, a), "svg" === a && this._node.setAttributeNS(A, c.xmlNs.qualifiedName, c.xmlNs.uri)), d && this.attr(d), e && this.addClass(e), f && (g && f._node.firstChild ? f._node.insertBefore(this._node, f._node.firstChild) : f._node.appendChild(this._node))
            }

            function e(a, b) {
                return "string" == typeof a ? b ? this._node.getAttributeNS(b, a) : this._node.getAttribute(a) : (Object.keys(a).forEach(function (d) {
                    void 0 !== a[d] && (b ? this._node.setAttributeNS(b, [c.xmlNs.prefix, ":", d].join(""), a[d]) : this._node.setAttribute(d, a[d]))
                }.bind(this)), this)
            }

            function f(a, b, d, e) {
                return new c.Svg(a, b, d, this, e)
            }

            function g() {
                return this._node.parentNode instanceof SVGElement ? new c.Svg(this._node.parentNode) : null
            }

            function h() {
                for (var a = this._node;
                    "svg" !== a.nodeName;) a = a.parentNode;
                return new c.Svg(a)
            }

            function i(a) {
                var b = this._node.querySelector(a);
                return b ? new c.Svg(b) : null
            }

            function j(a) {
                var b = this._node.querySelectorAll(a);
                return b.length ? new c.Svg.List(b) : null
            }

            function k(a, c, d, e) {
                if ("string" == typeof a) {
                    var f = b.createElement("div");
                    f.innerHTML = a, a = f.firstChild
                }
                a.setAttribute("xmlns", B);
                var g = this.elem("foreignObject", c, d, e);
                return g._node.appendChild(a), g
            }

            function l(a) {
                return this._node.appendChild(b.createTextNode(a)), this
            }

            function m() {
                for (; this._node.firstChild;) this._node.removeChild(this._node.firstChild);
                return this
            }

            function n() {
                return this._node.parentNode.removeChild(this._node), this.parent()
            }

            function o(a) {
                return this._node.parentNode.replaceChild(a._node, this._node), a
            }

            function p(a, b) {
                return b && this._node.firstChild ? this._node.insertBefore(a._node, this._node.firstChild) : this._node.appendChild(a._node), this
            }

            function q() {
                return this._node.getAttribute("class") ? this._node.getAttribute("class").trim().split(/\s+/) : []
            }

            function r(a) {
                return this._node.setAttribute("class", this.classes(this._node).concat(a.trim().split(/\s+/)).filter(function (a, b, c) {
                    return c.indexOf(a) === b
                }).join(" ")), this
            }

            function s(a) {
                var b = a.trim().split(/\s+/);
                return this._node.setAttribute("class", this.classes(this._node).filter(function (a) {
                    return -1 === b.indexOf(a)
                }).join(" ")), this
            }

            function t() {
                return this._node.setAttribute("class", ""), this
            }

            function u(a, b) {
                try {
                    return a.getBBox()[b]
                } catch (c) {}
                return 0
            }

            function v() {
                return this._node.clientHeight || Math.round(u(this._node, "height")) || this._node.parentNode.clientHeight
            }

            function w() {
                return this._node.clientWidth || Math.round(u(this._node, "width")) || this._node.parentNode.clientWidth
            }

            function x(a, b, d) {
                return void 0 === b && (b = !0), Object.keys(a).forEach(function (e) {
                    function f(a, b) {
                        var f, g, h, i = {};
                        a.easing && (h = a.easing instanceof Array ? a.easing : c.Svg.Easing[a.easing], delete a.easing), a.begin = c.ensureUnit(a.begin, "ms"), a.dur = c.ensureUnit(a.dur, "ms"), h && (a.calcMode = "spline", a.keySplines = h.join(" "), a.keyTimes = "0;1"), b && (a.fill = "freeze", i[e] = a.from, this.attr(i), g = c.stripUnit(a.begin || 0), a.begin = "indefinite"), f = this.elem("animate", c.extend({
                            attributeName: e
                        }, a)), b && setTimeout(function () {
                            try {
                                f._node.beginElement()
                            } catch (b) {
                                i[e] = a.to, this.attr(i), f.remove()
                            }
                        }.bind(this), g), d && f._node.addEventListener("beginEvent", function () {
                            d.emit("animationBegin", {
                                element: this,
                                animate: f._node,
                                params: a
                            })
                        }.bind(this)), f._node.addEventListener("endEvent", function () {
                            d && d.emit("animationEnd", {
                                element: this,
                                animate: f._node,
                                params: a
                            }), b && (i[e] = a.to, this.attr(i), f.remove())
                        }.bind(this))
                    }
                    a[e] instanceof Array ? a[e].forEach(function (a) {
                        f.bind(this)(a, !1)
                    }.bind(this)) : f.bind(this)(a[e], b)
                }.bind(this)), this
            }

            function y(a) {
                var b = this;
                this.svgElements = [];
                for (var d = 0; d < a.length; d++) this.svgElements.push(new c.Svg(a[d]));
                Object.keys(c.Svg.prototype).filter(function (a) {
                    return -1 === ["constructor", "parent", "querySelector", "querySelectorAll", "replace", "append", "classes", "height", "width"].indexOf(a)
                }).forEach(function (a) {
                    b[a] = function () {
                        var d = Array.prototype.slice.call(arguments, 0);
                        return b.svgElements.forEach(function (b) {
                            c.Svg.prototype[a].apply(b, d)
                        }), b
                    }
                })
            }
            var z = "http://www.w3.org/2000/svg",
                A = "http://www.w3.org/2000/xmlns/",
                B = "http://www.w3.org/1999/xhtml";
            c.xmlNs = {
                qualifiedName: "xmlns:ct",
                prefix: "ct",
                uri: "http://gionkunz.github.com/chartist-js/ct"
            }, c.Svg = c.Class.extend({
                constructor: d,
                attr: e,
                elem: f,
                parent: g,
                root: h,
                querySelector: i,
                querySelectorAll: j,
                foreignObject: k,
                text: l,
                empty: m,
                remove: n,
                replace: o,
                append: p,
                classes: q,
                addClass: r,
                removeClass: s,
                removeAllClasses: t,
                height: v,
                width: w,
                animate: x
            }), c.Svg.isSupported = function (a) {
                return b.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#" + a, "1.1")
            };
            var C = {
                easeInSine: [.47, 0, .745, .715],
                easeOutSine: [.39, .575, .565, 1],
                easeInOutSine: [.445, .05, .55, .95],
                easeInQuad: [.55, .085, .68, .53],
                easeOutQuad: [.25, .46, .45, .94],
                easeInOutQuad: [.455, .03, .515, .955],
                easeInCubic: [.55, .055, .675, .19],
                easeOutCubic: [.215, .61, .355, 1],
                easeInOutCubic: [.645, .045, .355, 1],
                easeInQuart: [.895, .03, .685, .22],
                easeOutQuart: [.165, .84, .44, 1],
                easeInOutQuart: [.77, 0, .175, 1],
                easeInQuint: [.755, .05, .855, .06],
                easeOutQuint: [.23, 1, .32, 1],
                easeInOutQuint: [.86, 0, .07, 1],
                easeInExpo: [.95, .05, .795, .035],
                easeOutExpo: [.19, 1, .22, 1],
                easeInOutExpo: [1, 0, 0, 1],
                easeInCirc: [.6, .04, .98, .335],
                easeOutCirc: [.075, .82, .165, 1],
                easeInOutCirc: [.785, .135, .15, .86],
                easeInBack: [.6, -.28, .735, .045],
                easeOutBack: [.175, .885, .32, 1.275],
                easeInOutBack: [.68, -.55, .265, 1.55]
            };
            c.Svg.Easing = C, c.Svg.List = c.Class.extend({
                constructor: y
            })
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, b, d, e, f, g) {
                var h = c.extend({
                    command: f ? a.toLowerCase() : a.toUpperCase()
                }, b, g ? {
                    data: g
                } : {});
                d.splice(e, 0, h)
            }

            function e(a, b) {
                a.forEach(function (c, d) {
                    u[c.command.toLowerCase()].forEach(function (e, f) {
                        b(c, e, d, f, a)
                    })
                })
            }

            function f(a, b) {
                this.pathElements = [], this.pos = 0, this.close = a, this.options = c.extend({}, v, b)
            }

            function g(a) {
                return void 0 !== a ? (this.pos = Math.max(0, Math.min(this.pathElements.length, a)), this) : this.pos
            }

            function h(a) {
                return this.pathElements.splice(this.pos, a), this
            }

            function i(a, b, c, e) {
                return d("M", {
                    x: +a,
                    y: +b
                }, this.pathElements, this.pos++, c, e), this
            }

            function j(a, b, c, e) {
                return d("L", {
                    x: +a,
                    y: +b
                }, this.pathElements, this.pos++, c, e), this
            }

            function k(a, b, c, e, f, g, h, i) {
                return d("C", {
                    x1: +a,
                    y1: +b,
                    x2: +c,
                    y2: +e,
                    x: +f,
                    y: +g
                }, this.pathElements, this.pos++, h, i), this
            }

            function l(a, b, c, e, f, g, h, i, j) {
                return d("A", {
                    rx: +a,
                    ry: +b,
                    xAr: +c,
                    lAf: +e,
                    sf: +f,
                    x: +g,
                    y: +h
                }, this.pathElements, this.pos++, i, j), this
            }

            function m(a) {
                var b = a.replace(/([A-Za-z])([0-9])/g, "$1 $2").replace(/([0-9])([A-Za-z])/g, "$1 $2").split(/[\s,]+/).reduce(function (a, b) {
                    return b.match(/[A-Za-z]/) && a.push([]), a[a.length - 1].push(b), a
                }, []);
                "Z" === b[b.length - 1][0].toUpperCase() && b.pop();
                var d = b.map(function (a) {
                        var b = a.shift(),
                            d = u[b.toLowerCase()];
                        return c.extend({
                            command: b
                        }, d.reduce(function (b, c, d) {
                            return b[c] = +a[d], b
                        }, {}))
                    }),
                    e = [this.pos, 0];
                return Array.prototype.push.apply(e, d), Array.prototype.splice.apply(this.pathElements, e), this.pos += d.length, this
            }

            function n() {
                var a = Math.pow(10, this.options.accuracy);
                return this.pathElements.reduce(function (b, c) {
                    var d = u[c.command.toLowerCase()].map(function (b) {
                        return this.options.accuracy ? Math.round(c[b] * a) / a : c[b]
                    }.bind(this));
                    return b + c.command + d.join(",")
                }.bind(this), "") + (this.close ? "Z" : "")
            }

            function o(a, b) {
                return e(this.pathElements, function (c, d) {
                    c[d] *= "x" === d[0] ? a : b
                }), this
            }

            function p(a, b) {
                return e(this.pathElements, function (c, d) {
                    c[d] += "x" === d[0] ? a : b
                }), this
            }

            function q(a) {
                return e(this.pathElements, function (b, c, d, e, f) {
                    var g = a(b, c, d, e, f);
                    (g || 0 === g) && (b[c] = g)
                }), this
            }

            function r(a) {
                var b = new c.Svg.Path(a || this.close);
                return b.pos = this.pos, b.pathElements = this.pathElements.slice().map(function (a) {
                    return c.extend({}, a)
                }), b.options = c.extend({}, this.options), b
            }

            function s(a) {
                var b = [new c.Svg.Path];
                return this.pathElements.forEach(function (d) {
                    d.command === a.toUpperCase() && 0 !== b[b.length - 1].pathElements.length && b.push(new c.Svg.Path), b[b.length - 1].pathElements.push(d)
                }), b
            }

            function t(a, b, d) {
                for (var e = new c.Svg.Path(b, d), f = 0; f < a.length; f++)
                    for (var g = a[f], h = 0; h < g.pathElements.length; h++) e.pathElements.push(g.pathElements[h]);
                return e
            }
            var u = {
                    m: ["x", "y"],
                    l: ["x", "y"],
                    c: ["x1", "y1", "x2", "y2", "x", "y"],
                    a: ["rx", "ry", "xAr", "lAf", "sf", "x", "y"]
                },
                v = {
                    accuracy: 3
                };
            c.Svg.Path = c.Class.extend({
                constructor: f,
                position: g,
                remove: h,
                move: i,
                line: j,
                curve: k,
                arc: l,
                scale: o,
                translate: p,
                transform: q,
                parse: m,
                stringify: n,
                clone: r,
                splitByCommand: s
            }), c.Svg.Path.elementDescriptions = u, c.Svg.Path.join = t
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, b, c, d) {
                this.units = a, this.counterUnits = a === f.x ? f.y : f.x, this.chartRect = b, this.axisLength = b[a.rectEnd] - b[a.rectStart], this.gridOffset = b[a.rectOffset], this.ticks = c, this.options = d
            }

            function e(a, b, d, e, f) {
                var g = e["axis" + this.units.pos.toUpperCase()],
                    h = this.ticks.map(this.projectValue.bind(this)),
                    i = this.ticks.map(g.labelInterpolationFnc);
                h.forEach(function (j, k) {
                    var l, m = {
                        x: 0,
                        y: 0
                    };
                    l = h[k + 1] ? h[k + 1] - j : Math.max(this.axisLength - j, 30), (i[k] || 0 === i[k]) && ("x" === this.units.pos ? (j = this.chartRect.x1 + j, m.x = e.axisX.labelOffset.x, "start" === e.axisX.position ? m.y = this.chartRect.padding.top + e.axisX.labelOffset.y + (d ? 5 : 20) : m.y = this.chartRect.y1 + e.axisX.labelOffset.y + (d ? 5 : 20)) : (j = this.chartRect.y1 - j, m.y = e.axisY.labelOffset.y - (d ? l : 0), "start" === e.axisY.position ? m.x = d ? this.chartRect.padding.left + e.axisY.labelOffset.x : this.chartRect.x1 - 10 : m.x = this.chartRect.x2 + e.axisY.labelOffset.x + 10), g.showGrid && c.createGrid(j, k, this, this.gridOffset, this.chartRect[this.counterUnits.len](), a, [e.classNames.grid, e.classNames[this.units.dir]], f), g.showLabel && c.createLabel(j, l, k, i, this, g.offset, m, b, [e.classNames.label, e.classNames[this.units.dir], e.classNames[g.position]], d, f))
                }.bind(this))
            }
            var f = {
                x: {
                    pos: "x",
                    len: "width",
                    dir: "horizontal",
                    rectStart: "x1",
                    rectEnd: "x2",
                    rectOffset: "y2"
                },
                y: {
                    pos: "y",
                    len: "height",
                    dir: "vertical",
                    rectStart: "y2",
                    rectEnd: "y1",
                    rectOffset: "x1"
                }
            };
            c.Axis = c.Class.extend({
                constructor: d,
                createGridAndLabels: e,
                projectValue: function (a, b, c) {
                    throw new Error("Base axis can't be instantiated!")
                }
            }), c.Axis.units = f
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, b, d, e) {
                var f = e.highLow || c.getHighLow(b.normalized, e, a.pos);
                this.bounds = c.getBounds(d[a.rectEnd] - d[a.rectStart], f, e.scaleMinSpace || 20, e.onlyInteger), this.range = {
                    min: this.bounds.min,
                    max: this.bounds.max
                }, c.AutoScaleAxis["super"].constructor.call(this, a, d, this.bounds.values, e)
            }

            function e(a) {
                return this.axisLength * (+c.getMultiValue(a, this.units.pos) - this.bounds.min) / this.bounds.range
            }
            c.AutoScaleAxis = c.Axis.extend({
                constructor: d,
                projectValue: e
            })
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, b, d, e) {
                var f = e.highLow || c.getHighLow(b.normalized, e, a.pos);
                this.divisor = e.divisor || 1, this.ticks = e.ticks || c.times(this.divisor).map(function (a, b) {
                    return f.low + (f.high - f.low) / this.divisor * b
                }.bind(this)), this.range = {
                    min: f.low,
                    max: f.high
                }, c.FixedScaleAxis["super"].constructor.call(this, a, d, this.ticks, e), this.stepLength = this.axisLength / this.divisor
            }

            function e(a) {
                return this.axisLength * (+c.getMultiValue(a, this.units.pos) - this.range.min) / (this.range.max - this.range.min)
            }
            c.FixedScaleAxis = c.Axis.extend({
                constructor: d,
                projectValue: e
            })
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, b, d, e) {
                c.StepAxis["super"].constructor.call(this, a, d, e.ticks, e), this.stepLength = this.axisLength / (e.ticks.length - (e.stretch ? 1 : 0))
            }

            function e(a, b) {
                return this.stepLength * b
            }
            c.StepAxis = c.Axis.extend({
                constructor: d,
                projectValue: e
            })
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a) {
                var b = {
                    raw: this.data,
                    normalized: c.getDataArray(this.data, a.reverseData, !0)
                };
                this.svg = c.createSvg(this.container, a.width, a.height, a.classNames.chart);
                var d, e, g = this.svg.elem("g").addClass(a.classNames.gridGroup),
                    h = this.svg.elem("g"),
                    i = this.svg.elem("g").addClass(a.classNames.labelGroup),
                    j = c.createChartRect(this.svg, a, f.padding);
                d = void 0 === a.axisX.type ? new c.StepAxis(c.Axis.units.x, b, j, c.extend({}, a.axisX, {
                    ticks: b.raw.labels,
                    stretch: a.fullWidth
                })) : a.axisX.type.call(c, c.Axis.units.x, b, j, a.axisX), e = void 0 === a.axisY.type ? new c.AutoScaleAxis(c.Axis.units.y, b, j, c.extend({}, a.axisY, {
                    high: c.isNum(a.high) ? a.high : a.axisY.high,
                    low: c.isNum(a.low) ? a.low : a.axisY.low
                })) : a.axisY.type.call(c, c.Axis.units.y, b, j, a.axisY), d.createGridAndLabels(g, i, this.supportsForeignObject, a, this.eventEmitter), e.createGridAndLabels(g, i, this.supportsForeignObject, a, this.eventEmitter), b.raw.series.forEach(function (f, g) {
                    var i = h.elem("g");
                    i.attr({
                        "series-name": f.name,
                        meta: c.serialize(f.meta)
                    }, c.xmlNs.uri), i.addClass([a.classNames.series, f.className || a.classNames.series + "-" + c.alphaNumerate(g)].join(" "));
                    var k = [],
                        l = [];
                    b.normalized[g].forEach(function (a, h) {
                        var i = {
                            x: j.x1 + d.projectValue(a, h, b.normalized[g]),
                            y: j.y1 - e.projectValue(a, h, b.normalized[g])
                        };
                        k.push(i.x, i.y), l.push({
                            value: a,
                            valueIndex: h,
                            meta: c.getMetaData(f, h)
                        })
                    }.bind(this));
                    var m = {
                            lineSmooth: c.getSeriesOption(f, a, "lineSmooth"),
                            showPoint: c.getSeriesOption(f, a, "showPoint"),
                            showLine: c.getSeriesOption(f, a, "showLine"),
                            showArea: c.getSeriesOption(f, a, "showArea"),
                            areaBase: c.getSeriesOption(f, a, "areaBase")
                        },
                        n = "function" == typeof m.lineSmooth ? m.lineSmooth : m.lineSmooth ? c.Interpolation.cardinal() : c.Interpolation.none(),
                        o = n(k, l);
                    if (m.showPoint && o.pathElements.forEach(function (b) {
                            var h = i.elem("line", {
                                x1: b.x,
                                y1: b.y,
                                x2: b.x + .01,
                                y2: b.y
                            }, a.classNames.point).attr({
                                value: [b.data.value.x, b.data.value.y].filter(function (a) {
                                    return a
                                }).join(","),
                                meta: b.data.meta
                            }, c.xmlNs.uri);
                            this.eventEmitter.emit("draw", {
                                type: "point",
                                value: b.data.value,
                                index: b.data.valueIndex,
                                meta: b.data.meta,
                                series: f,
                                seriesIndex: g,
                                axisX: d,
                                axisY: e,
                                group: i,
                                element: h,
                                x: b.x,
                                y: b.y
                            })
                        }.bind(this)), m.showLine) {
                        var p = i.elem("path", {
                            d: o.stringify()
                        }, a.classNames.line, !0);
                        this.eventEmitter.emit("draw", {
                            type: "line",
                            values: b.normalized[g],
                            path: o.clone(),
                            chartRect: j,
                            index: g,
                            series: f,
                            seriesIndex: g,
                            axisX: d,
                            axisY: e,
                            group: i,
                            element: p
                        })
                    }
                    if (m.showArea && e.range) {
                        var q = Math.max(Math.min(m.areaBase, e.range.max), e.range.min),
                            r = j.y1 - e.projectValue(q);
                        o.splitByCommand("M").filter(function (a) {
                            return a.pathElements.length > 1
                        }).map(function (a) {
                            var b = a.pathElements[0],
                                c = a.pathElements[a.pathElements.length - 1];
                            return a.clone(!0).position(0).remove(1).move(b.x, r).line(b.x, b.y).position(a.pathElements.length + 1).line(c.x, r)
                        }).forEach(function (h) {
                            var k = i.elem("path", {
                                d: h.stringify()
                            }, a.classNames.area, !0).attr({
                                values: b.normalized[g]
                            }, c.xmlNs.uri);
                            this.eventEmitter.emit("draw", {
                                type: "area",
                                values: b.normalized[g],
                                path: h.clone(),
                                series: f,
                                seriesIndex: g,
                                axisX: d,
                                axisY: e,
                                chartRect: j,
                                index: g,
                                group: i,
                                element: k
                            })
                        }.bind(this))
                    }
                }.bind(this)), this.eventEmitter.emit("created", {
                    bounds: e.bounds,
                    chartRect: j,
                    axisX: d,
                    axisY: e,
                    svg: this.svg,
                    options: a
                })
            }

            function e(a, b, d, e) {
                c.Line["super"].constructor.call(this, a, b, f, c.extend({}, f, d), e)
            }
            var f = {
                axisX: {
                    offset: 30,
                    position: "end",
                    labelOffset: {
                        x: 0,
                        y: 0
                    },
                    showLabel: !0,
                    showGrid: !0,
                    labelInterpolationFnc: c.noop,
                    type: void 0
                },
                axisY: {
                    offset: 40,
                    position: "start",
                    labelOffset: {
                        x: 0,
                        y: 0
                    },
                    showLabel: !0,
                    showGrid: !0,
                    labelInterpolationFnc: c.noop,
                    type: void 0,
                    scaleMinSpace: 20,
                    onlyInteger: !1
                },
                width: void 0,
                height: void 0,
                showLine: !0,
                showPoint: !0,
                showArea: !1,
                areaBase: 0,
                lineSmooth: !0,
                low: void 0,
                high: void 0,
                chartPadding: {
                    top: 15,
                    right: 15,
                    bottom: 5,
                    left: 10
                },
                fullWidth: !1,
                reverseData: !1,
                classNames: {
                    chart: "ct-chart-line",
                    label: "ct-label",
                    labelGroup: "ct-labels",
                    series: "ct-series",
                    line: "ct-line",
                    point: "ct-point",
                    area: "ct-area",
                    grid: "ct-grid",
                    gridGroup: "ct-grids",
                    vertical: "ct-vertical",
                    horizontal: "ct-horizontal",
                    start: "ct-start",
                    end: "ct-end"
                }
            };
            c.Line = c.Base.extend({
                constructor: e,
                createChart: d
            })
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a) {
                var b, d = {
                    raw: this.data,
                    normalized: a.distributeSeries ? c.getDataArray(this.data, a.reverseData, a.horizontalBars ? "x" : "y").map(function (a) {
                        return [a]
                    }) : c.getDataArray(this.data, a.reverseData, a.horizontalBars ? "x" : "y")
                };
                this.svg = c.createSvg(this.container, a.width, a.height, a.classNames.chart + (a.horizontalBars ? " " + a.classNames.horizontalBars : ""));
                var e = this.svg.elem("g").addClass(a.classNames.gridGroup),
                    g = this.svg.elem("g"),
                    h = this.svg.elem("g").addClass(a.classNames.labelGroup);
                if (a.stackBars) {
                    var i = c.serialMap(d.normalized, function () {
                        return Array.prototype.slice.call(arguments).map(function (a) {
                            return a
                        }).reduce(function (a, b) {
                            return {
                                x: a.x + b.x || 0,
                                y: a.y + b.y || 0
                            }
                        }, {
                            x: 0,
                            y: 0
                        })
                    });
                    b = c.getHighLow([i], c.extend({}, a, {
                        referenceValue: 0
                    }), a.horizontalBars ? "x" : "y")
                } else b = c.getHighLow(d.normalized, c.extend({}, a, {
                    referenceValue: 0
                }), a.horizontalBars ? "x" : "y");
                b.high = +a.high || (0 === a.high ? 0 : b.high), b.low = +a.low || (0 === a.low ? 0 : b.low);
                var j, k, l, m, n, o = c.createChartRect(this.svg, a, f.padding);
                k = a.distributeSeries && a.stackBars ? d.raw.labels.slice(0, 1) : d.raw.labels, a.horizontalBars ? (j = m = void 0 === a.axisX.type ? new c.AutoScaleAxis(c.Axis.units.x, d, o, c.extend({}, a.axisX, {
                    highLow: b,
                    referenceValue: 0
                })) : a.axisX.type.call(c, c.Axis.units.x, d, o, c.extend({}, a.axisX, {
                    highLow: b,
                    referenceValue: 0
                })), l = n = void 0 === a.axisY.type ? new c.StepAxis(c.Axis.units.y, d, o, {
                    ticks: k
                }) : a.axisY.type.call(c, c.Axis.units.y, d, o, a.axisY)) : (l = m = void 0 === a.axisX.type ? new c.StepAxis(c.Axis.units.x, d, o, {
                    ticks: k
                }) : a.axisX.type.call(c, c.Axis.units.x, d, o, a.axisX), j = n = void 0 === a.axisY.type ? new c.AutoScaleAxis(c.Axis.units.y, d, o, c.extend({}, a.axisY, {
                    highLow: b,
                    referenceValue: 0
                })) : a.axisY.type.call(c, c.Axis.units.y, d, o, c.extend({}, a.axisY, {
                    highLow: b,
                    referenceValue: 0
                })));
                var p = a.horizontalBars ? o.x1 + j.projectValue(0) : o.y1 - j.projectValue(0),
                    q = [];
                l.createGridAndLabels(e, h, this.supportsForeignObject, a, this.eventEmitter), j.createGridAndLabels(e, h, this.supportsForeignObject, a, this.eventEmitter), d.raw.series.forEach(function (b, e) {
                    var f, h, i = e - (d.raw.series.length - 1) / 2;
                    f = a.distributeSeries && !a.stackBars ? l.axisLength / d.normalized.length / 2 : a.distributeSeries && a.stackBars ? l.axisLength / 2 : l.axisLength / d.normalized[e].length / 2, h = g.elem("g"), h.attr({
                        "series-name": b.name,
                        meta: c.serialize(b.meta)
                    }, c.xmlNs.uri), h.addClass([a.classNames.series, b.className || a.classNames.series + "-" + c.alphaNumerate(e)].join(" ")), d.normalized[e].forEach(function (g, k) {
                        var r, s, t, u;
                        if (u = a.distributeSeries && !a.stackBars ? e : a.distributeSeries && a.stackBars ? 0 : k, r = a.horizontalBars ? {
                                x: o.x1 + j.projectValue(g && g.x ? g.x : 0, k, d.normalized[e]),
                                y: o.y1 - l.projectValue(g && g.y ? g.y : 0, u, d.normalized[e])
                            } : {
                                x: o.x1 + l.projectValue(g && g.x ? g.x : 0, u, d.normalized[e]),
                                y: o.y1 - j.projectValue(g && g.y ? g.y : 0, k, d.normalized[e])
                            }, l instanceof c.StepAxis && (l.options.stretch || (r[l.units.pos] += f * (a.horizontalBars ? -1 : 1)), r[l.units.pos] += a.stackBars || a.distributeSeries ? 0 : i * a.seriesBarDistance * (a.horizontalBars ? -1 : 1)), t = q[k] || p, q[k] = t - (p - r[l.counterUnits.pos]), void 0 !== g) {
                            var v = {};
                            v[l.units.pos + "1"] = r[l.units.pos], v[l.units.pos + "2"] = r[l.units.pos], v[l.counterUnits.pos + "1"] = a.stackBars ? t : p, v[l.counterUnits.pos + "2"] = a.stackBars ? q[k] : r[l.counterUnits.pos], v.x1 = Math.min(Math.max(v.x1, o.x1), o.x2), v.x2 = Math.min(Math.max(v.x2, o.x1), o.x2), v.y1 = Math.min(Math.max(v.y1, o.y2), o.y1), v.y2 = Math.min(Math.max(v.y2, o.y2), o.y1), s = h.elem("line", v, a.classNames.bar).attr({
                                    value: [g.x, g.y].filter(function (a) {
                                        return a
                                    }).join(","),
                                    meta: c.getMetaData(b, k)
                                }, c.xmlNs.uri),
                                this.eventEmitter.emit("draw", c.extend({
                                    type: "bar",
                                    value: g,
                                    index: k,
                                    meta: c.getMetaData(b, k),
                                    series: b,
                                    seriesIndex: e,
                                    axisX: m,
                                    axisY: n,
                                    chartRect: o,
                                    group: h,
                                    element: s
                                }, v))
                        }
                    }.bind(this))
                }.bind(this)), this.eventEmitter.emit("created", {
                    bounds: j.bounds,
                    chartRect: o,
                    axisX: m,
                    axisY: n,
                    svg: this.svg,
                    options: a
                })
            }

            function e(a, b, d, e) {
                c.Bar["super"].constructor.call(this, a, b, f, c.extend({}, f, d), e)
            }
            var f = {
                axisX: {
                    offset: 30,
                    position: "end",
                    labelOffset: {
                        x: 0,
                        y: 0
                    },
                    showLabel: !0,
                    showGrid: !0,
                    labelInterpolationFnc: c.noop,
                    scaleMinSpace: 30,
                    onlyInteger: !1
                },
                axisY: {
                    offset: 40,
                    position: "start",
                    labelOffset: {
                        x: 0,
                        y: 0
                    },
                    showLabel: !0,
                    showGrid: !0,
                    labelInterpolationFnc: c.noop,
                    scaleMinSpace: 20,
                    onlyInteger: !1
                },
                width: void 0,
                height: void 0,
                high: void 0,
                low: void 0,
                onlyInteger: !1,
                chartPadding: {
                    top: 15,
                    right: 15,
                    bottom: 5,
                    left: 10
                },
                seriesBarDistance: 15,
                stackBars: !1,
                horizontalBars: !1,
                distributeSeries: !1,
                reverseData: !1,
                classNames: {
                    chart: "ct-chart-bar",
                    horizontalBars: "ct-horizontal-bars",
                    label: "ct-label",
                    labelGroup: "ct-labels",
                    series: "ct-series",
                    bar: "ct-bar",
                    grid: "ct-grid",
                    gridGroup: "ct-grids",
                    vertical: "ct-vertical",
                    horizontal: "ct-horizontal",
                    start: "ct-start",
                    end: "ct-end"
                }
            };
            c.Bar = c.Base.extend({
                constructor: e,
                createChart: d
            })
        }(window, document, a),
        function (a, b, c) {
            "use strict";

            function d(a, b, c) {
                var d = b.x > a.x;
                return d && "explode" === c || !d && "implode" === c ? "start" : d && "implode" === c || !d && "explode" === c ? "end" : "middle"
            }

            function e(a) {
                var b, e, f, h, i, j = [],
                    k = a.startAngle,
                    l = c.getDataArray(this.data, a.reverseData);
                this.svg = c.createSvg(this.container, a.width, a.height, a.donut ? a.classNames.chartDonut : a.classNames.chartPie), e = c.createChartRect(this.svg, a, g.padding), f = Math.min(e.width() / 2, e.height() / 2), i = a.total || l.reduce(function (a, b) {
                    return a + b
                }, 0), f -= a.donut ? a.donutWidth / 2 : 0, h = "outside" === a.labelPosition || a.donut ? f : "center" === a.labelPosition ? 0 : f / 2, h += a.labelOffset;
                var m = {
                        x: e.x1 + e.width() / 2,
                        y: e.y2 + e.height() / 2
                    },
                    n = 1 === this.data.series.filter(function (a) {
                        return a.hasOwnProperty("value") ? 0 !== a.value : 0 !== a
                    }).length;
                a.showLabel && (b = this.svg.elem("g", null, null, !0));
                for (var o = 0; o < this.data.series.length; o++) {
                    var p = this.data.series[o];
                    j[o] = this.svg.elem("g", null, null, !0), j[o].attr({
                        "series-name": p.name
                    }, c.xmlNs.uri), j[o].addClass([a.classNames.series, p.className || a.classNames.series + "-" + c.alphaNumerate(o)].join(" "));
                    var q = k + l[o] / i * 360;
                    q - k === 360 && (q -= .01);
                    var r = c.polarToCartesian(m.x, m.y, f, k - (0 === o || n ? 0 : .2)),
                        s = c.polarToCartesian(m.x, m.y, f, q),
                        t = new c.Svg.Path(!a.donut).move(s.x, s.y).arc(f, f, 0, q - k > 180, 0, r.x, r.y);
                    a.donut || t.line(m.x, m.y);
                    var u = j[o].elem("path", {
                        d: t.stringify()
                    }, a.donut ? a.classNames.sliceDonut : a.classNames.slicePie);
                    if (u.attr({
                            value: l[o],
                            meta: c.serialize(p.meta)
                        }, c.xmlNs.uri), a.donut && u.attr({
                            style: "stroke-width: " + +a.donutWidth + "px"
                        }), this.eventEmitter.emit("draw", {
                            type: "slice",
                            value: l[o],
                            totalDataSum: i,
                            index: o,
                            meta: p.meta,
                            series: p,
                            group: j[o],
                            element: u,
                            path: t.clone(),
                            center: m,
                            radius: f,
                            startAngle: k,
                            endAngle: q
                        }), a.showLabel) {
                        var v = c.polarToCartesian(m.x, m.y, h, k + (q - k) / 2),
                            w = a.labelInterpolationFnc(this.data.labels ? this.data.labels[o] : l[o], o);
                        if (w || 0 === w) {
                            var x = b.elem("text", {
                                dx: v.x,
                                dy: v.y,
                                "text-anchor": d(m, v, a.labelDirection)
                            }, a.classNames.label).text("" + w);
                            this.eventEmitter.emit("draw", {
                                type: "label",
                                index: o,
                                group: b,
                                element: x,
                                text: "" + w,
                                x: v.x,
                                y: v.y
                            })
                        }
                    }
                    k = q
                }
                this.eventEmitter.emit("created", {
                    chartRect: e,
                    svg: this.svg,
                    options: a
                })
            }

            function f(a, b, d, e) {
                c.Pie["super"].constructor.call(this, a, b, g, c.extend({}, g, d), e)
            }
            var g = {
                width: void 0,
                height: void 0,
                chartPadding: 5,
                classNames: {
                    chartPie: "ct-chart-pie",
                    chartDonut: "ct-chart-donut",
                    series: "ct-series",
                    slicePie: "ct-slice-pie",
                    sliceDonut: "ct-slice-donut",
                    label: "ct-label"
                },
                startAngle: 0,
                total: void 0,
                donut: !1,
                donutWidth: 60,
                showLabel: !0,
                labelOffset: 0,
                labelPosition: "inside",
                labelInterpolationFnc: c.noop,
                labelDirection: "neutral",
                reverseData: !1
            };
            c.Pie = c.Base.extend({
                constructor: f,
                createChart: e,
                determineAnchorPosition: d
            })
        }(window, document, a), a
});

/*! nouislider - 9.1.0 - 2016-12-10 16:00:32 */

! function (a) {
    "function" == typeof define && define.amd ? define([], a) : "object" == typeof exports ? module.exports = a() : window.noUiSlider = a()
}(function () {
    "use strict";

    function a(a, b) {
        var c = document.createElement("div");
        return j(c, b), a.appendChild(c), c
    }

    function b(a) {
        return a.filter(function (a) {
            return !this[a] && (this[a] = !0)
        }, {})
    }

    function c(a, b) {
        return Math.round(a / b) * b
    }

    function d(a, b) {
        var c = a.getBoundingClientRect(),
            d = a.ownerDocument,
            e = d.documentElement,
            f = m();
        return /webkit.*Chrome.*Mobile/i.test(navigator.userAgent) && (f.x = 0), b ? c.top + f.y - e.clientTop : c.left + f.x - e.clientLeft
    }

    function e(a) {
        return "number" == typeof a && !isNaN(a) && isFinite(a)
    }

    function f(a, b, c) {
        c > 0 && (j(a, b), setTimeout(function () {
            k(a, b)
        }, c))
    }

    function g(a) {
        return Math.max(Math.min(a, 100), 0)
    }

    function h(a) {
        return Array.isArray(a) ? a : [a]
    }

    function i(a) {
        a = String(a);
        var b = a.split(".");
        return b.length > 1 ? b[1].length : 0
    }

    function j(a, b) {
        a.classList ? a.classList.add(b) : a.className += " " + b
    }

    function k(a, b) {
        a.classList ? a.classList.remove(b) : a.className = a.className.replace(new RegExp("(^|\\b)" + b.split(" ").join("|") + "(\\b|$)", "gi"), " ")
    }

    function l(a, b) {
        return a.classList ? a.classList.contains(b) : new RegExp("\\b" + b + "\\b").test(a.className)
    }

    function m() {
        var a = void 0 !== window.pageXOffset,
            b = "CSS1Compat" === (document.compatMode || ""),
            c = a ? window.pageXOffset : b ? document.documentElement.scrollLeft : document.body.scrollLeft,
            d = a ? window.pageYOffset : b ? document.documentElement.scrollTop : document.body.scrollTop;
        return {
            x: c,
            y: d
        }
    }

    function n() {
        return window.navigator.pointerEnabled ? {
            start: "pointerdown",
            move: "pointermove",
            end: "pointerup"
        } : window.navigator.msPointerEnabled ? {
            start: "MSPointerDown",
            move: "MSPointerMove",
            end: "MSPointerUp"
        } : {
            start: "mousedown touchstart",
            move: "mousemove touchmove",
            end: "mouseup touchend"
        }
    }

    function o(a, b) {
        return 100 / (b - a)
    }

    function p(a, b) {
        return 100 * b / (a[1] - a[0])
    }

    function q(a, b) {
        return p(a, a[0] < 0 ? b + Math.abs(a[0]) : b - a[0])
    }

    function r(a, b) {
        return b * (a[1] - a[0]) / 100 + a[0]
    }

    function s(a, b) {
        for (var c = 1; a >= b[c];) c += 1;
        return c
    }

    function t(a, b, c) {
        if (c >= a.slice(-1)[0]) return 100;
        var d, e, f, g, h = s(c, a);
        return d = a[h - 1], e = a[h], f = b[h - 1], g = b[h], f + q([d, e], c) / o(f, g)
    }

    function u(a, b, c) {
        if (c >= 100) return a.slice(-1)[0];
        var d, e, f, g, h = s(c, b);
        return d = a[h - 1], e = a[h], f = b[h - 1], g = b[h], r([d, e], (c - f) * o(f, g))
    }

    function v(a, b, d, e) {
        if (100 === e) return e;
        var f, g, h = s(e, a);
        return d ? (f = a[h - 1], g = a[h], e - f > (g - f) / 2 ? g : f) : b[h - 1] ? a[h - 1] + c(e - a[h - 1], b[h - 1]) : e
    }

    function w(a, b, c) {
        var d;
        if ("number" == typeof b && (b = [b]), "[object Array]" !== Object.prototype.toString.call(b)) throw new Error("noUiSlider: 'range' contains invalid value.");
        if (d = "min" === a ? 0 : "max" === a ? 100 : parseFloat(a), !e(d) || !e(b[0])) throw new Error("noUiSlider: 'range' value isn't numeric.");
        c.xPct.push(d), c.xVal.push(b[0]), d ? c.xSteps.push(!isNaN(b[1]) && b[1]) : isNaN(b[1]) || (c.xSteps[0] = b[1]), c.xHighestCompleteStep.push(0)
    }

    function x(a, b, c) {
        if (!b) return !0;
        c.xSteps[a] = p([c.xVal[a], c.xVal[a + 1]], b) / o(c.xPct[a], c.xPct[a + 1]);
        var d = (c.xVal[a + 1] - c.xVal[a]) / c.xNumSteps[a],
            e = Math.ceil(Number(d.toFixed(3)) - 1),
            f = c.xVal[a] + c.xNumSteps[a] * e;
        c.xHighestCompleteStep[a] = f
    }

    function y(a, b, c, d) {
        this.xPct = [], this.xVal = [], this.xSteps = [d || !1], this.xNumSteps = [!1], this.xHighestCompleteStep = [], this.snap = b, this.direction = c;
        var e, f = [];
        for (e in a) a.hasOwnProperty(e) && f.push([a[e], e]);
        for (f.length && "object" == typeof f[0][0] ? f.sort(function (a, b) {
                return a[0][0] - b[0][0]
            }) : f.sort(function (a, b) {
                return a[0] - b[0]
            }), e = 0; e < f.length; e++) w(f[e][1], f[e][0], this);
        for (this.xNumSteps = this.xSteps.slice(0), e = 0; e < this.xNumSteps.length; e++) x(e, this.xNumSteps[e], this)
    }

    function z(a, b) {
        if (!e(b)) throw new Error("noUiSlider: 'step' is not numeric.");
        a.singleStep = b
    }

    function A(a, b) {
        if ("object" != typeof b || Array.isArray(b)) throw new Error("noUiSlider: 'range' is not an object.");
        if (void 0 === b.min || void 0 === b.max) throw new Error("noUiSlider: Missing 'min' or 'max' in 'range'.");
        if (b.min === b.max) throw new Error("noUiSlider: 'range' 'min' and 'max' cannot be equal.");
        a.spectrum = new y(b, a.snap, a.dir, a.singleStep)
    }

    function B(a, b) {
        if (b = h(b), !Array.isArray(b) || !b.length) throw new Error("noUiSlider: 'start' option is incorrect.");
        a.handles = b.length, a.start = b
    }

    function C(a, b) {
        if (a.snap = b, "boolean" != typeof b) throw new Error("noUiSlider: 'snap' option must be a boolean.")
    }

    function D(a, b) {
        if (a.animate = b, "boolean" != typeof b) throw new Error("noUiSlider: 'animate' option must be a boolean.")
    }

    function E(a, b) {
        if (a.animationDuration = b, "number" != typeof b) throw new Error("noUiSlider: 'animationDuration' option must be a number.")
    }

    function F(a, b) {
        var c, d = [!1];
        if ("lower" === b ? b = [!0, !1] : "upper" === b && (b = [!1, !0]), b === !0 || b === !1) {
            for (c = 1; c < a.handles; c++) d.push(b);
            d.push(!1)
        } else {
            if (!Array.isArray(b) || !b.length || b.length !== a.handles + 1) throw new Error("noUiSlider: 'connect' option doesn't match handle count.");
            d = b
        }
        a.connect = d
    }

    function G(a, b) {
        switch (b) {
            case "horizontal":
                a.ort = 0;
                break;
            case "vertical":
                a.ort = 1;
                break;
            default:
                throw new Error("noUiSlider: 'orientation' option is invalid.")
        }
    }

    function H(a, b) {
        if (!e(b)) throw new Error("noUiSlider: 'margin' option must be numeric.");
        if (0 !== b && (a.margin = a.spectrum.getMargin(b), !a.margin)) throw new Error("noUiSlider: 'margin' option is only supported on linear sliders.")
    }

    function I(a, b) {
        if (!e(b)) throw new Error("noUiSlider: 'limit' option must be numeric.");
        if (a.limit = a.spectrum.getMargin(b), !a.limit || a.handles < 2) throw new Error("noUiSlider: 'limit' option is only supported on linear sliders with 2 or more handles.")
    }

    function J(a, b) {
        if (!e(b)) throw new Error("noUiSlider: 'padding' option must be numeric.");
        if (0 !== b) {
            if (a.padding = a.spectrum.getMargin(b), !a.padding) throw new Error("noUiSlider: 'padding' option is only supported on linear sliders.");
            if (a.padding < 0) throw new Error("noUiSlider: 'padding' option must be a positive number.");
            if (a.padding >= 50) throw new Error("noUiSlider: 'padding' option must be less than half the range.")
        }
    }

    function K(a, b) {
        switch (b) {
            case "ltr":
                a.dir = 0;
                break;
            case "rtl":
                a.dir = 1;
                break;
            default:
                throw new Error("noUiSlider: 'direction' option was not recognized.")
        }
    }

    function L(a, b) {
        if ("string" != typeof b) throw new Error("noUiSlider: 'behaviour' must be a string containing options.");
        var c = b.indexOf("tap") >= 0,
            d = b.indexOf("drag") >= 0,
            e = b.indexOf("fixed") >= 0,
            f = b.indexOf("snap") >= 0,
            g = b.indexOf("hover") >= 0;
        if (e) {
            if (2 !== a.handles) throw new Error("noUiSlider: 'fixed' behaviour must be used with 2 handles");
            H(a, a.start[1] - a.start[0])
        }
        a.events = {
            tap: c || f,
            drag: d,
            fixed: e,
            snap: f,
            hover: g
        }
    }

    function M(a, b) {
        if (b !== !1)
            if (b === !0) {
                a.tooltips = [];
                for (var c = 0; c < a.handles; c++) a.tooltips.push(!0)
            } else {
                if (a.tooltips = h(b), a.tooltips.length !== a.handles) throw new Error("noUiSlider: must pass a formatter for all handles.");
                a.tooltips.forEach(function (a) {
                    if ("boolean" != typeof a && ("object" != typeof a || "function" != typeof a.to)) throw new Error("noUiSlider: 'tooltips' must be passed a formatter or 'false'.")
                })
            }
    }

    function N(a, b) {
        if (a.format = b, "function" == typeof b.to && "function" == typeof b.from) return !0;
        throw new Error("noUiSlider: 'format' requires 'to' and 'from' methods.")
    }

    function O(a, b) {
        if (void 0 !== b && "string" != typeof b && b !== !1) throw new Error("noUiSlider: 'cssPrefix' must be a string or `false`.");
        a.cssPrefix = b
    }

    function P(a, b) {
        if (void 0 !== b && "object" != typeof b) throw new Error("noUiSlider: 'cssClasses' must be an object.");
        if ("string" == typeof a.cssPrefix) {
            a.cssClasses = {};
            for (var c in b) b.hasOwnProperty(c) && (a.cssClasses[c] = a.cssPrefix + b[c])
        } else a.cssClasses = b
    }

    function Q(a, b) {
        if (b !== !0 && b !== !1) throw new Error("noUiSlider: 'useRequestAnimationFrame' option should be true (default) or false.");
        a.useRequestAnimationFrame = b
    }

    function R(a) {
        var b = {
                margin: 0,
                limit: 0,
                padding: 0,
                animate: !0,
                animationDuration: 300,
                format: U
            },
            c = {
                step: {
                    r: !1,
                    t: z
                },
                start: {
                    r: !0,
                    t: B
                },
                connect: {
                    r: !0,
                    t: F
                },
                direction: {
                    r: !0,
                    t: K
                },
                snap: {
                    r: !1,
                    t: C
                },
                animate: {
                    r: !1,
                    t: D
                },
                animationDuration: {
                    r: !1,
                    t: E
                },
                range: {
                    r: !0,
                    t: A
                },
                orientation: {
                    r: !1,
                    t: G
                },
                margin: {
                    r: !1,
                    t: H
                },
                limit: {
                    r: !1,
                    t: I
                },
                padding: {
                    r: !1,
                    t: J
                },
                behaviour: {
                    r: !0,
                    t: L
                },
                format: {
                    r: !1,
                    t: N
                },
                tooltips: {
                    r: !1,
                    t: M
                },
                cssPrefix: {
                    r: !1,
                    t: O
                },
                cssClasses: {
                    r: !1,
                    t: P
                },
                useRequestAnimationFrame: {
                    r: !1,
                    t: Q
                }
            },
            d = {
                connect: !1,
                direction: "ltr",
                behaviour: "tap",
                orientation: "horizontal",
                cssPrefix: "noUi-",
                cssClasses: {
                    target: "target",
                    base: "base",
                    origin: "origin",
                    handle: "handle",
                    handleLower: "handle-lower",
                    handleUpper: "handle-upper",
                    horizontal: "horizontal",
                    vertical: "vertical",
                    background: "background",
                    connect: "connect",
                    ltr: "ltr",
                    rtl: "rtl",
                    draggable: "draggable",
                    drag: "state-drag",
                    tap: "state-tap",
                    active: "active",
                    tooltip: "tooltip",
                    pips: "pips",
                    pipsHorizontal: "pips-horizontal",
                    pipsVertical: "pips-vertical",
                    marker: "marker",
                    markerHorizontal: "marker-horizontal",
                    markerVertical: "marker-vertical",
                    markerNormal: "marker-normal",
                    markerLarge: "marker-large",
                    markerSub: "marker-sub",
                    value: "value",
                    valueHorizontal: "value-horizontal",
                    valueVertical: "value-vertical",
                    valueNormal: "value-normal",
                    valueLarge: "value-large",
                    valueSub: "value-sub"
                },
                useRequestAnimationFrame: !0
            };
        Object.keys(c).forEach(function (e) {
            if (void 0 === a[e] && void 0 === d[e]) {
                if (c[e].r) throw new Error("noUiSlider: '" + e + "' is required.");
                return !0
            }
            c[e].t(b, void 0 === a[e] ? d[e] : a[e])
        }), b.pips = a.pips;
        var e = [
            ["left", "top"],
            ["right", "bottom"]
        ];
        return b.style = e[b.dir][b.ort], b.styleOposite = e[b.dir ? 0 : 1][b.ort], b
    }

    function S(c, e, i) {
        function o(b, c) {
            var d = a(b, e.cssClasses.origin),
                f = a(d, e.cssClasses.handle);
            return f.setAttribute("data-handle", c), 0 === c ? j(f, e.cssClasses.handleLower) : c === e.handles - 1 && j(f, e.cssClasses.handleUpper), d
        }

        function p(b, c) {
            return !!c && a(b, e.cssClasses.connect)
        }

        function q(a, b) {
            ba = [], ca = [], ca.push(p(b, a[0]));
            for (var c = 0; c < e.handles; c++) ba.push(o(b, c)), ha[c] = c, ca.push(p(b, a[c + 1]))
        }

        function r(b) {
            j(b, e.cssClasses.target), 0 === e.dir ? j(b, e.cssClasses.ltr) : j(b, e.cssClasses.rtl), 0 === e.ort ? j(b, e.cssClasses.horizontal) : j(b, e.cssClasses.vertical), aa = a(b, e.cssClasses.base)
        }

        function s(b, c) {
            return !!e.tooltips[c] && a(b.firstChild, e.cssClasses.tooltip)
        }

        function t() {
            var a = ba.map(s);
            Z("update", function (b, c, d) {
                if (a[c]) {
                    var f = b[c];
                    e.tooltips[c] !== !0 && (f = e.tooltips[c].to(d[c])), a[c].innerHTML = f
                }
            })
        }

        function u(a, b, c) {
            if ("range" === a || "steps" === a) return ja.xVal;
            if ("count" === a) {
                var d, e = 100 / (b - 1),
                    f = 0;
                for (b = [];
                    (d = f++ * e) <= 100;) b.push(d);
                a = "positions"
            }
            return "positions" === a ? b.map(function (a) {
                return ja.fromStepping(c ? ja.getStep(a) : a)
            }) : "values" === a ? c ? b.map(function (a) {
                return ja.fromStepping(ja.getStep(ja.toStepping(a)))
            }) : b : void 0
        }

        function v(a, c, d) {
            function e(a, b) {
                return (a + b).toFixed(7) / 1
            }
            var f = {},
                g = ja.xVal[0],
                h = ja.xVal[ja.xVal.length - 1],
                i = !1,
                j = !1,
                k = 0;
            return d = b(d.slice().sort(function (a, b) {
                return a - b
            })), d[0] !== g && (d.unshift(g), i = !0), d[d.length - 1] !== h && (d.push(h), j = !0), d.forEach(function (b, g) {
                var h, l, m, n, o, p, q, r, s, t, u = b,
                    v = d[g + 1];
                if ("steps" === c && (h = ja.xNumSteps[g]), h || (h = v - u), u !== !1 && void 0 !== v)
                    for (h = Math.max(h, 1e-7), l = u; l <= v; l = e(l, h)) {
                        for (n = ja.toStepping(l), o = n - k, r = o / a, s = Math.round(r), t = o / s, m = 1; m <= s; m += 1) p = k + m * t, f[p.toFixed(5)] = ["x", 0];
                        q = d.indexOf(l) > -1 ? 1 : "steps" === c ? 2 : 0, !g && i && (q = 0), l === v && j || (f[n.toFixed(5)] = [l, q]), k = n
                    }
            }), f
        }

        function w(a, b, c) {
            function d(a, b) {
                var c = b === e.cssClasses.value,
                    d = c ? m : n,
                    f = c ? k : l;
                return b + " " + d[e.ort] + " " + f[a]
            }

            function f(a, b, c) {
                return 'class="' + d(c[1], b) + '" style="' + e.style + ": " + a + '%"'
            }

            function g(a, d) {
                d[1] = d[1] && b ? b(d[0], d[1]) : d[1], i += "<div " + f(a, e.cssClasses.marker, d) + "></div>", d[1] && (i += "<div " + f(a, e.cssClasses.value, d) + ">" + c.to(d[0]) + "</div>")
            }
            var h = document.createElement("div"),
                i = "",
                k = [e.cssClasses.valueNormal, e.cssClasses.valueLarge, e.cssClasses.valueSub],
                l = [e.cssClasses.markerNormal, e.cssClasses.markerLarge, e.cssClasses.markerSub],
                m = [e.cssClasses.valueHorizontal, e.cssClasses.valueVertical],
                n = [e.cssClasses.markerHorizontal, e.cssClasses.markerVertical];
            return j(h, e.cssClasses.pips), j(h, 0 === e.ort ? e.cssClasses.pipsHorizontal : e.cssClasses.pipsVertical), Object.keys(a).forEach(function (b) {
                g(b, a[b])
            }), h.innerHTML = i, h
        }

        function x(a) {
            var b = a.mode,
                c = a.density || 1,
                d = a.filter || !1,
                e = a.values || !1,
                f = a.stepped || !1,
                g = u(b, e, f),
                h = v(c, b, g),
                i = a.format || {
                    to: Math.round
                };
            return fa.appendChild(w(h, d, i))
        }

        function y() {
            var a = aa.getBoundingClientRect(),
                b = "offset" + ["Width", "Height"][e.ort];
            return 0 === e.ort ? a.width || aa[b] : a.height || aa[b]
        }

        function z(a, b, c, d) {
            var f = function (b) {
                    return !fa.hasAttribute("disabled") && (!l(fa, e.cssClasses.tap) && (!!(b = A(b, d.pageOffset)) && (!(a === ea.start && void 0 !== b.buttons && b.buttons > 1) && ((!d.hover || !b.buttons) && (b.calcPoint = b.points[e.ort], void c(b, d))))))
                },
                g = [];
            return a.split(" ").forEach(function (a) {
                b.addEventListener(a, f, !1), g.push([a, f])
            }), g
        }

        function A(a, b) {
            a.preventDefault();
            var c, d, e = 0 === a.type.indexOf("touch"),
                f = 0 === a.type.indexOf("mouse"),
                g = 0 === a.type.indexOf("pointer");
            if (0 === a.type.indexOf("MSPointer") && (g = !0), e) {
                if (a.touches.length > 1) return !1;
                c = a.changedTouches[0].pageX, d = a.changedTouches[0].pageY
            }
            return b = b || m(), (f || g) && (c = a.clientX + b.x, d = a.clientY + b.y), a.pageOffset = b, a.points = [c, d], a.cursor = f || g, a
        }

        function B(a) {
            var b = a - d(aa, e.ort),
                c = 100 * b / y();
            return e.dir ? 100 - c : c
        }

        function C(a) {
            var b = 100,
                c = !1;
            return ba.forEach(function (d, e) {
                if (!d.hasAttribute("disabled")) {
                    var f = Math.abs(ga[e] - a);
                    f < b && (c = e, b = f)
                }
            }), c
        }

        function D(a, b, c, d) {
            var e = c.slice(),
                f = [!a, a],
                g = [a, !a];
            d = d.slice(), a && d.reverse(), d.length > 1 ? d.forEach(function (a, c) {
                var d = M(e, a, e[a] + b, f[c], g[c]);
                d === !1 ? b = 0 : (b = d - e[a], e[a] = d)
            }) : f = g = [!0];
            var h = !1;
            d.forEach(function (a, d) {
                h = Q(a, c[a] + b, f[d], g[d]) || h
            }), h && d.forEach(function (a) {
                E("update", a), E("slide", a)
            })
        }

        function E(a, b, c) {
            Object.keys(la).forEach(function (d) {
                var f = d.split(".")[0];
                a === f && la[d].forEach(function (a) {
                    a.call(da, ka.map(e.format.to), b, ka.slice(), c || !1, ga.slice())
                })
            })
        }

        function F(a, b) {
            "mouseout" === a.type && "HTML" === a.target.nodeName && null === a.relatedTarget && H(a, b)
        }

        function G(a, b) {
            if (navigator.appVersion.indexOf("MSIE 9") === -1 && 0 === a.buttons && 0 !== b.buttonsProperty) return H(a, b);
            var c = (e.dir ? -1 : 1) * (a.calcPoint - b.startCalcPoint),
                d = 100 * c / b.baseSize;
            D(c > 0, d, b.locations, b.handleNumbers)
        }

        function H(a, b) {
            ia && (k(ia, e.cssClasses.active), ia = !1), a.cursor && (document.body.style.cursor = "", document.body.removeEventListener("selectstart", document.body.noUiListener)), document.documentElement.noUiListeners.forEach(function (a) {
                document.documentElement.removeEventListener(a[0], a[1])
            }), k(fa, e.cssClasses.drag), P(), b.handleNumbers.forEach(function (a) {
                E("set", a), E("change", a), E("end", a)
            })
        }

        function I(a, b) {
            if (1 === b.handleNumbers.length) {
                var c = ba[b.handleNumbers[0]];
                if (c.hasAttribute("disabled")) return !1;
                ia = c.children[0], j(ia, e.cssClasses.active)
            }
            a.preventDefault(), a.stopPropagation();
            var d = z(ea.move, document.documentElement, G, {
                    startCalcPoint: a.calcPoint,
                    baseSize: y(),
                    pageOffset: a.pageOffset,
                    handleNumbers: b.handleNumbers,
                    buttonsProperty: a.buttons,
                    locations: ga.slice()
                }),
                f = z(ea.end, document.documentElement, H, {
                    handleNumbers: b.handleNumbers
                }),
                g = z("mouseout", document.documentElement, F, {
                    handleNumbers: b.handleNumbers
                });
            if (document.documentElement.noUiListeners = d.concat(f, g), a.cursor) {
                document.body.style.cursor = getComputedStyle(a.target).cursor, ba.length > 1 && j(fa, e.cssClasses.drag);
                var h = function () {
                    return !1
                };
                document.body.noUiListener = h, document.body.addEventListener("selectstart", h, !1)
            }
            b.handleNumbers.forEach(function (a) {
                E("start", a)
            })
        }

        function J(a) {
            a.stopPropagation();
            var b = B(a.calcPoint),
                c = C(b);
            return c !== !1 && (e.events.snap || f(fa, e.cssClasses.tap, e.animationDuration), Q(c, b, !0, !0), P(), E("slide", c, !0), E("set", c, !0), E("change", c, !0), E("update", c, !0), void(e.events.snap && I(a, {
                handleNumbers: [c]
            })))
        }

        function K(a) {
            var b = B(a.calcPoint),
                c = ja.getStep(b),
                d = ja.fromStepping(c);
            Object.keys(la).forEach(function (a) {
                "hover" === a.split(".")[0] && la[a].forEach(function (a) {
                    a.call(da, d)
                })
            })
        }

        function L(a) {
            a.fixed || ba.forEach(function (a, b) {
                z(ea.start, a.children[0], I, {
                    handleNumbers: [b]
                })
            }), a.tap && z(ea.start, aa, J, {}), a.hover && z(ea.move, aa, K, {
                hover: !0
            }), a.drag && ca.forEach(function (b, c) {
                if (b !== !1 && 0 !== c && c !== ca.length - 1) {
                    var d = ba[c - 1],
                        f = ba[c],
                        g = [b];
                    j(b, e.cssClasses.draggable), a.fixed && (g.push(d.children[0]), g.push(f.children[0])), g.forEach(function (a) {
                        z(ea.start, a, I, {
                            handles: [d, f],
                            handleNumbers: [c - 1, c]
                        })
                    })
                }
            })
        }

        function M(a, b, c, d, f) {
            return ba.length > 1 && (d && b > 0 && (c = Math.max(c, a[b - 1] + e.margin)), f && b < ba.length - 1 && (c = Math.min(c, a[b + 1] - e.margin))), ba.length > 1 && e.limit && (d && b > 0 && (c = Math.min(c, a[b - 1] + e.limit)), f && b < ba.length - 1 && (c = Math.max(c, a[b + 1] - e.limit))), e.padding && (0 === b && (c = Math.max(c, e.padding)), b === ba.length - 1 && (c = Math.min(c, 100 - e.padding))), c = ja.getStep(c), c = g(c), c !== a[b] && c
        }

        function N(a) {
            return a + "%"
        }

        function O(a, b) {
            ga[a] = b, ka[a] = ja.fromStepping(b);
            var c = function () {
                ba[a].style[e.style] = N(b), S(a), S(a + 1)
            };
            window.requestAnimationFrame && e.useRequestAnimationFrame ? window.requestAnimationFrame(c) : c()
        }

        function P() {
            ha.forEach(function (a) {
                var b = ga[a] > 50 ? -1 : 1,
                    c = 3 + (ba.length + b * a);
                ba[a].childNodes[0].style.zIndex = c
            })
        }

        function Q(a, b, c, d) {
            return b = M(ga, a, b, c, d), b !== !1 && (O(a, b), !0)
        }

        function S(a) {
            if (ca[a]) {
                var b = 0,
                    c = 100;
                0 !== a && (b = ga[a - 1]), a !== ca.length - 1 && (c = ga[a]), ca[a].style[e.style] = N(b), ca[a].style[e.styleOposite] = N(100 - c)
            }
        }

        function T(a, b) {
            null !== a && a !== !1 && ("number" == typeof a && (a = String(a)), a = e.format.from(a), a === !1 || isNaN(a) || Q(b, ja.toStepping(a), !1, !1))
        }

        function U(a, b) {
            var c = h(a),
                d = void 0 === ga[0];
            b = void 0 === b || !!b, c.forEach(T), e.animate && !d && f(fa, e.cssClasses.tap, e.animationDuration), ha.forEach(function (a) {
                Q(a, ga[a], !0, !1)
            }), P(), ha.forEach(function (a) {
                E("update", a), null !== c[a] && b && E("set", a)
            })
        }

        function V(a) {
            U(e.start, a)
        }

        function W() {
            var a = ka.map(e.format.to);
            return 1 === a.length ? a[0] : a
        }

        function X() {
            for (var a in e.cssClasses) e.cssClasses.hasOwnProperty(a) && k(fa, e.cssClasses[a]);
            for (; fa.firstChild;) fa.removeChild(fa.firstChild);
            delete fa.noUiSlider
        }

        function Y() {
            return ga.map(function (a, b) {
                var c = ja.getNearbySteps(a),
                    d = ka[b],
                    e = c.thisStep.step,
                    f = null;
                e !== !1 && d + e > c.stepAfter.startValue && (e = c.stepAfter.startValue - d), f = d > c.thisStep.startValue ? c.thisStep.step : c.stepBefore.step !== !1 && d - c.stepBefore.highestStep, 100 === a ? e = null : 0 === a && (f = null);
                var g = ja.countStepDecimals();
                return null !== e && e !== !1 && (e = Number(e.toFixed(g))), null !== f && f !== !1 && (f = Number(f.toFixed(g))), [f, e]
            })
        }

        function Z(a, b) {
            la[a] = la[a] || [], la[a].push(b), "update" === a.split(".")[0] && ba.forEach(function (a, b) {
                E("update", b)
            })
        }

        function $(a) {
            var b = a && a.split(".")[0],
                c = b && a.substring(b.length);
            Object.keys(la).forEach(function (a) {
                var d = a.split(".")[0],
                    e = a.substring(d.length);
                b && b !== d || c && c !== e || delete la[a]
            })
        }

        function _(a, b) {
            var c = W(),
                d = ["margin", "limit", "padding", "range", "animate", "snap", "step", "format"];
            d.forEach(function (b) {
                void 0 !== a[b] && (i[b] = a[b])
            });
            var f = R(i);
            d.forEach(function (b) {
                void 0 !== a[b] && (e[b] = f[b])
            }), f.spectrum.direction = ja.direction, ja = f.spectrum, e.margin = f.margin, e.limit = f.limit, e.padding = f.padding, ga = [], U(a.start || c, b)
        }
        var aa, ba, ca, da, ea = n(),
            fa = c,
            ga = [],
            ha = [],
            ia = !1,
            ja = e.spectrum,
            ka = [],
            la = {};
        if (fa.noUiSlider) throw new Error("Slider was already initialized.");
        return r(fa), q(e.connect, aa), da = {
            destroy: X,
            steps: Y,
            on: Z,
            off: $,
            get: W,
            set: U,
            reset: V,
            __moveHandles: function (a, b, c) {
                D(a, b, ga, c)
            },
            options: i,
            updateOptions: _,
            target: fa,
            pips: x
        }, L(e.events), U(e.start), e.pips && x(e.pips), e.tooltips && t(), da
    }

    function T(a, b) {
        if (!a.nodeName) throw new Error("noUiSlider.create requires a single element.");
        var c = R(b, a),
            d = S(a, c, b);
        return a.noUiSlider = d, d
    }
    y.prototype.getMargin = function (a) {
        var b = this.xNumSteps[0];
        if (b && a / b % 1 !== 0) throw new Error("noUiSlider: 'limit', 'margin' and 'padding' must be divisible by step.");
        return 2 === this.xPct.length && p(this.xVal, a)
    }, y.prototype.toStepping = function (a) {
        return a = t(this.xVal, this.xPct, a)
    }, y.prototype.fromStepping = function (a) {
        return u(this.xVal, this.xPct, a)
    }, y.prototype.getStep = function (a) {
        return a = v(this.xPct, this.xSteps, this.snap, a)
    }, y.prototype.getNearbySteps = function (a) {
        var b = s(a, this.xPct);
        return {
            stepBefore: {
                startValue: this.xVal[b - 2],
                step: this.xNumSteps[b - 2],
                highestStep: this.xHighestCompleteStep[b - 2]
            },
            thisStep: {
                startValue: this.xVal[b - 1],
                step: this.xNumSteps[b - 1],
                highestStep: this.xHighestCompleteStep[b - 1]
            },
            stepAfter: {
                startValue: this.xVal[b - 0],
                step: this.xNumSteps[b - 0],
                highestStep: this.xHighestCompleteStep[b - 0]
            }
        }
    }, y.prototype.countStepDecimals = function () {
        var a = this.xNumSteps.map(i);
        return Math.max.apply(null, a)
    }, y.prototype.convert = function (a) {
        return this.getStep(this.toStepping(a))
    };
    var U = {
        to: function (a) {
            return void 0 !== a && a.toFixed(2)
        },
        from: Number
    };
    return {
        create: T
    }
});

// =========================================================
//  Light Bootstrap Dashboard - v2.0.1
// =========================================================
//
//  Product Page: https://www.creative-tim.com/product/light-bootstrap-dashboard
//  Copyright 2019 Creative Tim (https://www.creative-tim.com)
//  Licensed under MIT (https://github.com/creativetimofficial/light-bootstrap-dashboard/blob/master/LICENSE)
//
//  Coded by Creative Tim
//
// =========================================================
//
//  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

var searchVisible = 0;
var transparent = true;

var transparentDemo = true;
var fixedTop = false;

var navbar_initialized = false;
var mobile_menu_visible = 0,
    mobile_menu_initialized = false,
    toggle_initialized = false,
    bootstrap_nav_initialized = false,
    $sidebar,
    isWindows;

$(document).ready(function() {
    window_width = $(window).width();

    // check if there is an image set for the sidebar's background
    lbd.checkSidebarImage();

    // Init navigation toggle for small screens
    if (window_width <= 991) {
        lbd.initRightMenu();
    }

    //  Activate the tooltips
    $('[rel="tooltip"]').tooltip();

    //      Activate regular switches
    if ($("[data-toggle='switch']").length != 0) {
        $("[data-toggle='switch']").bootstrapSwitch();
    }

    $('.form-control').on("focus", function() {
        $(this).parent('.input-group').addClass("input-group-focus");
    }).on("blur", function() {
        $(this).parent(".input-group").removeClass("input-group-focus");
    });

    // Fixes sub-nav not working as expected on IOS
    $('body').on('touchstart.dropdown', '.dropdown-menu', function(e) {
        e.stopPropagation();
    });
});

// activate collapse right menu when the windows is resized
$(window).resize(function() {
    if ($(window).width() <= 991) {
        lbd.initRightMenu();
    }
});

lbd = {
    misc: {
        navbar_menu_visible: 0
    },
    checkSidebarImage: function() {
        $sidebar = $('.sidebar');
        image_src = $sidebar.data('image');

        if (image_src !== undefined) {
            sidebar_container = '<div class="sidebar-background" style="background-image: url(' + image_src + ') "/>'
            $sidebar.append(sidebar_container);
        } else if (mobile_menu_initialized == true) {
            // reset all the additions that we made for the sidebar wrapper only if the screen is bigger than 991px
            $sidebar_wrapper.find('.navbar-form').remove();
            $sidebar_wrapper.find('.nav-mobile-menu').remove();

            mobile_menu_initialized = false;
        }
    },

    initRightMenu: function() {
        $sidebar_wrapper = $('.sidebar-wrapper');

        if (!mobile_menu_initialized) {

            $navbar = $('nav').find('.navbar-collapse').first().clone(true);

            nav_content = '';
            mobile_menu_content = '';

            //add the content from the regular header to the mobile menu
            $navbar.children('ul').each(function() {

                content_buff = $(this).html();
                nav_content = nav_content + content_buff;
            });

            nav_content = '<ul class="nav nav-mobile-menu">' + nav_content + '</ul>';

            $navbar_form = $('nav').find('.navbar-form').clone(true);

            $sidebar_nav = $sidebar_wrapper.find(' > .nav');

            // insert the navbar form before the sidebar list
            $nav_content = $(nav_content);
            $nav_content.insertBefore($sidebar_nav);
            $navbar_form.insertBefore($nav_content);

            $(".sidebar-wrapper .dropdown .dropdown-menu > li > a").click(function(event) {
                event.stopPropagation();

            });

            mobile_menu_initialized = true;
        } else {
            console.log('window with:' + $(window).width());
            if ($(window).width() > 991) {
                // reset all the additions that we made for the sidebar wrapper only if the screen is bigger than 991px
                $sidebar_wrapper.find('.navbar-form').remove();
                $sidebar_wrapper.find('.nav-mobile-menu').remove();

                mobile_menu_initialized = false;
            }
        }

        if (!toggle_initialized) {
            $toggle = $('.navbar-toggler');

            $toggle.click(function() {

                if (mobile_menu_visible == 1) {
                    $('html').removeClass('nav-open');

                    $('.close-layer').remove();
                    setTimeout(function() {
                        $toggle.removeClass('toggled');
                    }, 400);

                    mobile_menu_visible = 0;
                } else {
                    setTimeout(function() {
                        $toggle.addClass('toggled');
                    }, 430);


                    main_panel_height = $('.main-panel')[0].scrollHeight;
                    $layer = $('<div class="close-layer"></div>');
                    $layer.css('height', main_panel_height + 'px');
                    $layer.appendTo(".main-panel");

                    setTimeout(function() {
                        $layer.addClass('visible');
                    }, 100);

                    $layer.click(function() {
                        $('html').removeClass('nav-open');
                        mobile_menu_visible = 0;

                        $layer.removeClass('visible');

                        setTimeout(function() {
                            $layer.remove();
                            $toggle.removeClass('toggled');

                        }, 400);
                    });

                    $('html').addClass('nav-open');
                    mobile_menu_visible = 1;

                }
            });

            toggle_initialized = true;
        }
    }
}



// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
};
