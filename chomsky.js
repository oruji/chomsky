var types = {
  ADD : 'add',
  MUL : 'mul',
  STAR : 'star',
  ATOM : 'atom',
  LAM : 'lam'
};

var specs = {
  LAMBDA : '\u03BB'
};

// convert String to Hierarchical Structure
function toHier(str) {
  // convert string to array
  var arr = [];
  for ( var i = 0; i < str.length; i++) {
    arr.push(str[i]);
  }

  // generate hierarchical structure
  if (arr.length === 0) {
    return genMul([]);
  }

  var globArr = makeInputSeq(arr);
  var hier = firstComp(globArr);

  return hier;
}

function select() {
  return this.arr[this.index];
}
function next() {
  ++this.index;
}
function makeInputSeq(arr) {
  return {
    arr : arr,
    index : 0,
    select : select,
    next : next
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

    return genLam();

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
    type : types.ADD,
    items : sels
  };
}

function genMul(els) {
  return {
    type : types.MUL,
    items : els
  };
}

function genStar(expr) {
  return {
    type : types.STAR,
    item : expr
  };
}

function genAtom(atom) {
  return {
    type : types.ATOM,
    item : atom
  };
}

function genLam() {
  return {
    type : types.LAM
  };
}

function RegexError(message, position) {
  this.name = "RegexError";
  this.message = message;
  this.position = position;
}

RegexError.prototype = new Error();