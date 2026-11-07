if (typeof exports === 'object') {
	var assert = require('assert');
	var alasql = require('..');
}

let testId = '2875'; // Use the ID of the issue being fixed by this PR

describe(`Test ${testId} - A statement is reused after an error through a callback`, function () {
	var sql = 'SELECT BOOM2875(?) AS v FROM z';
	var parse = alasql.parse;
	var parsed;

	before(function () {
		alasql('CREATE DATABASE test' + testId + '; USE test' + testId);
		alasql.fn.BOOM2875 = function (x) {
			if (x === 99) throw new Error('boom');
			return x;
		};
		alasql('CREATE TABLE z (a INT); INSERT INTO z VALUES (1)');
		alasql.parse = function () {
			parsed++;
			return parse.apply(this, arguments);
		};
	});

	after(function () {
		alasql.parse = parse;
		delete alasql.fn.BOOM2875;
		alasql('USE alasql; DROP DATABASE test' + testId);
	});

	it('A compiled statement is reused after a rejected promise', async function () {
		var st = alasql.compile(sql);
		await assert.rejects(st.promise([99]), /boom/);
		parsed = 0;
		assert.deepEqual(st([1]), [{v: 1}]);
		assert.equal(parsed, 0);
	});

	it('A compiled statement is reused after an error through a callback', function () {
		var st = alasql.compile(sql);
		assert.throws(function () {
			st([99], function () {});
		}, /boom/);
		parsed = 0;
		assert.deepEqual(st([1]), [{v: 1}]);
		assert.equal(parsed, 0);
	});

	it('A cached statement is reused after an error through a callback', function () {
		assert.throws(function () {
			alasql(sql, [99], function () {});
		}, /boom/);
		parsed = 0;
		assert.deepEqual(alasql(sql, [1]), [{v: 1}]);
		assert.equal(parsed, 0);
	});
});
