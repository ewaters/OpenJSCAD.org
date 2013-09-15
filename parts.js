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
		this.parts = _.filter(
			_.map(this.parts, mutation),
			function (item) { return item !== undefined; }
		);
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
				Math.abs(Math.sin(idx + 1)) % 1,
				Math.abs(Math.cos(idx + 1)) % 1,
				Math.abs(Math.tan(idx + 1)) % 1
			]);
		});
	},

	arrangeBySize: function (specs) {
		if (specs === undefined) specs = {};
		_.defaults(specs, {
			dedupe: false,
			padding: 2,
			orientation: ['y', 'x', 'z']
		});

		// Orient and unrotate all of the parts.
		this.mutateAll(function (part) {
			return part.unrotate().orientByAxisBoundingBox(specs.orientation);
		});

		if (specs.dedupe) {
			var hashes = {};
			this.mutateAll(function (part) {
				var hash = part.signature();
				if (hashes[hash] !== undefined) return;
				hashes[hash] = 1;
				return part;
			});
		}

		// Sort the parts by volume, greatest to least.
		var volumeByIdx = {};
		_.forEach(this.parts, function (part, idx) {
			var bounds = part.getBounds(),
				dim    = bounds[1].minus(bounds[0]);
			volumeByIdx[idx] = dim.x * dim.y * dim.z;
		});
		var byVolume = _.sortBy(this.updateableParts(), function (part, idx) {
			return -volumeByIdx[idx];
		});

		// Place each part in descending size along the x axis.
		var currentLocation = new CSG.Vector3D([0,0,0]);

		_.forEach(byVolume, function (upart) {
			var part   = upart.mesh,
				bounds = part.getBounds(),
				dim    = bounds[1].minus(bounds[0]),
				xform  = bounds[0].negated().plus(currentLocation);

			upart.mesh = part.translate(xform);

			currentLocation = currentLocation.plus(
				new CSG.Vector3D([ dim.x + specs.padding, 0, 0 ])
			);
		});

		return this;
	},

	combine: function () {
		var result = new PartGroup();
		_.forEach(this.parts, function (part) {
			result.addPart(part);
		});
		for (var i = 0; i < arguments.length; i++) {
			_.forEach(arguments[i], function (part) {
				result.addPart(part);
			});
		}
		return result;
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
