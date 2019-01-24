'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*!
 * MagicSearch - An input plugin based on jquery
 *
 * Copyright (c) 2016 dingyi1993
 *
 * Version: 1.0.2
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/MIT
 *
 * project link:
 *   https://github.com/dingyi1993/jquery-magicsearch
 *
 * home page link:
 *   https://www.dingyi1993.com/blog/magicsearch
 */

;(function (factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory(typeof jQuery != 'undefined' ? jQuery : window.Zepto);
    }
})(function ($) {
    'use strict';

    var
    //separator of format
    SEPARATOR = '%',


    //default multi style,unit px
    DEFAULT_ITEM_WIDTH = 57,
        DEFAULT_ITEM_SPACE = 3,


    //default max width when multiple,unit px
    DEFAULT_INPUT_MAX_WIDTH = 500,


    //max loaded item at a time when show all(min:dropdownMaxItem + 1)
    ALL_DROPDOWN_NUM = 100,


    //default search box animate duration,unit ms
    BOX_ANIMATE_TIME = 200,


    //default search delay,unit ms
    SEARCH_DELAY = 200,


    //default dropdown button width,unit px
    DROPDOWN_WIDTH = 24,


    //key code
    KEY = {
        BACKSPACE: 8,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    },


    //cache doms string
    doms = {
        wrapper: 'magicsearch-wrapper',
        box: 'magicsearch-box',
        arrow: 'magicsearch-arrow',
        loading: 'magicsearch-loading',
        hidden: 'magicsearch-hidden',
        items: 'multi-items',
        item: 'multi-item',
        close: 'multi-item-close'
    },
        isString = function isString(value) {
        return $.type(value) === 'string';
    },


    //transform string which like this : %username%
    formatParse = function formatParse(format, data) {
        var fields = format.match(new RegExp('\\' + SEPARATOR + '[^\\' + SEPARATOR + ']+\\' + SEPARATOR, 'g'));
        if (!fields) {
            return format;
        }
        for (var i = 0; i < fields.length; i++) {
            fields[i] = fields[i].replace(new RegExp('\\' + SEPARATOR, 'g'), '');
        }
        for (var _i = 0; _i < fields.length; _i++) {
            format = format.replace(SEPARATOR + fields[_i] + SEPARATOR, data[fields[_i]] ? data[fields[_i]] : 'error');
        }
        return format;
    },

    //delete px at ending
    deletePx = function deletePx(value) {
        var index = value.lastIndexOf('px');
        return index < 0 ? Number(value) : Number(value.substring(0, index));
    },

    //transform to positive num
    transform2PositiveNum = function transform2PositiveNum(value, key) {
        if (!$.isNumeric(value)) {
            value = MagicSearch.defaults[key];
        } else {
            value = Math.ceil(Number(value));
            if (value <= 0) {
                value = MagicSearch.defaults[key];
            }
        }
        return value;
    },

    //constructor
    MagicSearch = function MagicSearch(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
    };

    MagicSearch.defaults = {
        dataSource: [], //array or string or function
        type: '', //string
        ajaxOptions: {}, //object
        id: '', //string
        hidden: false, //boolean
        fields: '', //string or array
        format: '', //string(function?)
        inputFormat: '', //string
        maxShow: 5, //int
        isClear: true, //boolean
        showSelected: true, //boolean
        dropdownBtn: false, //boolean
        dropdownMaxItem: 8, //int
        multiple: false, //boolean
        maxItem: true, //boolean or int
        showMultiSkin: true, //boolean
        multiStyle: {}, //object
        multiField: '', //string
        focusShow: false, //boolean
        noResult: '', //string
        skin: '', //string
        disableRule: function disableRule(data) {
            return false;
        },
        success: function success($input, data) {
            return true;
        },
        afterDelete: function afterDelete($input, data) {
            return true;
        }
    };

    MagicSearch.prototype = {
        init: function init() {
            var _this = this;

            //to ensure unique,plus one at init everytime
            window.MagicSearch.index += 1;

            //you must do those things before ajax
            var $input = this.$element;
            this.options = $.extend({}, MagicSearch.defaults, this.options);

            this.props = {
                isFirstGetDataSource: true,
                style: $.extend({}, this.element.style),
                objDataSource: {},
                multiStyle: {
                    space: DEFAULT_ITEM_SPACE,
                    width: DEFAULT_ITEM_WIDTH
                }
            };

            //can bind on input text only
            if (!this.$element.is('input:text')) {
                console.error('magicsearch: Can not bind magicsearch to other elements except input which type is text.');
                return false;
            }

            if (!isString(this.options.id) || this.options.id === '') {
                console.error('magicsearch: The option id must be a string which is not empty.');
                return false;
            }

            if (this.options.multiple) {
                this.options.isClear = true;
            } else if (!this.options.isClear) {
                this.options.hidden = false;
            }

            this.props.styles = {
                borderTopWidth: deletePx($input.css('border-top-width')),
                borderRightWidth: deletePx($input.css('border-right-width')),
                borderBottomWidth: deletePx($input.css('border-bottom-width')),
                borderLeftWidth: deletePx($input.css('border-left-width')),
                paddingTop: deletePx($input.css('padding-top')),
                paddingRight: deletePx($input.css('padding-right')),
                paddingBottom: deletePx($input.css('padding-bottom')),
                paddingLeft: deletePx($input.css('padding-left')),
                maxWidth: deletePx($input.css('max-width')) || DEFAULT_INPUT_MAX_WIDTH
            };
            this.props.styles.height = $input.height() + this.props.styles.borderTopWidth + this.props.styles.borderBottomWidth + this.props.styles.paddingTop + this.props.styles.paddingBottom;
            this.props.styles.sightHeight = this.props.styles.height - this.props.styles.borderTopWidth - this.props.styles.borderBottomWidth;
            this.props.styles.width = $input.width() + this.props.styles.borderLeftWidth + this.props.styles.borderRightWidth + this.props.styles.paddingLeft + this.props.styles.paddingRight;

            var styles = this.props.styles;
            var ids = $input.attr('data-id');
            if ($input.parent().attr('data-belong') !== 'magicsearch') {
                var $wrapper = $('<div class="' + (doms.wrapper + (this.options.skin ? ' ' + this.options.skin : '')) + '" data-belong="magicsearch"></div>');
                $wrapper.css('width', styles.width);
                $input.wrap($wrapper);
            }
            var $magicsearch_wrapper = $input.parent();
            var inputDisplay = $input.css('display');
            //init magicsearch wrapper
            $magicsearch_wrapper.css({
                // if input's display is inline,regard as inline-block
                'display': inputDisplay === 'inline' ? 'inline-block' : inputDisplay,
                'float': $input.css('float'),
                'margin': $input.css('margin')
            });
            $magicsearch_wrapper.attr('data-index', window.MagicSearch.index);

            //init input
            $input.css({
                'margin': 0,
                'box-sizing': 'border-box',
                'width': styles.width,
                'height': styles.height
            });
            if ($input.attr('placeholder')) {
                $input.attr('data-placeholder', $input.attr('placeholder'));
            }
            $input.removeAttr('disabled');
            if (this.options.isClear) {
                $input.val('');
            }
            if (ids === undefined) {
                $input.attr('data-id', '');
                ids = '';
            }

            //init magicsearch box
            if ($magicsearch_wrapper.find('.' + doms.box).length === 0) {
                $magicsearch_wrapper.append('<div class="' + doms.box + '"></div>');
            }
            $magicsearch_wrapper.find('.' + doms.box).css({
                'top': styles.height
            });

            //init hidden
            if (this.options.hidden) {
                var name = $input.attr('name');
                var $hidden = $('<input class="' + doms.hidden + '" type="hidden" value="' + ids + '">');
                if (name) {
                    $hidden.attr('name', name);
                    $input.removeAttr('name');
                }
                $magicsearch_wrapper.append($hidden);
            }

            //init magicsearch arrow
            if (this.options.dropdownBtn) {
                var $arrow = $('<div class="' + doms.arrow + '"><i></i></div>');
                $input.addClass('dropdown');
                $input.css('padding-right', styles.paddingRight + DROPDOWN_WIDTH);
                $arrow.css({
                    'top': styles.borderTopWidth,
                    'bottom': styles.borderBottomWidth,
                    'right': styles.borderRightWidth
                });
                $magicsearch_wrapper.append($arrow);
            }

            if (this.options.type == 'ajax') {
                var $loading = $('<div class="' + doms.loading + '"><div></div></div>');
                $magicsearch_wrapper.append($loading);

                var loadingTimeout = setTimeout(function () {
                    $magicsearch_wrapper.find('.' + doms.loading).find('div').show();
                }, 500);

                var ajaxOptions = {
                    type: 'GET',
                    url: this.options.dataSource,
                    dataType: 'json',
                    error: function error() {
                        console.error('magicsearch: Error with xhr.Index: ' + window.MagicSearch.index);
                    },
                    success: function success(data) {}
                };
                ajaxOptions = $.extend({}, ajaxOptions, this.options.ajaxOptions);
                var success = ajaxOptions.success;
                ajaxOptions.success = function (data) {
                    clearTimeout(loadingTimeout);
                    _this.options.dataSource = data;
                    $magicsearch_wrapper.find('.' + doms.loading).remove();
                    _this.initAfterAjax();
                    success(data);
                };

                $.ajax(ajaxOptions);
            } else {
                this.initAfterAjax();
            }
            return this;
        },
        initAfterAjax: function initAfterAjax() {
            var $input = this.$element;
            var $magicsearch_wrapper = $input.parent();
            var styles = this.props.styles;
            var ids = $input.attr('data-id');
            if ($.isFunction(this.options.dataSource)) {
                this.options.dataSource = this.options.dataSource(this.$element);
            }
            if (!this.options.dataSource) {
                this.options.dataSource = [];
            } else if (isString(this.options.dataSource)) {
                if (this.options.dataSource.toLowerCase() == 'null') {
                    this.options.dataSource = [];
                } else {
                    try {
                        this.options.dataSource = $.parseJSON(this.options.dataSource);
                        if (!$.isArray(this.options.dataSource)) {
                            var dataSource = [];
                            for (var id in this.options.dataSource) {
                                dataSource.push(this.options.dataSource[id]);
                            }
                            this.options.dataSource = dataSource;
                        }
                    } catch (err) {
                        this.options.dataSource = [];
                        console.error('magicsearch: A problem is occured during parsing dataSource,please check.Index: ' + window.MagicSearch.index);
                        return false;
                    }
                }
            } else if (!$.isArray(this.options.dataSource)) {
                var _dataSource = [];
                for (var _id in this.options.dataSource) {
                    _dataSource.push(this.options.dataSource[_id]);
                }
                this.options.dataSource = _dataSource;
            }
            if (isString(this.options.fields)) {
                this.options.fields = [this.options.fields === '' ? this.options.id : this.options.fields];
            } else if (!$.isArray(this.options.fields)) {
                this.options.fields = [this.options.id];
            }
            if (!isString(this.options.format) || this.options.format === '') {
                this.options.format = SEPARATOR + this.options.id + SEPARATOR;
            }
            this.options.maxShow = transform2PositiveNum(this.options.maxShow, 'maxShow');
            if (this.options.dropdownBtn) {
                this.options.dropdownMaxItem = transform2PositiveNum(this.options.dropdownMaxItem, 'dropdownMaxItem');
            }
            if (this.options.multiple) {
                if (this.options.maxItem !== true) {
                    this.options.maxItem = transform2PositiveNum(this.options.maxItem, 'maxItem');
                }
                if (this.options.showMultiSkin) {
                    if (!isString(this.options.multiField) || this.options.multiField === '') {
                        this.options.multiField = this.options.id;
                    }
                }
                if (this.options.multiStyle) {
                    this.props.multiStyle.space = this.options.multiStyle.space ? this.options.multiStyle.space : DEFAULT_ITEM_SPACE;
                    this.props.multiStyle.width = this.options.multiStyle.width ? this.options.multiStyle.width : DEFAULT_ITEM_WIDTH;
                }
            }
            if (!$.isFunction(this.options.success)) {
                this.options.success = function ($input, data) {
                    return true;
                };
            }
            if (!$.isFunction(this.options.disableRule)) {
                this.options.disableRule = function (data) {
                    return false;
                };
            }
            if (ids !== '') {
                this.getDataSource();
            }
            //init multi items
            if (this.options.multiple) {
                $input.addClass('multi');
                if (this.options.showMultiSkin && $magicsearch_wrapper.find('.' + doms.items).length === 0) {
                    var $items = $('<div class="' + doms.items + '"></div>');
                    $items.css({
                        'top': this.props.multiStyle.space + styles.borderTopWidth,
                        'left': this.props.multiStyle.space + styles.borderLeftWidth,
                        'bottom': this.props.multiStyle.space + styles.borderBottomWidth,
                        'right': this.props.multiStyle.space + styles.borderRightWidth + (this.options.dropdownBtn ? DROPDOWN_WIDTH : 0)
                    });
                    $magicsearch_wrapper.append($items);
                }
            }

            if (this.options.multiple) {
                var idArr = ids ? ids.split(',') : [];

                if (this.options.maxItem !== true && idArr.length >= this.options.maxItem) {
                    $input.attr('disabled', 'disabled');
                    $magicsearch_wrapper.addClass('disabled');
                }

                //init default style
                if (this.options.showMultiSkin) {
                    var hasSetId = [];
                    for (var i = 0; i < idArr.length; i++) {
                        hasSetId.push(idArr[i]);
                        $input.attr('data-id', hasSetId.join(','));
                        if (this.options.hidden) {
                            $magicsearch_wrapper.find('.' + doms.hidden).val(hasSetId.join(','));
                        }
                        this.appendHtml(this.props.objDataSource[idArr[i]]);
                    }
                }
            } else {
                if (ids !== '') {
                    var data = this.props.objDataSource[ids];
                    var format = this.options.inputFormat ? this.options.inputFormat : this.options.format;
                    $input.val(formatParse(format, data));
                }
            }
        },
        destroy: function destroy() {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent();
            if ($magicsearch_wrapper.attr('data-belong') === 'magicsearch') {
                this.element.style = this.props.style;
                $input.css({
                    'margin': $magicsearch_wrapper.css('margin'),
                    'padding-top': this.props.styles.paddingTop,
                    'padding-right': this.props.styles.paddingRight,
                    'padding-bottom': this.props.styles.paddingBottom,
                    'padding-left': this.props.styles.paddingLeft,
                    'height': this.props.styles.height,
                    'width': this.props.styles.width
                });
                var placeholder = $input.attr('data-placeholder');
                if (placeholder !== undefined) {
                    $input.attr('placeholder', placeholder);
                    $input.removeAttr('data-placeholder');
                }
                $input.removeClass('dropdown multi').removeAttr('disabled data-id');
                $input.siblings().remove();
                $input.unwrap();
                $input.off();
                $input.val('');
            }
        },
        getDataSource: function getDataSource() {
            var dataSource = this.options.dataSource;
            if (this.props.isFirstGetDataSource) {
                var objDataSource = {};
                for (var i = 0; i < dataSource.length; i++) {
                    for (var key in dataSource[i]) {
                        this.options.dataSource[i][key] = String(dataSource[i][key]);
                    }
                }
                this.props.isFirstGetDataSource = false;
                for (var _i2 = 0; _i2 < dataSource.length; _i2++) {
                    objDataSource[dataSource[_i2][this.options.id]] = dataSource[_i2];
                }
                this.props.objDataSource = objDataSource;
            }
            return this.options.dataSource;
        },
        setData: function setData() {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box),
                $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow),
                $ishover = $magicsearch_box.find('li.ishover');
            var options = this.options,
                ids = $input.attr('data-id'),
                data = this.props.objDataSource[$ishover.attr('data-id')];
            if (options.multiple) {
                if ($magicsearch_box.is(':hidden')) {
                    return;
                }
                $input.val('');

                var idArr = ids ? ids.split(',') : [];
                if (options.maxItem !== true && idArr.length >= options.maxItem) {
                    return this;
                }
                idArr.push($ishover.attr('data-id'));
                if (options.maxItem !== true && idArr.length == options.maxItem) {
                    $input.attr('disabled', 'disabled');
                    $magicsearch_wrapper.addClass('disabled');
                }
                $input.attr('data-id', idArr.join(','));
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val(idArr.join(','));
                }
                if (options.showMultiSkin) {
                    this.appendHtml(data);
                }
            } else {
                $input.val(options.inputFormat ? formatParse(options.inputFormat, data) : $ishover.text());
                $input.attr('data-id', $ishover.attr('data-id'));
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val($ishover.attr('data-id'));
                }
            }
            options.success($input, data);
            return this;
        },
        deleteData: function deleteData(id) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box),
                $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow);
            var that = this,
                delIdArr = id ? id.split(',') : [],
                ids = $input.attr('data-id'),
                idArr = ids ? ids.split(',') : [],
                options = this.options,
                styles = this.props.styles;

            if (!options.multiple) {
                id = $input.attr('data-id');
                $input.val('').attr('data-id', '');
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val('');
                }
                options.afterDelete($input, that.props.objDataSource[id]);
                return this;
            }

            var delCallBack = function delCallBack() {
                $(this).remove();
            };

            for (var i = 0; i < delIdArr.length; i++) {
                $magicsearch_wrapper.find('.' + doms.item + '[data-id="' + delIdArr[i] + '"]').fadeOut(400, delCallBack);
                idArr.splice(idArr.indexOf(delIdArr[i]), 1);
            }
            setTimeout(function () {
                var maxLineItem = parseInt((styles.maxWidth - (options.dropdownBtn ? DROPDOWN_WIDTH : 0) - styles.borderLeftWidth - styles.borderRightWidth - that.props.multiStyle.space) / (that.props.multiStyle.width + that.props.multiStyle.space));
                var lineNum = parseInt(idArr.length / maxLineItem);
                $input.attr('data-id', idArr.join(','));
                if (options.hidden) {
                    $magicsearch_wrapper.find('.' + doms.hidden).val(idArr.join(','));
                }
                $magicsearch_wrapper.removeClass('disabled');
                $input.removeAttr('disabled');
                if (options.showMultiSkin) {
                    if (idArr.length === 0 && $input.attr('data-placeholder')) {
                        $input.attr('placeholder', $input.attr('data-placeholder'));
                    }
                    $input.css('padding-left', idArr.length % maxLineItem * (that.props.multiStyle.width + that.props.multiStyle.space) + styles.paddingLeft);
                    $input.css('height', styles.height + lineNum * styles.sightHeight);
                    $input.css('padding-top', lineNum * styles.sightHeight + styles.paddingTop);
                    $magicsearch_box.css('top', styles.height + lineNum * styles.sightHeight);
                    if (lineNum === 0) {
                        var minWidth = (idArr.length % maxLineItem + 1) * (that.props.multiStyle.width + that.props.multiStyle.space) + that.props.multiStyle.space * 2 + styles.borderLeftWidth + styles.borderRightWidth + (options.dropdownBtn ? DROPDOWN_WIDTH : 0);
                        $input.css('min-width', minWidth);
                        $magicsearch_wrapper.css('min-width', minWidth);
                    }
                }
                if (delIdArr.length == 1) {
                    options.afterDelete($input, that.props.objDataSource[delIdArr[0]]);
                }
            }, 400);
            return this;
        },
        searchData: function searchData(isAll, isScroll) {
            var $input = this.$element,
                $magicsearch_box = $input.parent().find('.' + doms.box);

            var options = this.options,
                dataJson = this.getDataSource(),
                ids = $input.attr('data-id'),
                idArr = ids ? ids.split(',') : [],
                inputVal = $.trim($input.val()),
                htmlStr = '',
                data = [],
                isAppendHtml = true;

            //if is not scroll,clean all items first
            if (isScroll !== true) {
                $magicsearch_box.html('');
            }
            if (inputVal === '' && !isAll) {
                return this;
            }
            //get the match data
            if (isAll) {
                var page = $input.data('page') || 1;
                data = dataJson.slice(0);
                //skip selected data
                if (!options.showSelected) {
                    for (var i = 0, num = 0; i < data.length; i++) {
                        var index = idArr.indexOf(data[i][options.id]);
                        if (index > -1) {
                            data.splice(i, 1);
                            num++;
                            i--;
                            if (num == idArr.length) {
                                break;
                            }
                        }
                    }
                }
                //if page less than total page,page plus one
                if (page <= Math.ceil(data.length / ALL_DROPDOWN_NUM)) {
                    $input.data('page', page + 1);
                }
                data = data.slice((page - 1) * ALL_DROPDOWN_NUM, page * ALL_DROPDOWN_NUM);
                //will not appending html if data's length is zero when scrolling
                if (page != 1 && data.length === 0) {
                    isAppendHtml = false;
                }
            } else {
                var inputVals = [].concat(_toConsumableArray(new Set(inputVal.toLowerCase().split(' '))));
                var inputData = [];
                for (var _i3 = 0; _i3 < inputVals.length; _i3++) {
                    if (inputVals[_i3] === '') {
                        continue;
                    }
                    inputData.push({ value: inputVals[_i3], flag: false });
                }
                //search match data
                for (var _i4 = 0; _i4 < dataJson.length; _i4++) {
                    //skip selected
                    if (!options.showSelected) {
                        if (idArr.includes(dataJson[_i4][options.id])) {
                            continue;
                        }
                    }
                    inputData = inputData.map(function (item) {
                        item.flag = false;
                        return item;
                    });
                    for (var j = 0; j < options.fields.length; j++) {
                        for (var k = 0; k < inputData.length; k++) {
                            if (dataJson[_i4][options.fields[j]] !== null && dataJson[_i4][options.fields[j]].toLowerCase().includes(inputData[k].value)) {
                                inputData[k].flag = true;
                            }
                        }
                        var isMatch = inputData.every(function (item) {
                            return item.flag;
                        });
                        if (isMatch) {
                            data.push(dataJson[_i4]);
                            break;
                        }
                    }
                    if (data.length >= options.maxShow) {
                        break;
                    }
                }
            }

            //generate html string
            if (data.length === 0) {
                var noResult = options.noResult ? options.noResult : '&#x672a;&#x641c;&#x7d22;&#x5230;&#x7ed3;&#x679c;';
                htmlStr = '<span class="no-result">' + noResult + '</span>';
            } else {
                //delete empty input
                var _inputVals = [].concat(_toConsumableArray(new Set(inputVal.split(' ')))).filter(function (item) {
                    return item !== '';
                });
                var tempArr = [];
                for (var _i5 = 0; _i5 < _inputVals.length - 1; _i5++) {
                    for (var _j = _i5 + 1; _j < _inputVals.length; _j++) {
                        tempArr.push(_inputVals[_i5] + ' ' + _inputVals[_j]);
                    }
                }
                _inputVals = _inputVals.concat(tempArr);
                //locate highlight chars
                var dataHighlight = void 0;
                if (!isAll) {
                    dataHighlight = $.extend(true, [], data);
                    data.forEach(function (item, index) {
                        options.fields.forEach(function (field) {
                            var posArr = [];
                            if (item[field] !== null) {
                                for (var _i6 = 0; _i6 < item[field].length; _i6++) {
                                    posArr[_i6] = 0;
                                }
                                _inputVals.forEach(function (value) {
                                    var position = item[field].toLowerCase().indexOf(value.toLowerCase());
                                    if (position > -1) {
                                        for (var _i7 = position; _i7 < value.length + position; _i7++) {
                                            posArr[_i7] = 1;
                                        }
                                    }
                                });
                            }
                            var tmpPosArr = [];
                            var hasStarted = false,
                                start = -1,
                                length = 0;
                            for (var _i8 = posArr.length - 1; _i8 >= 0; _i8--) {
                                if (posArr[_i8] == 1) {
                                    if (!hasStarted) {
                                        hasStarted = true;
                                        start = _i8;
                                    } else {
                                        start--;
                                    }
                                    length++;
                                    if (_i8 === 0) {
                                        tmpPosArr.push({ start: start, length: length });
                                    }
                                } else {
                                    if (hasStarted) {
                                        hasStarted = false;
                                        tmpPosArr.push({ start: start, length: length });
                                        length = 0;
                                    }
                                }
                            }
                            if (dataHighlight[index][field] !== undefined) {
                                dataHighlight[index][field] = tmpPosArr;
                            }
                        });
                    });
                }

                htmlStr += '<ul>';
                data.forEach(function (item, index) {
                    var tmpItem = $.extend({}, item);
                    htmlStr += '<li class="';
                    htmlStr += options.disableRule(item) ? 'disabled' : 'enabled';
                    if (options.showSelected) {
                        htmlStr += idArr.includes(item[options.id]) ? ' selected' : '';
                    }
                    htmlStr += '" data-id="' + (item[options.id] === undefined ? '' : item[options.id]) + '"';
                    if (!isAll) {
                        options.fields.forEach(function (field) {
                            if (item[field] !== null) {
                                dataHighlight[index][field].forEach(function (value) {
                                    var matchStr = tmpItem[field].substr(value.start, value.length);
                                    tmpItem[field] = tmpItem[field].replace(new RegExp(matchStr, 'i'), '<span class="keyword">' + matchStr + '</span>');
                                });
                            }
                        });
                    }
                    htmlStr += ' title="' + formatParse(options.format, item) + '">' + formatParse(options.format, tmpItem) + '</li>';
                });
                htmlStr += '</ul>';
            }

            //create dom
            if (isAll) {
                if (isAppendHtml) {
                    $magicsearch_box.html($magicsearch_box.html() + htmlStr);
                }
                $magicsearch_box.addClass('all');
            } else {
                $magicsearch_box.html(htmlStr);
                $magicsearch_box.removeClass('all').css('max-height', 'none');
            }
            return this;
        },
        showSearchBox: function showSearchBox(callback) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box);
            if ($magicsearch_box.is(':visible')) {
                return false;
            }
            //rotate the dropdown button 180deg
            if (this.options.dropdownBtn) {
                var $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow);
                $magicsearch_arrow.removeClass('arrow-rotate-360');
                $magicsearch_arrow.addClass('arrow-rotate-180');
            }
            $magicsearch_box.slideDown(BOX_ANIMATE_TIME, callback);
            return this;
        },
        hideSearchBox: function hideSearchBox(isClear) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box);
            if (!$magicsearch_box.is(':visible')) {
                return false;
            }
            if (isClear === undefined) {
                if (this.options.isClear && (this.options.multiple || $input.attr('data-id') === '')) {
                    $input.val('');
                }
            } else {
                if (isClear) {
                    $input.val('');
                }
            }
            //rotate the dropdown button 360deg
            if (this.options.dropdownBtn) {
                var $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow);
                $magicsearch_arrow.removeClass('arrow-rotate-180');
                $magicsearch_arrow.addClass('arrow-rotate-360');
            }
            setTimeout(function () {
                $magicsearch_box.scrollTop(0);
            }, BOX_ANIMATE_TIME - 1);
            $magicsearch_box.slideUp(BOX_ANIMATE_TIME, function () {
                $magicsearch_box.html('');
            });
            return this;
        },
        appendHtml: function appendHtml(data) {
            var $input = this.$element,
                $magicsearch_wrapper = $input.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box),
                $magicsearch_arrow = $magicsearch_wrapper.find('.' + doms.arrow),
                $ishover = $magicsearch_box.find('li.ishover');
            var options = this.options,
                styles = this.props.styles,
                that = this;

            var idArr = $input.attr('data-id').split(',');
            if ($input.attr('placeholder')) {
                $input.removeAttr('placeholder');
            }
            var maxLineItem = parseInt((styles.maxWidth - (options.dropdownBtn ? DROPDOWN_WIDTH : 0) - styles.borderLeftWidth - styles.borderRightWidth - that.props.multiStyle.space) / (that.props.multiStyle.width + that.props.multiStyle.space));

            //create item and insert into items
            var $item = $('<div class="' + doms.item + '" data-id="' + data[options.id] + '" title="' + formatParse(options.format, data) + '"><span>' + formatParse(SEPARATOR + options.multiField + SEPARATOR, data) + '</span><a class="' + doms.close + '" data-id="' + data[options.id] + '" href="javascript:;"></a></div>');
            $item.css({
                'height': styles.sightHeight - that.props.multiStyle.space * 2,
                'width': that.props.multiStyle.width,
                'margin-bottom': that.props.multiStyle.space * 2,
                'margin-right': that.props.multiStyle.space,
                'line-height': styles.sightHeight - that.props.multiStyle.space * 2 - 2 + 'px'
            });
            $item.find('.' + doms.close).css({
                'top': parseInt((styles.sightHeight - that.props.multiStyle.space * 2 - 2 - 12) / 2)
            });

            var lineNum = parseInt(idArr.length / maxLineItem);
            $input.css('padding-left', styles.paddingLeft + idArr.length % maxLineItem * (that.props.multiStyle.width + that.props.multiStyle.space));
            if (idArr.length % maxLineItem === 0) {
                $input.css('height', styles.height + lineNum * styles.sightHeight);
                $input.css('padding-top', lineNum * styles.sightHeight);
                $magicsearch_box.css('top', styles.height + lineNum * styles.sightHeight);
            } else {
                if (lineNum === 0) {
                    var minWidth = (idArr.length % maxLineItem + 1) * (that.props.multiStyle.width + that.props.multiStyle.space) + that.props.multiStyle.space * 2 + styles.borderLeftWidth + styles.borderRightWidth + (options.dropdownBtn ? DROPDOWN_WIDTH : 0);
                    $input.css('min-width', minWidth);
                    $magicsearch_wrapper.css('min-width', minWidth);
                }
            }

            //bind click event on delete button
            $item.find('.' + doms.close).click(function () {
                that.deleteData($(this).attr('data-id')).hideSearchBox();
            });
            $magicsearch_wrapper.find('.' + doms.items).append($item);
        }
    };

    $.fn.magicsearch = function (options) {
        var hasDropdownBtn = false;
        var searchTimeout = null;
        var preInput = '';
        var jqo = this.each(function () {
            var $this = $(this);
            var magicSearch = $.data(this, 'magicsearch');
            if (magicSearch) {
                magicSearch.destroy();
            }
            magicSearch = new MagicSearch(this, options);
            if (magicSearch.init() === false) {
                return;
            }
            $.data(this, 'magicsearch', magicSearch);
            var selfOptions = magicSearch.options;
            var $magicsearch_wrapper = $this.parent(),
                $magicsearch_box = $magicsearch_wrapper.find('.' + doms.box);
            var dropdown = function dropdown() {
                if ($magicsearch_wrapper.hasClass('disabled')) {
                    return false;
                }
                if ($magicsearch_box.is(':visible')) {
                    magicSearch.hideSearchBox();
                } else {
                    $magicsearch_box.css({
                        'max-height': selfOptions.dropdownMaxItem * 30 + 8
                    });
                    $magicsearch_box.unbind('scroll');
                    $this.data('page', 1);
                    magicSearch.searchData(true).showSearchBox(function () {
                        $magicsearch_box.on('scroll', function (e) {
                            if (this.scrollHeight - $(this).scrollTop() < 300) {
                                magicSearch.searchData(true, true);
                            }
                        });
                    });
                }
            };
            $this.off().on('keyup', function (e) {
                var $_this = $(this);
                if (e.which == KEY.ESC) {
                    $_this.val('').focus();
                    magicSearch.hideSearchBox();
                } else if (e.which == KEY.DOWN) {
                    var $li = $magicsearch_box.find('li');
                    var $ishover = $magicsearch_box.find('li.ishover');
                    if ($li.length > 0) {
                        if ($ishover.length > 0) {
                            $ishover.toggleClass('ishover');
                            if ($ishover.next().length > 0) {
                                $ishover.next().toggleClass('ishover');
                            } else {
                                $magicsearch_box.find('li:first').toggleClass('ishover');
                            }
                        } else {
                            $magicsearch_box.find('li:first').toggleClass('ishover');
                        }
                    }
                    return false;
                } else if (e.which == KEY.UP) {
                    var _$li = $magicsearch_box.find('li');
                    var _$ishover = $magicsearch_box.find('li.ishover');
                    if (_$li.length > 0) {
                        if (_$ishover.length > 0) {
                            _$ishover.toggleClass('ishover');
                            if (_$ishover.prev().length > 0) {
                                _$ishover.prev().toggleClass('ishover');
                            } else {
                                $magicsearch_box.find('li:last').toggleClass('ishover');
                            }
                        } else {
                            $magicsearch_box.find('li:last').toggleClass('ishover');
                        }
                    }
                    return false;
                } else if (e.which == KEY.ENTER) {
                    var _$ishover2 = $magicsearch_box.find('li.ishover');
                    if (_$ishover2.length > 0) {
                        _$ishover2.trigger('click');
                    }
                } else if (e.which == KEY.LEFT || e.which == KEY.RIGHT) {
                    return true;
                } else {
                    var currentInput = $_this.val();
                    if ($.trim(preInput) == $.trim(currentInput)) {
                        return true;
                    }
                    if (currentInput !== '') {
                        if ($.trim(currentInput) === '') {
                            magicSearch.hideSearchBox(e.which == KEY.BACKSPACE || e.which == KEY.SPACE ? false : undefined);
                            return false;
                        }
                        //hide search box when key up
                        if (!selfOptions.multiple && $_this.attr('data-id') !== '') {
                            magicSearch.hideSearchBox();
                            return;
                        }
                        clearTimeout(searchTimeout);
                        searchTimeout = setTimeout(function () {
                            magicSearch.searchData().showSearchBox();
                        }, SEARCH_DELAY);
                    } else {
                        magicSearch.hideSearchBox();
                    }
                }
            }).on('keydown', function (e) {
                var $_this = $(this);
                if (e.which == KEY.ESC) {} else if (e.which == KEY.UP) {
                    return false;
                } else if (e.which == KEY.DOWN) {
                    return false;
                } else if (e.which == KEY.ENTER) {
                    return !$magicsearch_box.is(':visible');
                } else if (e.which == KEY.BACKSPACE) {
                    preInput = $_this.val();
                    if (selfOptions.multiple) {
                        var $last_multi_item = $magicsearch_wrapper.find('.' + doms.items + ' .' + doms.item + ':last');
                        if (selfOptions.showMultiSkin && $_this.val() === '') {
                            magicSearch.deleteData($last_multi_item.attr('data-id')).hideSearchBox();
                        }
                    } else {
                        if ($(this).attr('data-id') !== '') {
                            magicSearch.deleteData();
                            magicSearch.hideSearchBox();
                        }
                    }
                } else if (e.which == KEY.LEFT || e.which == KEY.RIGHT) {
                    return true;
                } else {
                    preInput = $_this.val();
                    if (preInput !== '') {
                        //set empty value when key down
                        if (!selfOptions.multiple && $_this.attr('data-id') !== '') {
                            magicSearch.deleteData();
                            return;
                        }
                    }
                }
            }).on('focus', function () {
                $magicsearch_wrapper.addClass('focus');
                if (!selfOptions.isClear && $this.val() !== '' && $this.attr('data-id') === '') {
                    magicSearch.searchData().showSearchBox();
                } else if (selfOptions.focusShow) {
                    dropdown();
                }
            }).on('blur', function () {
                $magicsearch_wrapper.removeClass('focus');
                magicSearch.hideSearchBox();
            });

            $magicsearch_box.off().on('mousedown', 'ul', function () {
                return false;
            }).on('mouseenter', 'li', function () {
                $(this).parent().find('li.ishover').removeClass('ishover');
                $(this).addClass('ishover');
            }).on('mouseleave', 'li', function () {
                $(this).removeClass('ishover');
            }).on('click', 'li', function () {
                var $li = $(this);
                if ($li.hasClass('selected') && selfOptions.multiple) {
                    magicSearch.deleteData($li.attr('data-id')).hideSearchBox();
                } else {
                    magicSearch.setData().hideSearchBox();
                }
            });

            //When the option of dropdownBtn is true,bind the related event
            if (selfOptions.dropdownBtn) {
                hasDropdownBtn = true;
                $magicsearch_wrapper.on('click', '.' + doms.arrow, function () {
                    return dropdown();
                });
            }
            $this.on('clear', function () {
                $this.val('');
                if (selfOptions.multiple) {
                    if (selfOptions.showMultiSkin) {
                        magicSearch.deleteData($this.attr('data-id'));
                    } else {
                        $this.attr('data-id', '');
                        if (selfOptions.hidden) {
                            $magicsearch_wrapper.find('.' + doms.hidden).val('');
                        }
                    }
                } else {
                    $this.attr('data-id', '');
                    if (selfOptions.hidden) {
                        $magicsearch_wrapper.find('.' + doms.hidden).val('');
                    }
                }
            }).on('update', function (e, options) {
                //update dataSource
                if (options.dataSource !== undefined) {
                    var tmpDataSource = options.dataSource;
                    if (isString(tmpDataSource)) {
                        if (options.dataSource.toLowerCase() == 'null') {
                            tmpDataSource = [];
                        } else {
                            try {
                                tmpDataSource = $.parseJSON(options.dataSource);
                                if (!$.isArray(tmpDataSource)) {
                                    var dataSource = [];
                                    for (var id in tmpDataSource) {
                                        dataSource.push(tmpDataSource[id]);
                                    }
                                    tmpDataSource = dataSource;
                                }
                            } catch (err) {
                                tmpDataSource = [];
                                console.error('magicsearch: The dataSource you updated is wrong,please check.');
                            }
                        }
                    }
                    magicSearch.props.isFirstGetDataSource = true;
                    magicSearch.options.dataSource = tmpDataSource;
                }
            }).on('set', function (e, options) {
                var originId = magicSearch.$element.attr('data-id');
                var multi = magicSearch.options.multiple;
                magicSearch.destroy();
                magicSearch.$element.attr('data-id', options.override || !multi ? options.id : [].concat(_toConsumableArray(new Set((originId ? originId.split(',') : []).concat(options.id.split(','))))));
                magicSearch.$element.magicsearch(magicSearch.options);
            }).on('destroy', function () {
                magicSearch.destroy();
            });
            $magicsearch_wrapper.on('click', '.' + doms.items, function (e) {
                if ($(e.target).is('.' + doms.items)) {
                    $this.focus();
                }
            }).on('mousedown', '.' + doms.items, function () {
                return false;
            });
        });

        if (hasDropdownBtn && !window.MagicSearch.hasBindBody) {
            $('body').on('mousedown', function (e) {
                var $target = $(e.target),
                    $magicsearch_wrapper = $(this).find('.' + doms.wrapper + ' .' + doms.box + ':visible').first().parent(),
                    $input = $magicsearch_wrapper.find('input:text');
                var index = $magicsearch_wrapper.attr('data-index');
                if (index !== undefined && !$target.is('.' + doms.wrapper + '[data-index="' + index + '"] *')) {
                    $.data($input.get(0), 'magicsearch').hideSearchBox();
                }
            });
            window.MagicSearch.hasBindBody = true;
        }
        return jqo;
    };

    window.MagicSearch = {
        v: '1.0.2',
        index: 0,
        hasBindBody: false
    };
});