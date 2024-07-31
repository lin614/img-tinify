var xhr = require('xhr');
var pick = require('lodash/pick');
var gifInfo = require('../');

var gifFiles = [
	{
		name: 'uneven-delay.gif',
		info: {
			valid: true,
			animated: true,
			loopCount: 0,
			width: 500,
			height: 377,
			duration: 2780
		}
	},
	{
		name: 'box.gif',
		info: {
			valid: true,
			animated: true,
			loopCount: 0,
			width: 250,
			height: 180,
			duration: 2800
		}
	},
	{
		name: 'size-1.gif',
		info: {
			valid: true,
			animated: true,
			loopCount: 0,
			width: 555,
			height: 325,
			duration: 2160
		}
	},
	{
		name: 'size-2.gif',
		info: {
			valid: true,
			animated: true,
			loopCount: 97,
			width: 320,
			height: 180,
			duration: 5040
		}
	}
];

gifFiles.forEach(function(testFile) {
	QUnit.test(testFile.name, function(assert) {
		var done = assert.async();

		var options = {
			url: 'gif/' + testFile.name,
			method: 'GET',
			responseType: 'arraybuffer'
		};

		xhr(options, function(err, response, buffer) {
			var info = new gifInfo(buffer);

			assert.deepEqual(pick(info, Object.keys(testFile.info)), testFile.info);

			done();
		});
	});
});