import {
  Functor,
  Apply,
  Applicative,
  Chain
} from 'fantasy-laws';

import {
  letrec,
  oneof,
  number,
  string,
  bool,
  falsy,
  constant as _k
} from 'jsverify';

import Z from 'sanctuary-type-classes';

import {State, StateT, evalState} from '..';

function StateArb(varb) {
  var getValue = evalState ();
  function toStr(m) { return JSON.stringify (getValue (m)); }

  return varb.smap (_of, getValue, toStr);
}

function StateTArb(varb) {
  var getValue = StateT (State).evalState ();
  function toStr(m) { return JSON.stringify (getValue (m)); }

  return varb.smap (__of, getValue, toStr);
}

function B(f) {
  return function(g) {
    return function(x) {
      return f (g (x));
    };
  };
}

var {anyState} = letrec (function(tie) {
  return {
    anyState: StateArb (tie ('any')),
    any: oneof (
      number,
      string,
      bool,
      falsy,
      tie ('anyState')
    )
  };
});

var {anyStateT} = letrec (function(tie) {
  return {
    anyStateT: StateTArb (tie ('any')),
    any: oneof (
      number,
      string,
      bool,
      falsy,
      tie ('anyStateT')
    )
  };
});

function eq(actual, expected) {
  var state = Math.random ();
  return Z.equals (actual.run (state), expected.run (state));
}

function _eq(actual, expected) {
  var state = Math.random ();
  return eq (actual.run (state), expected.run (state));
}

function _of(x) {
  return Z.of (State, x);
}

function __of(x) {
  return Z.of (StateT (State), x);
}

function sub3(x) { return x - 3; }
function mul3(x) { return x * 3; }

suite ('Compliance to Fantasy Land', function() {
  suite ('State', function() {
    suite ('Functor', function() {
      test ('identity', Functor (eq).identity (anyState));
      test ('composition', Functor (eq).composition (
        StateArb (number),
        _k (sub3),
        _k (mul3)
      ));
    });

    suite ('Apply', function() {
      test ('composition', Apply (eq).composition (
        StateArb (_k (sub3)),
        StateArb (_k (mul3)),
        StateArb (number)
      ));
    });

    suite ('Applicative', function() {
      test ('identity', Applicative (eq, State).identity (StateArb (number)));
      test ('homomorphism', Applicative (eq, State).homomorphism (
        _k (sub3),
        number
      ));
      test ('interchange', Applicative (eq, State).interchange (
        StateArb (_k (sub3)),
        number
      ));
    });

    suite ('Chain', function() {
      test ('associativity', Chain (eq).associativity (
        StateArb (number),
        _k (B (_of) (sub3)),
        _k (B (_of) (mul3))
      ));
    });
  });

  suite ('StateT', function() {
    suite ('Functor', function() {
      test ('identity', Functor (_eq).identity (anyStateT));
      test ('composition', Functor (_eq).composition (
        StateTArb (number),
        _k (sub3),
        _k (mul3)
      ));
    });

    suite ('Apply', function() {
      test ('composition', Apply (_eq).composition (
        StateTArb (_k (sub3)),
        StateTArb (_k (mul3)),
        StateTArb (number)
      ));
    });

    suite ('Applicative', function() {
      test ('identity', Applicative (_eq, StateT (State)).identity (StateTArb (number)));
      test ('homomorphism', Applicative (_eq, StateT (State)).homomorphism (
        _k (sub3),
        number
      ));
      test ('interchange', Applicative (_eq, StateT (State)).interchange (
        StateTArb (_k (sub3)),
        number
      ));
    });

    suite ('Chain', function() {
      test ('associativity', Chain (_eq).associativity (
        StateTArb (number),
        _k (B (__of) (sub3)),
        _k (B (__of) (mul3))
      ));
    });
  });
});
