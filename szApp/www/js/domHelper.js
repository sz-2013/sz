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
    if (el.classList !== undefined) {
        var classes = splitWords(name);
        for (var i = 0, len = classes.length; i < len; i++) {
            el.classList.add(classes[i]);
        }
    } else if (!hasClass(el, name)) {
        var className = getClass(el);
        setClass(el, (className ? className + ' ' : '') + name);
    }
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