function common() {
	var parts = new PartGroup(
		cube([4,10,2]),
		cube([2,10,4]).translate([0,10,0]),
		cube([2,4,10]).translate([0,20,0]),
		cube([4,2,10]).translate([0,30,0]),
		cube([10,2,4]).translate([0,40,0]),
		cube([10,4,2]).translate([0,50,0]),
		cylinder({ r: 4 }).translate([0,-10,4]),
		sphere({ r: 2, center: false }).translate([10,0,2])
	);
	parts.colorize();
	return parts;
}

function before() {
	return common();
}

function implementation() {
	var parts = common();
	PartGroup.prototype.arrangeBySize = function (specs) {
		specs = specs !== undefined ? specs : {
			x_max: -1,
			y_max: 0,
			z_max: 0,
			padding: 2,
			orientation: ['y', 'x', 'z'],
		};

		this.orientAll(specs.orientation);

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
	};

	parts.arrangeBySize();
	return parts;
}

function main() {
	//return before().asArray();
	return implementation().asArray();
}

