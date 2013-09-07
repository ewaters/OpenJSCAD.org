function common() {
	var parts = {};
	parts.bottom = cube({ size: [12,1.5,3.5], center: true })
		.setColor(0.8,0.5,0.5,0.5);
	parts.top = parts.bottom
		.rotateZ(90)
		.translate([0,0,3.5/2])
		.setColor(0.5,0.8,0.5,0.5);
	return new PartGroup(parts);
}

function goal() {
	var parts = common();
	var top = parts.mutableNamedPart('top');
	top.mesh = top.mesh.subtract(parts.named('bottom'));
	/*
	parts.mutateNamedPart('top', function (part) {
		return part.subtract(parts.named('bottom'));
	});
	*/
	return parts;
}

function implementation() {
	var parts = common();
	parts.named('bottom').setPriority(1);
	parts.prioritizedSubtraction();
	return parts;
}

function main() {
	var items = [],
		partsGoal = goal(),
		partsImpl = implementation();

	partsImpl.translate([0,20,0]);

	[ partsGoal, partsImpl ].forEach(function (parts) {
		items.push(parts.named('bottom'));
		items.push(parts.named('top').translate([0,0,5]));
	});
	return items;
}
