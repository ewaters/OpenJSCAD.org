function common() {
	var parts = new PartGroup(
		cube([3,10,2]),
		cube([2,11,4]).translate([5,0,0]),
		cube([2,5,10]).translate([8,0,0]),
		cube([1,1,8]).union(
			// Rotations of objects are dropped when they're combined
			// with another object, such that only the parent object
			// has a rotation memory.
			cube([8,1,1]).translate([-4,0,0]).rotateX(23)
		).translate([0,-2,0])
	);
	parts.colorize();
	return parts;
}

function rotated() {
	var parts = common();
	parts.mutateAll(function (part) {
		_.forEach(['X', 'Y', 'Z'], function (axis) {
			var method = 'rotate' + axis,
				degrees = Math.random() * 360;
			part = part[method](degrees);
		});
		return part;
	});
	return parts;
}

function before() {
	return rotated();
}

function implementation() {
	var parts = rotated();
	parts.mutateAll(function (part) {
		return part.unrotate();
	});
	return parts;
}

function main() {
	return _.flatten([
		common().asArray(),
		rotated().translate([20,15,20]).asArray(),
		implementation().translate([30,0,0]).asArray()
	]);
}

