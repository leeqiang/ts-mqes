ts-mqes
=======

受 https://github.com/lusionx/mqes 启发, 原先项目是 coffeescript 版本的，现在使用 ts 重写，顺便学习一下 typescript

写的不好的地方，还希望多多包涵，提提 PR.

### Install
```
npm i ts-mqes
```

### How to Use
```
import { convert, ESQuery } from 'ts-mqes'

const query: ESQuery = convert({
  a: 'mongodb',
  b: { $in: ['es'] },
  c: { $ne: 'c' },
  d: { $gt: 1, $lt: 4 },
  e: { $nin: ['elastic'] },
  f: { $regex: '*f*' },
  g: { $text: 'g' },
  h: { $not: { $gt: 5 } },
  j: { $size: 2 }
})
// query
{
  bool: {
    must: [{
      term: { a: 'mongodb' }
    }, {
      terms: { b: ['es' ] }
    }, {
      range: { d: { gt: 1, lt: 4 } }
    }, {
      wildcard: { f: '*f*' }
    }, {
      wildcard: { g: '*g*' }
    }, {
      script: {
        script: "doc['j'].length === 2"
      }
    }],
    must_not: [{
      term: { c: 'c' }
    }, {
      terms: { e: [ 'elastic' ] }
    }, {
      range: { h: { gt: 5 } }
    }]
  }
}
```

### Test
```
npm test
```