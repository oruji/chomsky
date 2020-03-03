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