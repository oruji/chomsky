function arrLast(arr, num) {
    if (num === undefined)
        num = 1;
    return arr[arr.length - num];
}

function delObj(obj) {
    for (var o in obj) {
        if (obj.hasOwnProperty(o)) {
            delete obj[o];
        }
    }
}

function copyObj(obj1, obj2) {
    delObj(obj);

    for (var o in obj2) {
        if (o2.hasOwnProperty(o)) {
            obj1[o] = obj2[o];
        }
    }
}

function areEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }

    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }

    if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
        return obj1.source === obj2.source &&
            obj1.global === obj2.global &&
            obj1.multiline === obj2.multiline &&
            obj1.lastIndex === obj2.lastIndex &&
            obj1.ignoreCase === obj2.ignoreCase;
    }

    if (!(obj1 instanceof Object) || !(obj2 instanceof Object)) {
        return false;
    }

    if (typeof obj1 === 'undefined' || typeof obj2 === 'undefined') {
        return false;
    }

    if (obj1.constructor !== obj2.constructor) {
        return false;
    }

    for (var p in obj1) {
        if (!(p in obj2)) {
            return false;
        }

        if (obj1[p] === obj2[p]) {
            continue;
        }

        if (typeof (obj1[p]) !== "object") {
            return false;
        }

        if (!(areEqual(obj1[p], obj2[p]))) {
            return false;
        }
    }

    for (p in obj2) {
        if (!(p in obj1)) {
            return false;
        }
    }

    return true;
}

function contains(arr, obj, startIndex) {
  startIndex = startIndex ? startIndex : 0;

  for (var i=startIndex; i<arr.length; i++) {
    if (areEqual(arr[i], obj)) {
      return true;
    }
  }

  return false;
}

function index(arr, obj, startIndex) {
  var i = startIndex || 0;
  
  while (i < arr.length) {
    if (areEqual(arr[i], obj)) {
      return i;
    }
    
    i++;
  }
  
  return -1;
}

function arrUnique(arr) {
    var arrUnq = arr.concat();
    for (var i = 0; i < arrUnq.length; ++i) {
        for (var j = i + 1; j < arrUnq.length; ++j) {
            if (arrUnq[i] === arrUnq[j])
                arrUnq.splice(j--, 1);
        }
    }

    return arrUnq;
}

function arrMerge(arr1, arr2) {
    return arrUnique(arr1.concat(arr2));
}

function arrHasObj(arr, obj) {
    for (var i = 0; i < arr.length; i++) {
        if (areEqual(arr[i], obj)) {
            return i;
        }
    }

    return -1;
}

function hasStar(treeList) {
  var reList = [];
  
  for (var i = 0; i < treeList.length; i++) {
    if (treeList[i].isStar()) {
      reList.push(i);
    }
  }
  
  return reList;
}

function hasMul(treeList) {
  var reList = [];
  
  for (var i = 0; i < treeList.length; i++) {
    if (treeList[i].isMul()) {
      reList.push(i);
    }
  }
  
  return reList;
}

function hasLam(treeList) {
  for (var i = 0; i < treeList.length; i++) {
    if (treeList[i].isLam()) {
      return i;
    }
  }
  
  return -1;
}

function areSame(treeList) {
  var first = treeList[0];
  for (var i = 1; i < treeList.length; i++) {
    if (!areEqual(first, treeList[i])) {
      return false;
    }
  }
  
  return true;
}

function msToTime(s) {

  // Pad to 2 or 3 digits, default is 2
  function pad(n, z) {
    z = z || 2;
    return ('00' + n).slice(-z);
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}