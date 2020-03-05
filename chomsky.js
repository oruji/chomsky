var types = {
  ADD: 'add',
  MUL: 'mul',
  STAR: 'star',
  ATOM: 'atom'
};

var specs = {
  LAMBDA: '\u03BB'
};

var hier;

var minimize_list = [{
  'rule': '(expr) => expr',
  'func': minimize_01
}, {
  'rule': 'exprλ => expr',
  'func': minimize_02
}];

function minimize_single(str, myFunc) {
  hier = toHier(str);

  var notMin;

  do {
    notMin = minimize_rec(hier, myFunc);
    console.log(toStr(hier));
    console.log(toStr(hier) === str);

  } while (notMin);

  var str = toStr_rec(hier);

  return str;
}

function minimize(str, param) {
  hier = toHier(str);

  if (param === undefined) {
    param = {};
  }

  if (param.rules === undefined) {
    param.rules = [];
  }

  var notMin;

  do {
    notMin = minimize_loop(hier, param);

    if (notMin)
      param.rules.push(notMin);

  } while (notMin);

  var str = toStr_rec(hier);

  return str;
}

function minimize_loop(hier, param) {
  for (var i = 0; i < minimize_list.length; i++) {
    var notMin = minimize_rec(hier, minimize_list[i]['func']);

    if (notMin) {
      return minimize_list[i]['rule'];
    }
  }
  return null;
}

function minimize_rec(hier, myFunc) {
  var minimized = myFunc(hier);

  if (minimized) {
    return minimized;
  }

  if (hier.key === types.MUL || hier.key === types.ADD) {
    for (var i = 0; i < hier.val.length; i++) {
      minimized = minimize_rec(hier.val[i], myFunc);

      if (minimized) {
        return minimized;
      }
    }
  }

  return false;
}

// exprλ => expr
function minimize_02(hier) {
  if (hier.key === types.MUL && hier.val.length >= 2) {
    var lamIndex = -1;

    for (var i = 0; i < hier.val.length; i++) {
      if (hier.val[i].val === specs.LAMBDA) {
        lamIndex = i;
      }
    }

    if (lamIndex >= 0) {
      hier.val.splice(lamIndex, 1);

      return true;
    }
  }

  return false;
}

// (expr) => expr, mul & add with len=1 are not mull & add
function minimize_01(hier) {
  if (hier.key === types.MUL || hier.key === types.ADD) {
    if (hier.val.length === 1) {
      hier.key = hier.val[0].key;
      copyObj(hier, hier.val[0]);

      return true;
    }
  }

  return false;
}

// convert String to Hierarchical Structure
function toHier(str) {
  // convert string to array
  var arr = [];
  for (var i = 0; i < str.length; i++) {
    arr.push(str[i]);
  }

  // generate hierarchical structure
  if (arr.length === 0) {
    return genMul([]);
  }

  var globArr = genGlobArr(arr);
  var hier = firstComp(globArr);

  return hier;
}

function select() {
  return this.arr[this.index];
}
function next() {
  ++this.index;
}
function genGlobArr(arr) {
  return {
    arr: arr,
    index: 0,
    select: select,
    next: next
  };
}

function firstComp(globArr) {
  var items = [];
  while (true) {
    items.push(secondComp(globArr));
    if (globArr.select() === "+") {
      globArr.next();
    } else {
      break;
    }
  }

  return genAdd(items);
}

function secondComp(globArr) {
  var items = [];
  var item;

  while (true) {
    item = thirdComp(globArr);

    if (item === undefined) {
      break;
    }

    items.push(item);
  }
  if (items.length === 0) {
    throw new RegexError("empty add items subexpression at index "
      + globArr.index, globArr.index);
  }

  return genMul(items);
}

function thirdComp(globArr) {
  var item = forthComp(globArr);

  if (globArr.select() === "*") {
    globArr.next();
    item = genStar(item);
  }
  return item;
}

function forthComp(globArr) {
  if (globArr.select() === "(") {
    globArr.next();
    var expr = firstComp(globArr);

    if (globArr.select() !== ")") {
      throw new RegexError("missing matching right parenthesis at "
        + globArr.index, globArr.index);
    }

    globArr.next();

    return expr;

  } else if (globArr.select() === specs.LAMBDA) {
    globArr.next();

    return genAtom(specs.LAMBDA);

  } else if (globArr.select() === undefined || globArr.select() === "+"
    || globArr.select() === ")") {

    return undefined;

  } else if (globArr.select() === "*") {
    throw new RegexError("empty before star at " + globArr.index, globArr.index);

  } else {
    var item = genAtom(globArr.select());
    globArr.next();

    return item;
  }
}

function genAdd(sels) {
  return {
    key: types.ADD,
    val: sels
  };
}

function genMul(els) {
  return {
    key: types.MUL,
    val: els
  };
}

function genStar(expr) {
  return {
    key: types.STAR,
    val: expr
  };
}

function genAtom(atom) {
  return {
    key: types.ATOM,
    val: atom
  };
}

function RegexError(message, position) {
  this.name = "RegexError";
  this.message = message;
  this.position = position;
}

RegexError.protokey = new Error();

function removeObj(obj) {
  for (var o in obj) {
    if (obj.hasOwnProperty(o)) {
      delete obj[o];
    }
  }
}

function copyObj(obj, obj2) {
  removeObj(obj);

  for (o in obj2) {
    if (obj2.hasOwnProperty(o)) {
      obj[o] = obj2[o];
    }
  }
}

function toStr(hier) {
  var str = toStr_rec(hier);

  if (str.startsWith("(") && str.endsWith(")"))
    str = str.substring(1, str.length - 1);

  return str;
}

function toStr_rec(hier) {
  if (hier.key === types.ATOM) {
    return hier.val;

  } else if (hier.key === types.STAR) {
    return toStr_rec(hier.val) + "*";

  } else if (hier.key === types.MUL) {
    var tempStr = "";

    for (var i = 0; i < hier.val.length; i++) {
      tempStr += toStr_rec(hier.val[i]);
    }

    return "(" + tempStr + ")";

  } else if (hier.key === types.ADD) {
    var tempStr = "";

    for (var i = 0; i < hier.val.length; i++) {
      if (tempStr !== "")
        tempStr += "+";
      tempStr += toStr_rec(hier.val[i]);
    }

    return "(" + tempStr + ")";
  }
}