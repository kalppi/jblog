const clone = require('clone');

module.exports = (lublu) => {
	lublu = lublu || {};
	
	lublu.DataObject = lublu.DataObject || class DataObject {
		constructor(data) {
			this.data = data;
			this.originalData = clone(data);
		}

		set(a, b, c) {
			if(b !== undefined) {
				this.data[a] = b;

				if(c) this.originalData[a] = b;
			} else {
				for(let k in a) {
					this.data[k] = a[k];
					if(b) this.originalData[k] = a[k];
				}
			}
		}

		get(field, original) {
			let data = this.data;
			if(original) data = this.originalData;

			if(data[field] !== undefined) {
				return data[field];
			} else {
				return null;
			}
		}

		append(field, data) {
			if(Array.isArray(this.data[field])) {
				if(Array.isArray(data)) {
					for(let v of data) {
						this.data[field].push(v);	
					}
				} else {
					this.data[field].push(data);
				}
			}
		}

		remove(field, value) {
			if(Array.isArray(this.data[field])) {
				if(Array.isArray(value)) {
					this.data[field] = this.data[field].filter(e => { return value.indexOf(e) === -1 });
				} else {
					this.data[field] = this.data[field].filter(e => { return e !== value });
				}
			}
		}

		static factory(type, data) {
			return new lublu[type](data);
		}
	}
}