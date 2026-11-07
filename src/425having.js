/* global yy */

// A name in HAVING that is not a column of a source reads the SELECT alias of that
// name, as in SQLite (#887). A source column of that name wins and is read from a row
// of the group; a source with unknown columns (FROM ?, a table without columns) decides
// per row (#2878). Aggregates and subqueries keep their own names.
function resolveHavingAliases(node, query) {
	if (!node || typeof node !== 'object') return;
	if (node instanceof yy.Select || node instanceof yy.AggrValue) return;
	if (node instanceof yy.Column) {
		var nick = query.groupColumns[node.columnid];
		if (node.tableid || nick === undefined || nick === node.columnid) return;
		var col = JSON.stringify(node.columnid);
		var value = `g[${JSON.stringify(nick)}]`;
		var tests = '';
		var found = false;
		for (var source of query.sources) {
			var row = `Object(s[${JSON.stringify(source.alias)}])`;
			if (!source.columns || !source.columns.length) {
				tests += `${col} in ${row} ? ${row}[${col}] : `;
			} else if (source.columns.some(c => c.columnid === node.columnid)) {
				value = `${row}[${col}]`;
				found = true;
				break;
			}
		}
		if (found || tests) {
			node.groupjs = `(s => ${tests}${value})(this.groupSources.get(g) || {})`;
		} else {
			node.nick = nick;
		}
		return;
	}
	for (var key in node) {
		resolveHavingAliases(node[key], query);
	}
}

yy.Select.prototype.compileHaving = function (query) {
	if (this.having) {
		resolveHavingAliases(this.having, query);
		var s = this.having.toJS('g', -1);
		query.havingfns = s;
		//		console.log(s);
		return new Function('g,params,alasql', 'var y;return ' + s);
	}

	return function () {
		return true;
	};
};
