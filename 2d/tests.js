// TODO: use vows for this

describe('HSHG', function(){
	
	describe('Grid', function(){
		it('can make a 4x4 Grid with proper offsets', function(){
			var p = HSHG._private;
			var grid = new p.Grid(20, 16);

			expect(grid.rowColumnCount).toEqual(4);
			grid.initCells();

			// cells			offsets
			//  7	4	5		7	4	5
			//  3	0	1		3	0	1
			//  15	12	13		15	12	13
			expect(grid.allCells[0].neighborOffsetArray).toEqual([
				15, 12, 13, 3, 0, 1, 7, 4, 5
			]);

			// cells			offsets
			//	11	8	9		7	4	5
			//	7	4	5		3	0	1
			//	3	0	1		-1	-4	-3
			expect(grid.allCells[4].neighborOffsetArray).toEqual([
				-1, -4, -3, 3, 0, 1, 7, 4, 5
			]);

			// cells			offsets
			//	2	3	0		-13	-12	-15
			//	14	15	12		-1	0	-3
			//	10	11	8		-5	-4	-7
			expect(grid.allCells[15].neighborOffsetArray).toEqual([
				-5, -4, -7, -1, 0, -3, -13, -12, -15
			]);

			// cells			offsets
			//	13	14	15		3	4	5
			//	9	10	11		-1	0	1
			//	5	6	7		-5	-4	-3
			expect(grid.allCells[10].neighborOffsetArray).toEqual([
				-5, -4, -3, -1, 0, 1, 3, 4, 5
			]);

			console.log(grid);
		});

		it('can hash appropriately', function(){
			var p = HSHG._private;
			var grid = new p.Grid(133, 256);
			grid.initCells();

			console.log(grid.toHash(10,11));
			console.log(grid.toHash(10,10));
			console.log(grid.toHash(10,1000));
			console.log(grid.toHash(10000,100));

			expect(grid.toHash(10,11)).toEqual(grid.toHash(10,10));
			expect(grid.toHash(10,1000)).not.toEqual(grid.toHash(10000,1000));
		});
	});
	
	it('can add an object to the grid', function(){
		var v1 = new Vertex({ x: 10, y: 1000, radius: 40 }),
			h = new HSHG();
			
		h.addObject(v1);
		expect(h._grids.length).toEqual(1);
		expect(h._grids[0].occupiedCells.length).toEqual(1);
		expect(h._globalObjects.length).toEqual(1);
	});
	
	it('can add three similar objects to the same grid', function(){
		var v1 = new Vertex({ x: 10, y: 1000, radius: 40 }),
		 	v2 = new Vertex({ x: 10, y: 1000, radius: 45 }),
		 	v3 = new Vertex({ x: 10, y: 1000, radius: 50 }), 
			h = new HSHG();
			
		h.addObject(v1);
		h.addObject(v2);
		h.addObject(v3);
		
		expect(h._grids.length).toEqual(1);
		expect(h._globalObjects.length).toEqual(3);
	});
	
	it('can remove one object from the grid', function(){
		// the positions of these are purposeful. The grid size is approximately 57
		var v1 = new Vertex({ x: 0,  y: 1000, radius: 20 }),
		 	v2 = new Vertex({ x: 70, y: 1000, radius: 20 }),
		 	v3 = new Vertex({ x: 140, y: 1000, radius: 20 }),
			h = new HSHG();
			
		h.addObject(v1);
		h.addObject(v2);
		h.addObject(v3);
		
		expect(h._grids[0].allObjects.length).toEqual(3);
		expect(h._grids[0].occupiedCells.length).toEqual(3);
		expect(h._globalObjects.length).toEqual(3);
		
		h.removeObject(v1);
		expect(h._grids[0].occupiedCells.length).toEqual(2);
		
		expect(v1.HSHG).toBe(undefined); // metadata should be gone
		expect(h._grids[0].allObjects.length).toEqual(2);
		expect(h._globalObjects.length).toEqual(2);
	});
	
	it('can detect possible collisions', function(){
		var v1 = new Vertex({ x: 10, y: 1000, radius: 40 }),
		 	v2 = new Vertex({ x: 20, y: 1000, radius: 45 }),
		 	v3 = new Vertex({ x: 40, y: 1000, radius: 50 }),
			h = new HSHG(),
			collisions;
		
		h.addObject(v1);
		h.addObject(v2);
		h.addObject(v3);
		collisions = h.queryForCollisionPairs();
		
		expect(collisions.length).toEqual(3);
	});
	
	it('can update object position in the grid', function(){
		var v1 = new Vertex({ x: 100, y: 0, radius: 1 }),
			h = new HSHG();
			
		h.addObject(v1);
		
		console.log(v1.HSHG);
		expect(v1.HSHG.hash).toEqual(243);
		v1.x = 200;
		h.update();
		expect(v1.HSHG.hash).toEqual(246);
	});
	
	describe('Single Grid Expansion', function(){
		
		var i, v, h, 
			max = 32, 
			verts;
		
		beforeEach(function(){
			h = new HSHG();
			verts = [];

			for(i = 1; i <= max; i++){
				v = new Vertex({x : i * 100, y: 0, radius: 1});
				verts.push( v );
				h.addObject(v);
			}
		});

		it('has the right number of total objects', function(){
			expect(h._grids[0].allObjects.length).toEqual(max);
		});
		
		it('has the same number of occupied cells as objects', function(){
			expect(h._grids[0].occupiedCells.length).toEqual(max);
		})
		
		it('does not expand unless object/cell density is greater than MAX_OBJECT_CELL_DENSITY', function(){
			expect(h._grids[0].allObjects.length / h._grids[0].allCells.length)
				.toEqual(h.MAX_OBJECT_CELL_DENSITY);
			expect(h._grids[0].allCells.length).toEqual(h.INITIAL_GRID_LENGTH);
		});

		it('can expand when MAX_OBJECT_CELL_DENSITY is met to 4x original size', function(){
			v = new Vertex({x : max*10, y: 0, radius: 1});
			h.addObject(v);
			
			expect(h._grids[0].allCells.length).toEqual(h.INITIAL_GRID_LENGTH * 4);
		});
		
		it('does not lose objects after expanding', function(){
			v = new Vertex({x : max*10, y: 0, radius: 1});
			h.addObject(v);
			
			expect(h._globalObjects.length).toEqual(max+1);
		});
		
		it('under no circumstance has more occupied cells than objects', function(){
			v = new Vertex({x : max*10, y: 0, radius: 1});
			h.addObject(v);
			
			// under no circumstances should the number of occupied cells 
			// be greater than the number of objs
			expect(h._grids[0].occupiedCells.length).toBeLessThan(max+1);
		});
	});
	
	describe('HSHG vs Brute Force', function(){
	
		var  i, j, v1, v2
			,h = new HSHG()
			,objects = []
			,maxObjects = 10
			,radius = 10
			,hCollisions
			,bCollisions;
	
		beforeEach(function(){
			h = new HSHG();
			objects = [];
			bCollisions = [];
			hCollisions = [];
		});	
	
		it('does not miss collisions with preset values', function(){
			for(i = 0; i < maxObjects; i++){
				v1 = new Vertex({
					name: i, 
					x: 18*i, 
					y: 10*i, 
					radius: radius
				});
				v1.getAABB();
				objects.push(v1);
				h.addObject(v1);
			}

			bCollisions = getBruteForceCollisions(objects);
			hCollisions = h.queryForCollisionPairs(circleCircleIntersection);

			expect(bCollisions.length).toEqual(hCollisions.length);
		});
	
		it('does not miss collisions with random values', function(){
			for(i = 0; i < maxObjects; i++){
				v1 = new Vertex({
					name: i, 
					x: 10*i*Math.random(), 
					y: 10*i*Math.random(), 
					radius: radius
				});
				v1.getAABB();
				objects.push(v1);
				h.addObject(v1);
			}

			bCollisions = getBruteForceCollisions(objects);
			hCollisions = h.queryForCollisionPairs(circleCircleIntersection);

			expect(bCollisions.length).not.toBeGreaterThan(hCollisions.length);
		});
		
		function getBruteForceCollisions(all){
			var i, j, v1, v2, pairs = [];
			
			for(i = 0; i < all.length; i++){
				v1 = all[i];
				for(j = i+1; j < all.length; j++){
					v2 = all[j];
					if(circleCircleIntersection(v1, v2) === true){
						pairs.push([v1, v2]);
					}
				}
			}
			return pairs;
		}
		
		// Util to determine if two circles are overlapping
		function circleCircleIntersection(objA, objB){
			var	 diffX = objA.x - objB.x
				,diffY = objA.y - objB.y
				,dist = Math.sqrt(diffX*diffX + diffY*diffY)
				,radius2 = (objA.radius + objB.radius);

			if( dist < radius2 ){
				return true;
			}
			return false;
		}
		
	});
	
});

// used to outline the interface the HSHG expects
function Vertex(args /*x, y, radius*/){
	var argProp;
	
	for(argProp in args){
		if(args.hasOwnProperty(argProp)){
			this[ argProp ] = args[argProp]; 
		}
	}
}

Vertex.prototype.getAABB = function(){
	var rad = this.radius
		,x = this.x
		,y = this.y;
	return this.aabb = { 
		 min: [ x - rad, y - rad ]
		,max: [ x + rad, y + rad ]
	};
}

Vertex.prototype.draw = function(ctx, color){
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.arc( this.x, this.y, this.radius, 0, Math.PI*2, false);
	ctx.strokeRect(this.aabb.min[0], this.aabb.min[1], this.radius*2, this.radius*2);
	ctx.stroke();
}