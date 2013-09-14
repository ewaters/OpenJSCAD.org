function common() {
	var parts = new PartGroup(
		cube([3,10,2]),
		cube([2,11,4]).translate([5,0,0]),
		cube([2,5,10]).translate([8,0,0]).rotateY(-10),
		cube([4,2,8]).translate([12,1,2]).rotateX(13),
		cube([10,4,4]).translate([21,5,0]).rotateZ(9),
		cube([10,1,2]).translate([22,-9,0]),
		cylinder({ r: 4 }).translate([0,-10,4]).rotateX(-90),
		sphere({ r: 2, center: false }).translate([10,-9,2])
	);
	parts.colorize();
	return parts;
}

function before() {
	return common();
}

function implementation() {
	var parts = common();
	parts.arrangeBySize();
	return parts;
}

function main() {
	return _.flatten([
		before().asArray(),
		implementation().translate([0,-25,0]).asArray()
	]);
}

