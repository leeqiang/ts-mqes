_   = require 'lodash'

kv = (o) ->
  ks = _.keys o
  throw new Error ks.length + ' keys: ' + keys.join ' ' if ks.length is not 1
  key: ks[0], value: o[ks[0]]

_q_term = (f, v) ->
  o =
    term: {}
  o.term[f] = v
  o

_q_terms = (f, v) ->
  o =
    terms: {}
  o.terms[f] = v
  o

_q_range = (f, v, p) ->
  o =
    range: {}
  o.range[f] = {}
  o.range[f][p] = v
  o

# {field: {$xx:.. $yy}} -> {must:[], must_not: []}
_query = (q) ->
  must = []
  must_not = []
  sp = kv q
  f = sp.key
  val = sp.value
  if _.isString(val) or _.isNumber(val)
    val =
      $eq: val

  for $$, vv of val
    switch $$
      when '$eq'
        must.push _q_term f, vv
      when '$ne'
        must_not.push _q_term f, vv
      when '$gt'
        must.push _q_range f, vv, $$.slice 1
      when '$gte'
        must.push _q_range f, vv, $$.slice 1
      when '$lt'
        must.push _q_range f, vv, $$.slice 1
      when '$lte'
        must.push _q_range f, vv, $$.slice 1
      when '$in'
        must.push _q_terms f, vv
      when '$nin'
        must_not.push _q_terms f, vv
      when '$exists'
        o = {}
        if vv
          o.exists = field: f
        else
          o.missing = field: f
        must.push o
      when '$regex'
        o =
          regexp: {}
        o.regexp[f] = vv.toString()
        must.push o
      when '$size'
        o =
          script:
            script: "doc[#{f}].length == param1"
            params:
              param1: +vv or 0
        must.push o
      when '$text'
        o = fquery:
          _cache: yes
          query:
            query_string:
              fields: [f]
              query: vv
         must.push o
      when '$not'
        o = {}
        o[f] = vv
        for x in mst = _query(o).must
          must_not = must_not.concat x
      else
        throw new Error 'not suport ' + $$
  {must, must_not}

convQuery = (q) ->
  sp = kv q
  if sp.key is '$and'
    throw new Error 'require {$and: []}' if not _.isArray sp.value
    mst = []
    _.each sp.value, (qq) ->
      mst = mst.concat _.map qq, (v, k) ->
        o  = {}
        o[k] = v
        _query o

  else # { f1: {$xx:, $yy: }, f2: {$xx:, $yy: }}
    mst = _.map q, (v, k) ->
      o  = {}
      o[k] = v
      _query o
  must = []
  must_not = []
  _.each mst, (e) ->
    must = must.concat e.must
    must_not = must_not.concat e.must_not
  mst = {}
  mst.must = must if must.length
  mst.must_not = must_not if must_not.length
  query: filtered: filter: bool: mst

module.exports = {convQuery}
