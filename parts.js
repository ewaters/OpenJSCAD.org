var PartGroup = function (parts) {
	var self   = this;
	this.idx   = 0;
	this.parts = [];
	this.names = {};
	this.namesByIdx = [];

	// Initialization is optional.
	if (parts === undefined) return;

	// The caller may provide a list of CSG meshes.
	if (parts instanceof CSG) {
		for (var i = 0; i < arguments.length; i++) {
			self.addPart(arguments[i]);
		}
		return;
	}

	// Or a named list of meshes.
	if (_.isObject(parts)) {
		_.forEach(parts, function (part, name) {
			self.addNamedPart(name, part);
		});
	}
	// Or an array of meshes.
	else if (_.isArray(parts)) {
		_.forEach(parts, function (part) {
			self.addPart(part);
		});
	}
};

PartGroup.prototype = {
	addNamedPart: function (name, part) {
		var id = this.idx++;
		this.parts[id] = part;
		this.names[name] = id;
		this.namesByIdx[id] = name;
	},

	addPart: function (part) {
		var id = this.idx++;
		this.parts[id] = part;
	},

	idxFromName: function (name) {
		var id = this.names[name];
		if (id === undefined) {
			console.error("No such part named '" + name + "'");
			return;
		}
		return id;
	},

	named: function (name) {
		var idx = this.idxFromName(name);
		if (idx === undefined) return;
		return this.parts[idx];
	},

	mutableNamedPart: function (name) {
		var idx = this.idxFromName(name);
		if (idx === undefined) return;
		return new PartGroup.UpdateablePart(this, idx);
	},

	mutateNamedPart: function (name, mutation) {
		var idx = this.idxFromName(name);
		if (idx === undefined) return;
		this.parts[idx] = mutation(this.parts[idx]);
		return this;
	},

	mutateAll: function (mutation) {
		this.parts = _.map(this.parts, mutation);
		return this;
	},

	translate: function (value) {
		this.mutateAll(function (item) {
			return item.translate(value);
		});
		return this;
	},

	prioritizedSubtraction: function () {
		var partsByPriority = {};

		this.updateableParts().forEach(function (part) {
			var prio = part.get().priority();
			if (partsByPriority[prio] === undefined)
				partsByPriority[prio] = [];
			partsByPriority[prio].push(part);
		});

		// Start will parts that have lower priority.  For each, subtract all the
		// parts that have a higher priority.
		_.keys(partsByPriority).sort().forEach(function (prio) {
			partsByPriority[prio].forEach(function (part) {
				var item = part.get(),
					mutated = false;
				_.forEach(partsByPriority, function (group, testPrio) {
					if (testPrio <= prio) return;
					mutated = true;
					group.forEach(function (higherPart) {
						item = item.subtract(higherPart.get());
					});
				});
				if (! mutated) return;
				part.set(item);
			});
		});
	},

	colorize: function () {
		this.mutateAll(function (part, idx) {
			return part.setColor([
				Math.random(), Math.random(), Math.random()
			]);
		});
	},

	// Each part will be rotated such that it's longest dimension,
	// in decreasing order, falls along the given axes.  So,
	// if this is ['y', 'x', 'z'], then the longest dimension will
	// be oriented along the y axis, then x, then z.
	orientAll: function (orientation) {
		this.mutateAll(function (part) {
			var bounds, dim, longest, axis, nextLongest, rotateAxis, rotateMethod;
			// Rotate up to two times, 90 degrees along different axes depending
			// on which is the next longest dimension of the bounding box.
			for (var i = 0; i < 2; i++) {
				bounds  = part.getBounds();
				dim     = bounds[1].minus(bounds[0]);
				longest = _.sortBy(['x', 'y', 'z'], function (axis) {
					return -dim[axis];
				});

				axis        = orientation[i];
				nextLongest = longest[i];
				if (nextLongest === axis) continue;

				switch (axis) {
					case 'x':
						rotateAxis = nextLongest === 'y' ? 'z' : 'y';
						break;
					case 'y':
						rotateAxis = nextLongest === 'z' ? 'x' : 'z';
						break;
					case 'z':
						rotateAxis = nextLongest === 'x' ? 'y' : 'x';
						break;
				}
				rotateMethod = 'rotate' + rotateAxis.toUpperCase();
				part = part[rotateMethod](90);
				//console.info(rotateMethod + " to orient along " + axis);
			}
			return part;
		});
	},

	asArray: function () {
		return this.parts;
	},

	asObject: function () {
		var self = this,
			obj  = {};
		_.forEach(this.parts, function (part, id) {
			var name = self.namesByIdx[id];
			if (name === undefined) return;
			obj[name] = part;
		});
		return obj;
	},

	updateableParts: function () {
		var self = this;
		return _.map(this.parts, function (part, idx) {
			return new PartGroup.UpdateablePart(self, idx);
		});
	}
};

PartGroup.UpdateablePart = function (group, idx) {
	this.group = group;
	this.idx   = idx;
};

PartGroup.UpdateablePart.prototype = {

	get: function () {
		return this.group.parts[ this.idx ];
	},

	set: function (part) {
		this.group.parts[ this.idx ] = part;
		return part;
	},

	get mesh() {
		return this.get();
	},

	set mesh(v) {
		return this.set(v);
	}
};
