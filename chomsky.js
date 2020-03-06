var minimize_list = [];

function minimize(hier, param) {
  var hierCopy = JSON.parse(JSON.stringify(hier));

  if (param === undefined) {
    param = {};
  }

  var paramCopy = JSON.parse(JSON.stringify(param));

  if (paramCopy.loopNo === undefined) {
    paramCopy.loopNo = null;
  }

  if (paramCopy.rulesDone === undefined) {
    paramCopy.rulesDone = null;

  } else {
    paramCopy.rulesDone = param.rulesDone;
  }

  var ruleDone = "temp";
  var counter = 0;

  while (ruleDone !== null && (paramCopy.loopNo === null || counter < paramCopy.loopNo)) {
    ruleDone = minimize_loop(hierCopy);

    if (ruleDone !== null && paramCopy.rulesDone !== null) {
      paramCopy.rulesDone.push(ruleDone);
    }

    counter += 1;
  }

  return hierCopy;
}

function minimize_loop(hier) {
  var pattern = null;
  var result = null;

  for (var i = 0; i < minimize_list.length; i++) {
    pattern = minimize_list[i];

    result = minimize_rec(hier, pattern['func']);

    if (result) {
      return pattern.rule;
    }
  }

  return null;
}

function minimize_rec(hier, ruleFunc) {
  var ruleDone = ruleFunc(hier);

  if (ruleDone) {
    return ruleDone;
  }

  var childArr = [];

  if (hier.key === types.ADD || hier.key === types.MUL || hier.key === types.STAR) {
    childArr = hier.val;
  }

  for (var i = 0; i < childArr.length; i++) {
    ruleDone = minimize_rec(childArr[i], ruleFunc);

    if (ruleDone) {
      return ruleDone;
    }
  }

  return false;
}

function minimize_step(regex) {
  var param = { loopNo: 1, rulesDone: [] };
  var result = strMinimize(regex, param);
  var lastRuleNo = param.rulesDone.length;

  while (result === regex) {
    param.loopNo += 1;
    param.rulesDone = [];
    result = strMinimize(regex, param);

    if (param.rulesDone.length === 0 ||
      param.rulesDone.length === lastRuleNo)
      break;

    lastRuleNo = param.rulesDone.length;
  }

  return [result, param.rulesDone];
}

minimize_list.push({ 'func': minimize_03, 'rule': "a+(b+c) -> a+b+c, a(bc) -> abc", 'type': '' });
minimize_list.push({ 'func': minimize_02, 'rule': "λa -> a", 'type': '' });
minimize_list.push({ 'func': minimize_01, 'rule': "(a) -> a", 'type': '' });

// a+(b+c) -> a+b+c, a(bc) -> abc, Associative property
function minimize_03(hier) {
  if ((hier.key === types.ADD || hier.key === types.MUL)
    && hier.val.length >= 2) {
    var found = -1, i;

    for (i = 0; i < hier.val.length; i++) {
      if (hier.val[i].key === hier.key) {
        found = i;
      }
    }

    if (found >= 0) {
      var node = hier.val[found];
      hier.val.splice(found, 1);

      for (i = 0; i < node.val.length; i++) {
        hier.val.splice(found + i, 0, node.val[i]);
      }

      return true;
    }
  }

  return false;
}

// λa -> a
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

// (a) -> a
function minimize_01(hier) {
  if ((hier.key === types.MUL || hier.key === types.ADD)
    && hier.val.length === 1) {
    hier.key = hier.val[0].key;

    delAndCopy(hier, hier.val[0]);
    return true;
  }

  return false;
}

var types = {
  ADD: 'add',
  MUL: 'mul',
  STAR: 'star',
  ATOM: 'atom',
};

var specs = {
  LAMBDA: '\u03BB'
};

function delAndCopy(o1, o2) {
  var p;

  for (p in o1) {
    if (o1.hasOwnProperty(p)) {
      delete o1[p];
    }
  }

  for (p in o2) {
    if (o2.hasOwnProperty(p)) {
      o1[p] = o2[p];
    }
  }
}

function genType(type, item) {
  return {
    key: type,
    val: item
  };
}

var _prec = {};
_prec[types.ADD] = 0;
_prec[types.MUL] = 1;
_prec[types.STAR] = 2;
_prec[types.ATOM] = 3;

function needParens(par, child) {
  return _prec[par.key] >= _prec[child.key];
}

function _optParenToArray(par, child, arr) {
  var parens = needParens(par, child);

  if (parens) {
    arr.push("(");
  }
  _dispatchToArray(child, arr);

  if (parens) {
    arr.push(")");
  }
}

