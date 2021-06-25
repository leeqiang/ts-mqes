import _ from 'lodash'

export declare interface ESValue {
  key: string
  value: string | number | VScript | any
}

export declare interface ESQueryBool {
  must?: any[]
  must_not?: any[]
  should?: any[]
}

export declare interface ESQuery {
  bool: ESQueryBool
}

export declare interface VScript {
  script: any
  params: any
}

export function kv (o: any): ESValue {
  const ks = _.keys(o)
  if (ks.length !== 1) {
    throw new Error(`${ks.length} keys: ${ks.join(' ')}`)
  }
  return { key: ks[0], value: o[ks[0]] }
}

export function toTerm (f: string, v: any): object {
  return { term: { [f]: v } }
}

export function toTerms (f: string, v: any): object {
  return { terms: { [f]: v } }
}

export function toRange (f: string, v: any, p: string): object {
  return { range: { [f]: { [p]: v } } }
}

export function _or (arr: any): ESQuery {
  if (!_.isArray(arr)) {
    throw new Error('$or: value must Array')
  }
  const mst: any = []
  _.each(arr, function (q) {
    return _.each(q, function (v, k) {
      if (k === '$and') {
        return mst.push({
          must: [_and(v)],
          must_not: []
        })
      } else if (k === '$or') {
        return mst.push({
          must: [_or(v)],
          must_not: []
        })
      } else {
        return mst.push(_query(_.pick(q, [k])))
      }
    })
  })
  const bool: ESQueryBool = {
    should: _.flatten(_.map(mst, function (e) {
      return e.must
    }))
  }
  const shouldNot = _.flatten(_.map(mst, function (e) {
    return e.must_not
  }))
  _.each(shouldNot, function (nt) {
    return bool.should?.push({
      bool: {
        must_not: [nt]
      }
    })
  })
  return { bool }
}

export function _and (arr: any): ESQuery {
  if (!_.isArray(arr)) {
    throw new Error('$and: value must Array')
  }
  const mst: any = []
  _.each(arr, function (q) {
    _.each(q, function (v, k) {
      if (k === '$and') {
        mst.push({
          must: _and(v).bool.must,
          must_not: []
        })
      } else if (k === '$or') {
        mst.push({
          must: _or(v).bool.must,
          must_not: []
        })
      } else {
        mst.push(_query(_.pick(q, [k])))
      }
    })
  })
  const bool: ESQueryBool = {
    must: _.flatten(_.map(mst, function (e) {
      return e.must
    })),
    must_not: _.flatten(_.map(mst, function (e) {
      return e.must_not
    })),
    should: []
  }
  if (bool.must?.length === 0) {
    delete bool.must
  }
  if (bool.must_not?.length === 0) {
    delete bool.must_not
  }
  if (bool.should?.length === 0) {
    delete bool.should
  }
  return { bool }
}

export function _query (q: object): object | any {
  const must: any = []
  let mustNot: any = []

  const sp: ESValue = kv(q)
  const f: string = sp.key
  let val = sp.value

  if (_.isString(val) || _.isNumber(val) || _.isBoolean(val)) {
    val = {
      $eq: val
    }
  }

  for (const $$ in val) {
    const vv: VScript | any | undefined = val[$$]
    switch ($$) {
      case '$eq':
        must.push(toTerm(f, vv))
        break
      case '$ne':
        mustNot.push(toTerm(f, vv))
        break
      case '$gt':
        must.push(toRange(f, vv, $$.slice(1)))
        break
      case '$gte':
        must.push(toRange(f, vv, $$.slice(1)))
        break
      case '$lt':
        must.push(toRange(f, vv, $$.slice(1)))
        break
      case '$lte':
        must.push(toRange(f, vv, $$.slice(1)))
        break
      case '$in':
        must.push(toTerms(f, vv))
        break
      case '$script':
        if (_.isString(vv)) {
          must.push({
            script: {
              script: vv
            }
          })
          // eslint-disable-next-line
        } else if (vv.script && vv.params) {
          must.push({
            script: {
              script: vv.script,
              params: vv.params,
              _cache: true
            }
          })
        } else {
          throw new Error(`cannot _query ${String(vv)}`)
        }
        break
      case '$nin':
        mustNot.push(toTerms(f, vv))
        break
      case '$exists':
        if (vv === true) {
          must.push({
            exists: {
              field: f
            }
          })
        } else {
          must.push({
            missing: {
              field: f
            }
          })
        }
        break
      case '$text':
        must.push({ wildcard: { [f]: `*${String(vv)}*` } })
        break
      case '$regex':
        must.push({ wildcard: { [f]: String(vv) } })
        break
      case '$size':
        must.push({
          script: {
            script: `doc['${f}'].length === ${_.isNumber(vv) ? vv * 1 : 0}`
          }
        })
        break
      case '$not':
        for (const x of _query({ [f]: vv }).must) {
          mustNot = mustNot.concat(x)
        }
        break
      default:
        throw new Error('not suport ' + $$ + ' ' + JSON.stringify(vv))
    }
  }

  let mustMerged = {}
  if (must.length > 0) {
    must.reduce((a: any, b: any) => {
      mustMerged = _.merge(mustMerged, a, b)
    })
  }
  return { must: _.isEmpty(mustMerged) ? must : mustMerged, must_not: mustNot }
}

export function convert (q: any): ESQuery {
  const query: ESQuery = { bool: { must: [], must_not: [], should: [] } }
  const mst: any = []
  _.each(q, function (v, k) {
    if (k === '$and') {
      query.bool.must = _and(v).bool.must
    } else if (k === '$or') {
      query.bool.should = _or(v).bool.should
    } else {
      mst.push(_query(_.pick(q, [k])))
    }
  })
  if (mst.length > 0) {
    query.bool.must = _.flatten(_.map(mst, function (e) {
      return e.must
    }))
    query.bool.must_not = _.flatten(_.map(mst, function (e) {
      return e.must_not
    }))
    if (query.bool.must?.length === 0) {
      delete query.bool.must
    }
    if (query.bool.must_not?.length === 0) {
      delete query.bool.must_not
    }
  }
  if (query.bool.must?.length === 0) {
    delete query.bool.must
  }
  if (query.bool.must_not?.length === 0) {
    delete query.bool.must_not
  }
  if (query.bool.should?.length === 0) {
    delete query.bool.should
  }
  return query
}
