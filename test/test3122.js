if (typeof exports === 'object') {
	var assert = require('assert');
	var alasql = require('..');
}

let testId = '3122';

describe(`Test ${testId} - SELECT * includes the columns of an APPLY source`, function () {
	before(function () {
		alasql('create database test' + testId);
		alasql('use test' + testId);
		alasql('create table t0 (k int, x int)');
		alasql('create table t1 (k int, v int)');
		alasql('insert into t0 values (1,5),(2,6)');
		alasql('insert into t1 values (1,9)');
	});

	after(function () {
		alasql('drop database test' + testId);
	});

	it('A) CROSS APPLY', function () {
		const res = alasql('SELECT * FROM t0 CROSS APPLY (SELECT v FROM t1 WHERE t1.k = t0.k) z');
		assert.deepStrictEqual(res, [{k: 1, x: 5, v: 9}]);
	});

	it('B) OUTER APPLY', function () {
		const res = alasql('SELECT * FROM t0 OUTER APPLY (SELECT v FROM t1 WHERE t1.k = t0.k) z');
		assert.deepStrictEqual(res, [
			{k: 1, x: 5, v: 9},
			{k: 2, x: 6, v: undefined},
		]);
	});
});
