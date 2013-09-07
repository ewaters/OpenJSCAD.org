function common() {
	var parts = {};
	parts.bottom = cube({ size: [12,1.5,3.5], center: true })
		.setColor(0.8,0.5,0.5,0.5);
	parts.top = parts.bottom
		.rotateZ(90)
		.translate([0,0,3.5/2])
		.setColor(0.5,0.8,0.5,0.5);
	return parts;
}

function goal() {
	var parts = common();
	parts.top = parts.top.subtract(parts.bottom);
	return parts;
}

function implementation() {
	var parts = common();
	parts.bottom.setPriority(1);
	return parts;
}

function main() {
	var items = [],
		partsGoal = goal(),
		partsImpl = implementation();
	_.forEach(partsImpl, function (item, key) {
		partsImpl[key] = item.translate([0,20,0]);
	});
	[ partsGoal, partsImpl ].forEach(function (parts) {
		items.push(parts.bottom);
		items.push(parts.top.translate([0,0,5]));
	});
	return items;
}

function prioritizedSubtraction() {
	var result = [], itemsByPriority = {};

	for (var i = 0; i < arguments.length; i++) {
		var item = arguments[i],
			prio = item.priority();
		if (itemsByPriority[prio] === undefined)
			itemsByPriority[prio] = [];
		itemsByPriority[prio].push(item);
		result.push(item);
	}

	return result;
}
