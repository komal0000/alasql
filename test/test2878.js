if (typeof exports === 'object') {
	var assert = require('assert');
	var alasql = require('..');
}

let testId = '2878'; // A HAVING alias does not replace a source column of the same name

describe(`Test ${testId} - A HAVING alias does not replace a source column of the same name`, function () {
	var data = [
		{a: 1, cnt: 0},
		{a: 1, cnt: 0},
		{a: 2, cnt: 5},
	];

	before(function () {
		alasql('create database test' + testId);
		alasql('use test' + testId);
		alasql('CREATE TABLE t (a INT, b INT)');
		alasql('INSERT INTO t VALUES (1, 1), (1, 2), (2, 3)');
		alasql('CREATE TABLE u');
		alasql('INSERT INTO u SELECT * FROM ?', [data]);
	});

	after(function () {
		alasql('drop database test' + testId);
	});

	it('A) A column of a subquery', function () {
		assert.deepStrictEqual(
			alasql('SELECT a, COUNT(*) AS cnt FROM (SELECT a, cnt FROM ?) s GROUP BY a HAVING cnt > 1', [
				data,
			]),
			[{a: 2, cnt: 1}]
		);
	});

	it('B) A column of FROM ?', function () {
		assert.deepStrictEqual(
			alasql('SELECT a, COUNT(*) AS cnt FROM ? GROUP BY a HAVING cnt > 1', [data]),
			[{a: 2, cnt: 1}]
		);
	});

	it('C) A column of a table without column definitions', function () {
		assert.deepStrictEqual(alasql('SELECT a, COUNT(*) AS cnt FROM u GROUP BY a HAVING cnt > 1'), [
			{a: 2, cnt: 1},
		]);
	});

	it('D) The alias is used when no source has that column', function () {
		assert.deepStrictEqual(alasql('SELECT a, COUNT(*) AS cnt FROM t GROUP BY a HAVING cnt > 1'), [
			{a: 1, cnt: 2},
		]);
		assert.deepStrictEqual(
			alasql('SELECT a, COUNT(*) AS n FROM (SELECT a, cnt FROM ?) s GROUP BY a HAVING n > 1', [
				data,
			]),
			[{a: 1, n: 2}]
		);
		assert.deepStrictEqual(
			alasql('SELECT a, COUNT(*) AS n FROM ? GROUP BY a HAVING n > 1', [data]),
			[{a: 1, n: 2}]
		);
	});
});
