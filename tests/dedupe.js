function common() {
	var parts = new PartGroup();
	for (var i = 0; i <= 360; i += 10) {
		var size = i % 30 == 0 ? 0.6 : 0.3,
			length = i % 90 == 0 ? 12 : i % 30 == 0 ? 10 : 8;
		var part = cube([size,size,length]).translate([-size/2,-size/2,2]);
		if (i % 90 == 0) {
			part = part.union(
				cube([4,size,size]).translate([-2,-size/2,length])
			);
		}
		parts.addPart(part.rotateZ(i).rotateX(i));
	}
	parts.addPart(sphere({ r: 2 }));
	parts.colorize();
	return parts;
}

function before() {
	var parts = common();
	parts.arrangeBySize();
	return parts;
}

function implementation() {
	var parts = common();
	parts.arrangeBySize({
		dedupe: true,
	});
	return parts;
}

function main() {
	return _.flatten([
		//common().asArray(),
		before().translate([0,-20,0]).asArray(),
		implementation().translate([0,0,0]).asArray()
	]);
}

