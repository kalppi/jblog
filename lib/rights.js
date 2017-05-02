const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};

	require('./dataobject.js')(lublu);
	
	lublu.Rights = lublu.Rights || class Rights extends lublu.DataObject {
		constructor(data) {
			super(data);
		}

		canWrite() {
			switch(this.data.rights) {
				case 'admin':
				case 'write':
					return true;
				default:
					return false;
			}
		}

		greaterOrEqual(rights) {
			const order = ['none', 'write', 'admin'];

			const a = order.indexOf(this.data.rights);
			const b = order.indexOf(rights.data.rights);

			return a >= b;
		}

		canGrant(rights) {
			if(this.data.rights == 'admin') return true;
			else return false;
		}
	}
}