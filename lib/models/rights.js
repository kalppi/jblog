'use strict';

module.exports = (lublu) => {
	const DataObject = require('../dataobject.js')(lublu);
	
	return class Rights extends DataObject {
		constructor(data) {
			super(data);
		}

		isOwner() {
			return this.data.rights == 'owner';
		}

		canWrite() {
			switch(this.data.rights) {
				case 'owner':
				case 'write':
					return true;
				default:
					return false;
			}
		}

		greaterOrEqual(rights) {
			const order = ['none', 'write', 'owner'];

			const a = order.indexOf(this.data.rights);
			const b = order.indexOf(rights.data.rights);

			return a >= b;
		}

		canGrant(rights) {
			if(this.data.rights == 'owner') return true;
			else return false;
		}
	}
}