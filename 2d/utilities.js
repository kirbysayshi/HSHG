!function(root){

    // From http://baagoe.com/en/RandomMusings/javascript/
    // Johannes Baagøe <baagoe@baagoe.com>, 2010
    function Mash() {
        var  n = 0xefc8249d
            ,mash;

        mash = function(data) {
            data = data.toString();
            for (var i = 0; i < data.length; i++) {
                n += data.charCodeAt(i);
                var h = 0.02519603282416938 * n;
                n = h >>> 0;
                h -= n;
                h *= n;
                n = h >>> 0;
                h -= n;
                n += h * 0x100000000; // 2^32
            }
            return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
        };

        mash.version = 'Mash 0.9';
        return mash;
    }

    // modified, from http://baagoe.com/en/RandomMusings/javascript/
    root.Alea = function Alea(){
        // Johannes Baagøe <baagoe@baagoe.com>, 2010
        var  args = [].slice.call(arguments)
            ,s0 = 0
            ,s1 = 0
            ,s2 = 0
            ,c = 1

            ,mash
            ,i
            ,random;

        if (args.length == 0) {
            args = [+new Date];
        }

        mash = Mash();
        s0 = mash(' ');
        s1 = mash(' ');
        s2 = mash(' ');

        for (i = 0; i < args.length; i++) {
            s0 -= mash(args[i]);
            if (s0 < 0) {
                s0 += 1;
            }
            s1 -= mash(args[i]);
            if (s1 < 0) {
                s1 += 1;
            }
            s2 -= mash(args[i]);
            if (s2 < 0) {
                s2 += 1;
            }
        }

        mash = null;

        random = function() {
            var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
            s0 = s1;
            s1 = s2;
            return s2 = t - (c = t | 0);
        };

        random.uint32 = function() {
            return random() * 0x100000000; // 2^32
        };

        random.fract53 = function() {
            return random() + 
                (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
        };

        random.version = 'Alea 0.9';
        random.args = args;
        return random;
    }

    // call a constructor with variable arguments
    // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible/1608546#1608546
    function construct(constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        return new F();
    }

    root.Dice = function(seed){
        this.gen = construct(Alea, arguments);
    }

    root.Dice.prototype = (function make(){
        var types =  {}
                    ,i

        for(i = 2; i <= 100; i++){
            types['d' + i] = (function(sides){
                return function(count, separate){
                    count = count || 1;

                    var rolls = []
                        ,total = 0
                        ,i = 0
                        ,a;

                    for(;i < count; i++){
                        a = ((this.gen()*sides)|0) + 1;
                        total += a;
                        rolls.push(a);
                    }

                    return separate === true
                        ? rolls
                        : total;
                }
            })(i)
        }

        return types;
    })();

}(window);


///// actual code

(function(exports){

// remove seed to make random again
var dice = new window.Dice(1328165128019);

function Vertex(args /*x, y, z, radius, color*/){
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
		,y = this.y
		,z = this.z;
	return this.aabb = { 
		 min: [ x - rad, y - rad, z - rad ]
		,max: [ x + rad, y + rad, z + rad ]
	};
}

Vertex.prototype.draw = function(ctx, color){
	ctx.strokeStyle = color || this.color;
	ctx.beginPath();
	ctx.arc( this.x, this.y, this.radius, 0, Math.PI*2, false);
	ctx.strokeRect(this.aabb.min[0], this.aabb.min[1], this.radius*2, this.radius*2);
	ctx.stroke();
}

Vertex.prototype.highlight = function(ctx, fillcolor, strokecolor, overStrokePercent){
	ctx.lineWidth = 1;
	ctx.strokeStyle = strokecolor || this.color;
	ctx.fillStyle = fillcolor || 'rgba(255,255,255,0.3)';
	ctx.beginPath();
	//ctx.arc( this.x, this.y, this.radius, 0, Math.PI*2, false);
	//ctx.strokeRect(~~this.aabb.min[0], ~~this.aabb.min[1], this.radius*2, this.radius*2);
	//ctx.stroke();
	ctx.fill();

	//ctx.lineWidth = 1*overStrokePercent;
	ctx.beginPath();
	ctx.arc( this.x, this.y, this.radius + (overStrokePercent*2), 0, Math.PI*2, false);
	ctx.stroke();
}

exports.decimalToHexString = function(number){
    if (number < 0){
        number = 0xFFFFFFFF + number + 1;
    }

    return number.toString(16).toUpperCase();
}

exports.addListToGrid = function(vlist, grid){
	vlist.forEach(function(v){
		grid.addObject(v);
	});
}

exports.drawVertexList = function(vlist, ctx){
	vlist.forEach(function(v){
		v.draw(ctx);
	});
}

exports.highlightPairs = function(pairs, ctx, fillColor, strokeColor, overStrokePercent){
	pairs.forEach(function(p, i){
		//fillColor = fillColor || 'rgba( 0, 0, ' + (~~(i / pairs.length * 10) + 245) + ', 0.3)';
		//strokeColor = strokeColor || 'rgba( 0, 0, ' + (~~(i / pairs.length * 10) + 245) + ', 0.3)';

		p[0].highlight(ctx, fillColor, strokeColor, overStrokePercent);
		p[1].highlight(ctx, fillColor, strokeColor, overStrokePercent);
	})
}

exports.bruteForceCollide = function(vlist){
	var i, j, v1, v2, pairs = [];
		
	for(i = 0; i < vlist.length; i++){
		v1 = vlist[i];
		for(j = i+1; j < vlist.length; j++){
			v2 = vlist[j];
			if(exports.aabbAABBIntersection(v1, v2) === true){
				pairs.push([v1, v2]);
			}
		}
	}

	return pairs;
}

exports.aabbAABBIntersection = function(objA, objB){
	var  a = objA.getAABB()
		,b = objB.getAABB();

	if(a.min[0] > b.max[0] || a.min[1] > b.max[1] || a.min[2] > b.max[2]
	|| a.max[0] < b.min[0] || a.max[1] < b.min[1] || a.max[2] < b.min[2]){
		return false;
	} else {
		return true;
	}
}

exports.circleCircleIntersection = function(objA, objB){
	var	 diffX = objA.x - objB.x
		,diffY = objA.y - objB.y
		,dist = Math.sqrt(diffX*diffX + diffY*diffY)
		,radius2 = (objA.radius + objB.radius);

	if( dist < radius2 ){
		return true;
	}
	return false;
}

exports.pairsNotIn = function(listA, listB){
	// items in A that are not in B
	var items = [];

	listA.forEach(function(a){
		var found = false;

		listB.forEach(function(b){
			if( (a[0] == b[0] && a[1] == b[1]) || (a[0] == b[1] && a[1] == b[0]) ){
				found = true;
			}
		})

		if(found === false){
			items.push(a);
		}
	});

	return items;
}

exports.makeXVertices = function(x, radius, worldWidth, worldHeight, color, enableZ){
	var list = []
		,total = x
		,color
		,v;

	radius = radius || 10;

	while(x > 0){
		color = color || '#' + exports.decimalToHexString(x / total * 16e6);

		v = new exports.Vertex({
			 x: (dice.d100() / 100) * worldWidth
			,y: (dice.d100() / 100) * worldHeight
			,z: enableZ === true 
				? (dice.d100() / 100) * worldWidth
				: 0
			,color: color
			,radius: radius
		});

		v.getAABB();

		list.push(v);

		x -= 1;
	}

	return list;
}

exports.domFromVertices = function(vlist, container, worldWidth, worldHeight){
	container.style.position = 'relative';
	container.style.width = worldWidth;
	container.style.height = worldHeight;
	container.style.overflow = 'hidden';
	container.style.backgroundColor = '#000';

	vlist.forEach(function(v){
		var n = document.createElement('div');
		n.style.position = 'absolute';
		n.style.left = (v.x - v.radius) + 'px';
		n.style.top = (v.y - v.radius) + 'px';
		n.style.width = (v.radius * 2) + 'px';
		n.style.height = (v.radius * 2) + 'px';
		n.style.backgroundColor = v.color;
		n.style.opacity = '0.5';

		container.appendChild(n);
	});
}

exports.meshFromVertexPairs = function(vlist, scene, color, buffer, highlightPairs){
	
	vlist.forEach(function(pair){

		if(highlightPairs){
			var aabb1 = pair[0].getAABB()
				,aabb2 = pair[1].getAABB()
				,maxX = Math.max( aabb1.max[0], aabb2.max[0] )
				,maxY = Math.max( aabb1.max[1], aabb2.max[1] )
				,maxZ = Math.max( aabb1.max[2], aabb2.max[2] )

				,minX = Math.min( aabb1.min[0], aabb2.min[0] )
				,minY = Math.min( aabb1.min[1], aabb2.min[1] )
				,minZ = Math.min( aabb1.min[2], aabb2.min[2] )

			geometry = new THREE.CubeGeometry(maxX - minX + buffer*2, maxY - minY + buffer*2, maxZ - minZ + buffer*2);
			material = new THREE.MeshBasicMaterial({wireframe: true});
			material.color.setHSV(color[0] + 0.28, color[1], color[2] - 0.28);
			material.opacity = 0.5;
			var aabb = new THREE.Mesh(geometry, material);
			aabb.position.x = minX + ((maxX - minX) * 0.5) - buffer;
			aabb.position.y = minY + ((maxY - minY) * 0.5) - buffer;
			aabb.position.z = minZ + ((maxZ - minZ) * 0.5) - buffer;
			scene.add(aabb);	
		}

		pair.forEach(function(v){
			
			//var geometry = new THREE.SphereGeometry(v.radius + buffer, 16, 16);
			//var material = new THREE.MeshBasicMaterial({ transparent: true });
			//material.color.setHSV(color[0], color[1], color[2]);
			////material.opacity = 1 - (color[0] + color[1] + color[2]);
			//var sphere = new THREE.Mesh(geometry, material);
			//sphere.position.x = v.x;
			//sphere.position.y = v.y;
			//sphere.position.z = v.z;
			//scene.add(sphere);

			geometry = new THREE.CubeGeometry((v.radius+buffer)*2, (v.radius+buffer)*2, (v.radius+buffer)*2);
			material = new THREE.MeshBasicMaterial({wireframe: true});
			material.color.setHSV(color[0], color[1], color[2]);
			material.opacity = 0.5;
			var aabb = new THREE.Mesh(geometry, material);
			aabb.position.x = v.x;
			aabb.position.y = v.y;
			aabb.position.z = v.z;
			scene.add(aabb);
				
		})
	})

}

exports.meshFromVertexList = function(vlist, scene, color, buffer){
	
	vlist.forEach(function(v){
		// Create a new geometry object, here we're using a built in sphere generator
		var geometry = new THREE.SphereGeometry(v.radius + buffer, 16, 16);
		// Use a lambert purple material
		var material = new THREE.MeshLambertMaterial();
		//var material = new THREE.MeshBasicMaterial({ transparent: true });
		material.color.setHSV(color[0], color[1], color[2]);
		//material.opacity = 0.5;
		var sphere = new THREE.Mesh(geometry, material);
		sphere.position.x = v.x;
		sphere.position.y = v.y;
		sphere.position.z = v.z;
		scene.add(sphere);
			
	})

}

exports.moveAllVertices = function(vlist, worldWidth, worldHeight, container, amount, enableZ){
	
	vlist.forEach(function(v){
		//v.x = (dice.d100() / 100) * worldWidth;
		//v.y = (dice.d100() / 100) * worldHeight;

		v.x += ((dice.d100() / 100) > 0.5 ? 1 : -1 ) * (dice.d100() / 100) * amount;
		v.y += ((dice.d100() / 100) > 0.5 ? 1 : -1 ) * (dice.d100() / 100) * amount;
		v.z += enableZ === true
			? ((dice.d100() / 100) > 0.5 ? 1 : -1 ) * (dice.d100() / 100) * amount
			: 0;

		v.getAABB();
	});

	if(container){
		container.innerHTML = '';
		exports.domFromVertices(vlist, container, worldWidth, worldHeight);
	}
}


exports.Vertex = Vertex;

})(window.util = {});