function _binOpToArray(regex, arr, parts, operand) {
  for (var i = 0; i < parts.length; i++) {
    if (operand !== undefined && i > 0) {
      arr.push(operand);
    }
    _optParenToArray(regex, parts[i], arr);
  }
}

function addToArray(regex, arr) {
  _binOpToArray(regex, arr, regex.val, "+");
}

function mulToArray(regex, arr) {
  _binOpToArray(regex, arr, regex.val);
}

function starToArray(regex, arr) {
  _optParenToArray(regex, regex.val, arr);
  arr.push("*");
}

function atomToArray(regex, arr) {
  arr.push(regex.val);
}

var _toArrayFuns = {};
_toArrayFuns[types.ADD] = addToArray;
_toArrayFuns[types.MUL] = mulToArray;
_toArrayFuns[types.STAR] = starToArray;
_toArrayFuns[types.ATOM] = atomToArray;

function _dispatchToArray(regex, arr) {
  return _toArrayFuns[regex.key](regex, arr);
}

function toArray(regex) {
  var arr = [];
  _dispatchToArray(regex, arr);
  return arr;
}

function toString(regex) {
  var arr = toArray(regex);
  var str = arr.join("");

  return str;
}

function RegError(message, position) {
  this.name = "RegError";
  this.message = message;
  this.position = position;
}

RegError.prototype = new Error();

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

function arrToHier(arr) {
  if (arr.length === 0) {
    return genType(types.MUL, []);
  }

  var globArr = genGlobArr(arr);
  var result = firstComp(globArr);

  if (globArr.select() !== undefined) {
    throw new RegError("Unexpected regex array: successfully parsed up to position " + globArr.index, globArr.index);
  }

  return result;
}

function firstComp(globArr) {
  var concats = [];

  while (true) {
    concats.push(secondComp(globArr));

    if (globArr.select() === "+") {
      globArr.next();
    } else {
      break;
    }
  }

  return genType(types.ADD, concats);
}

function secondComp(globArr) {
  var itemArr = [];
  var item;

  while (true) {
    item = thirdComp(globArr);

    if (item === undefined) {
      break;
    }

    itemArr.push(item);
  }

  if (itemArr.length === 0) {
    throw new RegError("Unexpected regex array: empty choice subexpression at index " +
      globArr.index, globArr.index);
  }

  return genType(types.MUL, itemArr);
}

function thirdComp(globArr) {
  var atom = forthComp(globArr);

  if (globArr.select() === "*") {
    globArr.next();
    atom = genType(types.STAR, atom);
  }

  return atom;
}

function forthComp(globArr) {
  if (globArr.select() === "(") {
    globArr.next();
    var expr = firstComp(globArr);

    if (globArr.select() !== ")") {
      throw new RegError("Unexpected regex array: missing matching right parenthesis at index " +
        globArr.index, globArr.index);
    }

    globArr.next();

    return expr;

  } else if (globArr.select() === specs.LAMBDA) {
    globArr.next();
    return genType(types.ATOM, specs.LAMBDA);

  } else if (globArr.select() === undefined || globArr.select() === "+" ||
    globArr.select() === ")") {
    return undefined;

  } else if (globArr.select() === "*") {
    throw new RegError("Unexpected regex array: empty subexpression before Kleene star at index " +
      globArr.index, globArr.index);

  } else {
    var sym = genType(types.ATOM, globArr.select());
    globArr.next();

    return sym;
  }
}

function arrMinimize(arr, loopNo, rulesDone) {
  var hier = arrToHier(arr);
  var hierSimplified = minimize(hier, loopNo, rulesDone);

  return toArray(hierSimplified);
}

var strEscapable = "λ+*()\\";

function strToArray(str) {
  var arr = [];
  var escaped = false;
  var chr;

  for (var i = 0; i < str.length; ++i) {
    if (escaped) {
      if (strEscapable.indexOf(str[i]) === -1) {
        throw new RegError("Unexpected string regex: illegal escape sequence \\" + str[i], i);
      }
      arr.push(str[i]);
      escaped = false;

    } else if (str[i] === '\\') {
      escaped = true;

    } else {
      chr = str[i];

      switch (chr) {
        case "λ": chr = specs.LAMBDA; break;
        case "+": chr = "+"; break;
        case "*": chr = "*"; break;
        case "(": chr = "("; break;
        case ")": chr = ")"; break;
      }
      arr.push(chr);
    }
  }
  if (escaped) {
    throw new RegError("Unexpected string regex: unfinished escape sequence at end of string", str.length - 1);
  }

  return arr;
}

function strToHier(str) {
  var arr = strToArray(str);

  return arrToHier(arr);
}

function strMinimize(str, loopNo, rulesDone) {
  var hier = strToHier(str);
  var hierMinimized = minimize(hier, loopNo, rulesDone);

  return toString(hierMinimized);
}
