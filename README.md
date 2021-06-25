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

const query: ESQuery = convert({ foo: 'mongodb', bar: 'es' })
// query
{
  bool: {
    must: [{
      term: { foo: 'mongodb' }
    }, {
      term: { bar: 'es' }
    }]
  }
}
```

### Test
```
npm test
```