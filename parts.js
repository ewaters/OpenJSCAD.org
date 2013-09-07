var PartGroup = function (parts) {
	var self   = this;
	this.idx   = 0;
	this.parts = [];
	this.names = {};
	this.namesByIdx = [];
	if (_.isObject(parts)) {
		_.forEach(parts, function (part, name) {
			self.addNamedPart(name, part);
		});
	}
	else if (_.isArray(parts)) {
		_.forEach(parts, function (part) {
			self.addPart(part);
		});
	}
};

PartGroup.prototype.addNamedPart = function (name, part) {
	var id = this.idx++;
	this.parts[id] = part;
	this.names[name] = id;
	this.namesByIdx[id] = name;
};

PartGroup.prototype.addPart = function (part) {
	var id = this.idx++;
	this.parts[id] = part;
};

PartGroup.prototype.getNamedPart = function (name) {
	var id = this.names[name];
	if (id === undefined) {
		console.error("No such part named '" + name + "'");
		return;
	}
	return this.parts[id];
};

PartGroup.prototype.mutateAll = function (mutation) {
	this.parts = _.map(this.parts, mutation);
};

PartGroup.prototype.prioritizedSubtraction = function () {
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
};

PartGroup.prototype.asArray = function () {
	return this.parts;
};

PartGroup.prototype.asObject = function () {
	var self = this,
		obj  = {};
	_.forEach(this.parts, function (part, id) {
		var name = self.namesByIdx[id];
		if (name === undefined) return;
		obj[name] = part;
	});
	return obj;
};

PartGroup.prototype.updateableParts = function () {
	var self = this;
	return _.map(this.parts, function (part, idx) {
		return new PartGroup.UpdateablePart(self, idx);
	});
};

PartGroup.UpdateablePart = function (group, idx) {
	this.group = group;
	this.idx   = idx;
};

PartGroup.UpdateablePart.prototype.get = function () {
	return this.group.parts[ this.idx ];
};

PartGroup.UpdateablePart.prototype.set = function (part) {
	this.group.parts[ this.idx ] = part;
	return part;
};
