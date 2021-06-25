/* global describe, it */
import _ from 'lodash'
import { expect } from 'chai'
import { convert, ESQuery } from '../lib'

describe('mqes', function () {
  it('convert', function (done) {
    const query: ESQuery = convert({ _id: '123' })
    expect(_.get(query, 'bool.must.0.term._id')).to.eql('123')
    done()
  })

  it('convert#$or, $lte', function (done) {
    const query: ESQuery = convert({ _id: '123', $or: [ { date: { $lte: 1 } }] })
    expect(_.get(query, 'bool.must.0.term._id')).to.eql('123')
    expect(_.get(query, 'bool.should.0.range.date.lte')).to.eql(1)
    done()
  })

  it('convert#$or, $gte', function (done) {
    const query: ESQuery = convert({ _id: '123', $or: [ { date: { $gte: 1 } }] })
    expect(_.get(query, 'bool.must.0.term._id')).to.eql('123')
    expect(_.get(query, 'bool.should.0.range.date.gte')).to.eql(1)
    done()
  })

  it('convert#$or', function (done) {
    const query: ESQuery = convert({
      _id: '123',
      $or: [ { date: { $gte: 1, $lte: 10 } }, { date2: { $gte: 1, $lte: 2}}],
      c: 4,
      d: { $gte: 1, $lte: 4 },
      e: { $in: [1, 2, 3] },
      f: { $ne: 4 }
    })
    expect(_.get(query, 'bool.must.0.term._id')).to.eql('123')
    expect(_.get(query, 'bool.should.0.range.date.gte')).to.eql(1)
    expect(_.get(query, 'bool.should.0.range.date.lte')).to.eql(10)
    expect(_.get(query, 'bool.should.1.range.date2.gte')).to.eql(1)
    expect(_.get(query, 'bool.should.1.range.date2.lte')).to.eql(2)
    expect(_.get(query, 'bool.must_not.0.term.f')).to.eql(4)
    done()
  })
})
