var types = {
  ADD: 'add',
  MUL: 'mul',
  STAR: 'star',
  LIT: 'lit',
};

var specs = {
  LAMBDA: '\u03BB'
};

var minimize_list = [];

function minimize(tree, param) {
  var treeCopy = tree.clone();

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
    ruleDone = minimize_loop(treeCopy);

    if (ruleDone !== null && paramCopy.rulesDone !== null) {
      paramCopy.rulesDone.push(ruleDone);
    }

    counter += 1;
  }

  return treeCopy;
}

function minimize_loop(tree) {
  var pattern = null;
  var result = null;

  for (var i = 0; i < minimize_list.length; i++) {
    pattern = minimize_list[i];

    result = minimize_rec(tree, pattern['func']);

    if (result) {
      return pattern.rule;
    }
  }

  return null;
}

function minimize_rec(tree, ruleFunc) {
  var ruleDone = ruleFunc(tree);

  if (ruleDone) {
    return ruleDone;
  }

  var childArr = [];

  if (tree.isAdd() || tree.isMul() || tree.isStar()) {
    childArr = tree.val();
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

minimize_list.push({ 'func': minimize_01, 'rule': "(A) -> A", 'type': '' });
// minimize_list.push({ 'func': minimize_02, 'rule': "λA -> A", 'type': '' });
// minimize_list.push({ 'func': minimize_03, 'rule': "A(BC) -> ABC", 'type': '' });
// minimize_list.push({ 'func': minimize_04, 'rule': "λ+AA* => A*", 'type': '' });
// minimize_list.push({ 'func': minimize_05, 'rule': "obj1 + obj2 = obj2 IF obj ⊆ obj2", 'type': '' });
// minimize_list.push({ 'func': minimize_07, 'rule': "(ab+ac) -> a(b+c)", 'type': '' });

// (ab+ac) -> a(b+c)
function minimize_07(tree) {
  if (isAdd(tree) && tree.val.length >= 2) {
    var mulIdx = -1;
    var nMulIdx = -1;
    var bothMul = -1;

    for (var i = 0; i < tree.val.length; i++) {
      for (var j = i + 1; j < tree.val.length; j++) {

        // left is not mul and right is mul a+ab or a+ba
        if (!isMul(tree.val[i]) && isMul(tree.val[j])) {
          nMulIdx = i;
          mulIdx = j;
          break;

          // lift is mul and right is not mul ab+a or ba+a
        } else if (isMul(tree.val[i]) && !isMul(tree.val[j])) {
          mulIdx = i;
          nMulIdx = j;
          break;

          // both are mul ab+ac or ab+cb
        } else if (isMul(tree.val[i]) && tree.val[i].val.length >= 2
          && isMul(tree.val[j]) && tree.val[j].val.length >= 2) {
          bothMul = [i, j];
          break;
        }
      }

      // if one of them are not multiply
      if (mulIdx >= 0 && nMulIdx >= 0) {
        // if first is common a+ab or ab+a
        if (areEqual(tree.val[mulIdx].val[0], tree.val[nMulIdx])) {
          var common = tree.val[nMulIdx];
          var rest1 = genLam();
          var rest2 = genMul(tree.val[mulIdx].val.slice(1, tree.val[mulIdx].val.length));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([common, _alt]);

          tree.val[nMulIdx] = _seq;
          tree.val.splice(mulIdx, 1);

          return true;
          // if last is common a+ba or ba+a
        } else if (areEqual(getLast(tree.val[mulIdx].val), tree.val[nMulIdx])) {
          var common = tree.val[nMulIdx];
          var rest1 = genLam();
          var rest2 = genMul(tree.val[mulIdx].val.slice(0, tree.val[mulIdx].val.length - 1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([_alt, common]);

          tree.val[nMulIdx] = _seq;
          tree.val.splice(mulIdx, 1);

          return true;
        }

      } else if (bothMul != -1) {
        // if first is common ab+ac
        if (areEqual(tree.val[bothMul[1]].val[0], tree.val[bothMul[0]].val[0])) {
          var common = tree.val[bothMul[0]].val[0];
          var rest1 = genMul(tree.val[bothMul[0]].val.slice(1));
          var rest2 = genMul(tree.val[bothMul[1]].val.slice(1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([common, _alt]);

          tree.val[i] = _seq;
          tree.val.splice(bothMul[1], 1);

          return true;
          // if last is common ab+cb 
        } else if (areEqual(getLast(tree.val[bothMul[1]].val), getLast(tree.val[bothMul[0]].val))) {
          var common = getLast(tree.val[bothMul[0]].val);
          var rest1 = genMul(tree.val[bothMul[0]].val.slice(0, tree.val[bothMul[0]].val.length - 1));
          var rest2 = genMul(tree.val[bothMul[1]].val.slice(0, tree.val[bothMul[1]].val.length - 1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([_alt, common]);

          tree.val[i] = _seq;
          tree.val.splice(bothMul[1], 1);

          return true;
        }
      }
    }
  }

  return false;
}

// obj1 + obj2 = obj2 IF obj ⊆ obj2
function minimize_05(tree) {
  if (isAdd(tree) && tree.val.length >= 2) {
    var found = -1;

    for (var i = 0; i < tree.val.length; i++) {
      var cur = tree.val[i];

      for (var j = 0; j < tree.val.length; j++) {
        if (i == j) continue;
        var cur2 = tree.val[j];

        if (isSub(cur, cur2)) {
          tree.val.splice(i, 1);

          return true;
        }
      }
    }
  }
  return false;
}

// λ+AA* => A*
function minimize_04(tree) {
  if (isAdd(tree) && tree.val.length >= 2) {
    var lamIndex = -1;
    var starIndex = -1;
    var sameStar = -1;
    var elemIndex = -1;

    for (var i = 0; i < tree.val.length; i++) {
      var cur = tree.val[i];

      if (isLam(cur)) {
        lamIndex = i;

      } else if (isMul(cur) && cur.val.length === 2) {
        elemIndex = i;

        var starLit = null;
        var normLit = null;

        for (var j = 0; j < cur.val.length; j++) {
          if (isStar(cur.val[j])) {
            starIndex = j;
            starLit = cur.val[j].val.val;

          } else if (isLit(cur.val[j])) {
            sameStar = j;
            normLit = cur.val[j].val;
          }
        }
      }
      if (lamIndex >= 0 && starIndex >= 0 && sameStar >= 0 && elemIndex >= 0) {
        if (starLit === normLit) {
          tree.val[elemIndex].val.splice(sameStar, 1)
          tree.val.splice(lamIndex, 1);

          return true;
        }
      }
    }
  }

  return false;
}

// A+(B+C) -> A+B+C, A(BC) -> ABC, Associative property
function minimize_03(tree) {
  if ((isAdd(tree) || isMul(tree)) && tree.val.length >= 2) {
    var found = -1, i;

    for (i = 0; i < tree.val.length; i++) {
      if (tree.val[i].key === tree.key) {
        found = i;
      }
    }

    if (found >= 0) {
      var node = tree.val[found];
      tree.val.splice(found, 1);

      for (i = 0; i < node.val.length; i++) {
        tree.val.splice(found + i, 0, node.val[i]);
      }

      return true;
    }
  }

  return false;
}

// λA -> A
function minimize_02(tree) {
  if (isMul(tree) && tree.val.length >= 2) {
    var lamIndex = -1;

    for (var i = 0; i < tree.val.length; i++) {
      if (isLam(tree.val[i])) {
        lamIndex = i;
      }
    }

    if (lamIndex >= 0) {
      tree.val.splice(lamIndex, 1);
      return true;
    }
  }

  return false;
}

// (A) -> A
function minimize_01(tree) {
  if ((tree.isAdd() || tree.isMul()) && tree.val().length === 1) {
    tree.delOuter();

    return true;
  }

  return false;
}

function delObj(obj) {
  for (var o in obj) {
    if (obj.hasOwnProperty(o)) {
      delete obj[o];
    }
  }
}

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
  var tree = new Tree();
  tree[type] = item;
  return tree;
}

function genMul(item) {
  return genType(types.MUL, item);
}

function genAdd(item) {
  return genType(types.ADD, item);
}

function genLam() {
  return genType(types.LIT, specs.LAMBDA);
}

function genLit(item) {
  return genType(types.LIT, item);
}

function genStar(item) {
  return genType(types.STAR, item);
}

var _prec = {};
_prec[types.ADD] = 0;
_prec[types.MUL] = 1;
_prec[types.STAR] = 2;
_prec[types.LIT] = 3;

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
  _binOpToArray(regex, arr, regex.val(), "+");
}

function mulToArray(regex, arr) {
  _binOpToArray(regex, arr, regex.val());
}

function starToArray(regex, arr) {
  _optParenToArray(regex, regex.val(), arr);
  arr.push("*");
}

function litToArray(regex, arr) {
  arr.push(regex.val());
}

var _toArrayFuns = {};
_toArrayFuns[types.ADD] = addToArray;
_toArrayFuns[types.MUL] = mulToArray;
_toArrayFuns[types.STAR] = starToArray;
_toArrayFuns[types.LIT] = litToArray;

function _dispatchToArray(regex, arr) {
  return _toArrayFuns[regex.key()](regex, arr);
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

function arrToTree(arr) {
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
  var lit = forthComp(globArr);

  if (globArr.select() === "*") {
    globArr.next();
    lit = genType(types.STAR, lit);
  }

  return lit;
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
    return genType(types.LIT, specs.LAMBDA);

  } else if (globArr.select() === undefined || globArr.select() === "+" ||
    globArr.select() === ")") {
    return undefined;

  } else if (globArr.select() === "*") {
    throw new RegError("Unexpected regex array: empty subexpression before Kleene star at index " +
      globArr.index, globArr.index);

  } else {
    var sym = genType(types.LIT, globArr.select());
    globArr.next();

    return sym;
  }
}

function arrMinimize(arr, loopNo, rulesDone) {
  var tree = arrToTree(arr);
  var treeSimplified = minimize(tree, loopNo, rulesDone);

  return toArray(treeSimplified);
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

function strToTree(str) {
  var arr = strToArray(str);

  return arrToTree(arr);
}

function strMinimize(str, loopNo, rulesDone) {
  var tree = strToTree(str);
  var treeMinimized = minimize(tree, loopNo, rulesDone);

  return toString(treeMinimized);
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

function isSub(inVar, inVar2) {

  if (areEqual(inVar, inVar2)) {
    // obj = obj
    return true;
  }

  if (isStar(inVar2)) {
    if (isLam(inVar)) {
      // λ = obj*
      return true;

    } else if (areEqual(inVar, inVar2.val)) {
      // obj = obj*
      return true;

    } else if (isMul(inVar)) {
      if (inVar.val.every((val, i, arr) => areEqual(val, arr[0]))) {
        // objobjobj = obj*
        return true;
      }
    }
  }

  return false;
}

function getLast(arr, num) {
  if (num === undefined)
    num = 1;
  return arr[arr.length - num];
}
