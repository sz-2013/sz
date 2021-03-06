function isArray(val){
    return Object.prototype.toString.call( val ) === '[object Array]'
}

function trim(str){
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}


function splitWords(str){
    return trim(str).split(/\s+/);
}


function getClass(el) {
    return el.className.baseVal === undefined ? el.className : el.className.baseVal;
}


function setClass(el, name) {
    if (el.className.baseVal === undefined) {
        el.className = name;
    } else {
        el.className.baseVal = name;
    }
}


function hasClass(el, name) {
    if (el.classList !== undefined) {
        return el.classList.contains(name);
    }
    var className = getClass(el);
    return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
}


function addClass(id, name){
    var el = typeof id == 'string' ? document.getElementById(id) : id;
    var namesList = isArray( name ) ? name : [name];
    var name = namesList.pop();
    if (el.classList !== undefined) {
        var classes = splitWords(name);
        for (var i = 0, len = classes.length; i < len; i++) {
            el.classList.add(classes[i]);
        }
    } else if (!hasClass(el, name)) {
        var className = getClass(el);
        setClass(el, (className ? className + ' ' : '') + name);
    }
    if(namesList.length) return addClass(el, namesList)
}


function removeClass (el, name) {
    if (el.classList !== undefined) {
        el.classList.remove(name);
    } else {
        setClass(el, trim((' ' + getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
    }
}


function toggleClass(el, name){
    if(hasClass(el, name)) removeClass(el, name)
    else addClass(el, name)
}


function node2array(nodes){
    return Array.prototype.slice.call(nodes)
}


function sameNode(n1, n2){
    var fn = n1.isSameNode ? 'isSameNode' : 'isEqualNode';
    return n1[fn](n2)
}


Array.prototype.compare = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].compare(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}

String.prototype.toIntArray = function(separate){
    var array = this.split(separate || ',');
    return array.map(function(el){return parseInt(el, 10)})
}


function getMouse (e) {
    if(e.changedTouches) var e = e.changedTouches[0];
    return {x: e.clientX, y: e.clientY}
}

function findParent(parentSellector, el, nodes){
    var parent = el.parentNode;
    var nodes = nodes || node2array(document.querySelectorAll(parentSellector));
    return nodes.filter(function(el){return el == parent}).length ? parent :
           parent != document ? findParent(parentSellector, parent, nodes) :
           null
}


function random(min,max){
    return Math.floor(Math.random()*(min || 2)+(max||0))
}

function choice(array){
    return array[random(0, array.length-1)]
}