var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var SHOW_GRID = false;
var GRID_THICKNESS = 0.5;
var CELL_THICKNESS = 1;
var shapeIsSet = false;
var mainIsSet = false;
var mainTessal;


var Grid = {
    offsetX: Math.floor(window.innerWidth / 2),
    offsetY: Math.floor(window.innerHeight / 2),
    gridSize: 25,
    init: function(){
    	this.offsetX = Math.floor(window.innerWidth / 2);
    	this.offsetY = Math.floor(window.innerHeight / 2);
    },
    draw: function() {
        ctx.beginPath();
        for(var x = this.offsetX % this.gridSize; x < canvas.width; x+= this.gridSize){
            ctx.moveTo(x,0);
            ctx.lineTo(x,canvas.height);
        }
        for(var y = this.offsetY % this.gridSize; y < canvas.height; y+= this.gridSize){
            ctx.moveTo(0,y);
            ctx.lineTo(canvas.width,y);
        }
        ctx.lineWidth = GRID_THICKNESS;
        ctx.stroke();
        },
    zoom: function(direction) {
        // pixel center - the grid pixel offset / gridSize
        var oldCenterGridX = ((canvas.width/2) - this.offsetX) / this.gridSize;
        var oldCenterGridY = ((canvas.height/2) - this.offsetY) / this.gridSize;
        if(direction == "in"){
            if(this.gridSize < 200){
                this.gridSize += this.gridSize * 0.1;
                }
            } else if (this.gridSize > 1){ // add or subtract a percentage of the current
                this.gridSize -= this.gridSize * 0.1;
                }
        var newCenterX = oldCenterGridX * this.gridSize + this.offsetX;
        var newCenterY = oldCenterGridY * this.gridSize + this.offsetY;
        var zoomOffsetX = newCenterX - canvas.width/2;
        var zoomOffsetY = newCenterY - canvas.height/2;
        this.offsetX -= zoomOffsetX;
        this.offsetY -= zoomOffsetY;
        }
}

function Cell (thisX,thisY){
    this.x = thisX;
    this.y = thisY;
    this.pxLeft = Grid.offsetX + Grid.gridSize * this.x;
    this.pxTop = Grid.offsetY + Grid.gridSize * this.y;
    this.pxRight = this.pxLeft + Grid.gridSize;
    this.pxBottom = this.pxTop + Grid.gridSize;
    this.draw = function(){
        ctx.fillRect(Grid.offsetX + Grid.gridSize * this.x, 
        Grid.offsetY + Grid.gridSize * this.y, Grid.gridSize, Grid.gridSize);
    };
    this.drawTop = function(offsetX,offsetY){
    	ctx.beginPath();
		ctx.moveTo(this.pxLeft+offsetX,this.pxTop+offsetY);
		ctx.lineTo(this.pxRight+offsetX,this.pxTop+offsetY);
		ctx.lineWidth = CELL_THICKNESS;
		ctx.stroke();
    };
    this.drawLeft = function(offsetX,offsetY){
    	ctx.beginPath();
		ctx.moveTo(this.pxLeft+offsetX,this.pxTop+offsetY);
		ctx.lineTo(this.pxLeft+offsetX,this.pxBottom+offsetY);
		ctx.lineWidth = CELL_THICKNESS;
		ctx.stroke();
    };
    this.drawBottom = function(offsetX,offsetY){
    	ctx.beginPath();
		ctx.moveTo(this.pxLeft+offsetX,this.pxBottom+offsetY);
		ctx.lineTo(this.pxRight+offsetX,this.pxBottom+offsetY);
		ctx.lineWidth = CELL_THICKNESS;
		ctx.stroke();
    };
    this.drawRight = function(offsetX,offsetY){
    	ctx.beginPath();
		ctx.moveTo(this.pxRight+offsetX,this.pxTop+offsetY);
		ctx.lineTo(this.pxRight+offsetX,this.pxBottom+offsetY);
		ctx.lineWidth = CELL_THICKNESS;
		ctx.stroke();
    };
}

function TesselLocation(column,row){
	this.column = column;
	this.row = row;
	this.index;
}

function Tessellation(width,height,vertShift,horzShift){
    this.cells = [];
    this.x;
    this.y;
    this.width = width;
    this.height = height;
    this.vertShift = vertShift;
    this.horzShift = horzShift;
    this.init = function(){
    	this.x = Math.floor(-this.width/2);
    	this.y = Math.floor(-this.height/2);
        for(var xi = this.x; xi < this.x+this.width; xi++){
            for(var yi = this.y; yi < this.y+this.height; yi++){
                this.addCell(new Cell(xi,yi));
            }
        }
    };
    this.draw = function(){
    	for(var i = 0; i < this.cells.length; i++){
    		ctx.fillStyle = "#7ca6ea";
    		this.cells[i].draw();
    	}
    }
    this.drawOutline= function(offsetX,offsetY){
    	var pxOffsetX = offsetX*Grid.gridSize || 0;
    	var pxOffsetY = offsetY*Grid.gridSize || 0;
        for(var i = 0; i < this.cells.length; i++){
            if(this.getindex(new Cell(this.cells[i].x,this.cells[i].y-1)) == -1){
            	this.cells[i].drawTop(pxOffsetX,pxOffsetY);
            }
            if(this.getindex(new Cell(this.cells[i].x-1,this.cells[i].y)) == -1){
            	this.cells[i].drawLeft(pxOffsetX,pxOffsetY);
            }
            if(this.getindex(new Cell(this.cells[i].x,this.cells[i].y+1)) == -1){
            	this.cells[i].drawBottom(pxOffsetX,pxOffsetY);
            }
            if(this.getindex(new Cell(this.cells[i].x+1,this.cells[i].y)) == -1){
            	this.cells[i].drawRight(pxOffsetX,pxOffsetY);
            }
        }
    };
    this.fillBoard = function(){
    	// the number of cells from the middle of the screen to the edge of the grid
    	var offsetX = Math.ceil(Grid.offsetX/Grid.gridSize); 
    	var offsetY = Math.ceil(Grid.offsetY/Grid.gridSize);
    	
    	// the number of cells from the edge of the main tessel to the start of the repeating background
    	var x = -this.width*(Math.ceil(offsetX/this.width));
    	var y = -this.height*(Math.ceil(offsetY/this.height));
    	
    	// the number of tessalations displaying across the screen
    	var numCols = ((x*-1)/this.width) *2 +1;
    	var numRows = ((y*-1)/this.height) *2 +1;
    	
    	// did some math to adjust the x to the shifts
    	var totalHorzShift = -(((y*-1)/this.height)*this.horzShift)%this.width;
    	for(var r = 0; r < numRows; r++){
    		var totalVertShift = -(((x*-1)/this.width+1)*this.vertShift)%this.height;
    		for(var c = 0; c < numCols; c++){
    			totalVertShift = (totalVertShift + this.vertShift)%this.height;
    			this.drawOutline(x+(c*this.width)+totalHorzShift,y+(r*this.height)+totalVertShift);
    		}
    		totalHorzShift = (totalHorzShift + this.horzShift)%this.width;
    	}
    }
    this.getindex = function(cellWeAreTesting){
    	for(var i = 0; i < this.cells.length; i++){
    		if(cellWeAreTesting.x == this.cells[i].x &&
    		   cellWeAreTesting.y == this.cells[i].y){
    			return i;
    		}
    	}
    	return -1;
    };
    this.getAbstractIndex = function(cell){
    	var thisMainEquiv = this.getMainEquiv(cell);
    	for(var i = 0; i < this.cells.length; i++){
    		var centralEquiv = this.getMainEquiv(this.cells[i]);
    		if(thisMainEquiv.x == centralEquiv.x &&
    		   thisMainEquiv.y == centralEquiv.y){
    		   	return i;
    		}
    	}
    };
    this.getTessalLoc = function(cell) {
    	return new TesselLocation
    	(this.column = Math.floor(((cell.x-this.x) - (Math.floor((cell.y-this.y)/this.height)*this.horzShift))/this.width),
    	this.row = Math.floor(((cell.y-this.y) - (Math.floor((cell.x-this.x)/this.width)*this.vertShift))/this.height))
    }
    this.addCell = function(cellToAdd){
    	if(this.getindex(cellToAdd) == -1){
    		this.cells.push(cellToAdd);
    	}
    }
    this.removeCell = function(cellToRemove){
    	var index = this.getindex(cellToRemove);
    	if(index == -1){return}
    	this.cells.splice(index,1);
    };
    this.getMainEquiv = function(cell){
    	var tesselLocation = this.getTessalLoc(cell);
    	var x = cell.x - (tesselLocation.column*this.width+tesselLocation.row*this.horzShift);
    	var y = cell.y - (tesselLocation.row*this.height+tesselLocation.column*this.vertShift);
    	return new Cell(x,y);
    }
    this.toggle = function(cell){
    	var index = this.getindex(cell);
    	// clicked on a blue cell
    	if(index != -1){
    		// remove the blue cell
    		this.cells.splice(index,1);
    		// check the 4 cells around it to see where to put it
    		// if more than one neibor is a valid spot or if it is not
    		// on the edge then ask where to put it
    		var neighbors = [new Cell(cell.x,cell.y-1), new Cell(cell.x-1,cell.y),
    						new Cell(cell.x,cell.y+1), new Cell(cell.x+1,cell.y)];
    		var neighborHomes = [];
    		for(var i = 0; i < neighbors.length; i++){
    			// if the neighbor is a gray square
    			if(this.getindex(neighbors[i]) == -1){
    				// then push the tessal it is in to the array if there is 
    				// not the same one already there
    				var neighborHome = this.getTessalLoc(neighbors[i]);
    				var thereIsAMatch = false;
    				for(var j = 0; j < neighborHomes.length; j++){
    					if(neighborHome.column == neighborHomes[j].column &&
    					neighborHome.row == neighborHomes[j].row){
    						thereIsAMatch = true;
    					}
    				}
    				if(!thereIsAMatch){
    					neighborHome.index = i;
    					neighborHomes.push(neighborHome);
    				}
    			}
    		}
    		console.log(neighborHomes[0]);
    		if(neighborHomes.length == 1){
    			var thisTesselLoc = this.getTessalLoc(cell);
    			var correcthome = new TesselLocation(
    					(neighborHomes[0].column-thisTesselLoc.column)*-1-thisTesselLoc.column,
    					(neighborHomes[0].row-thisTesselLoc.row)*-1-thisTesselLoc.row);
    			console.log(thisTesselLoc,correcthome);
    			this.addCell(neighbors[neighborHomes[0].index]);
    		}
    		// this.addCell(this.getMainEquiv(cell));
    	// clicked on a grey cell
    	} else {
    		// remove the associated blue cell
    		this.cells.splice(this.getAbstractIndex(cell),1);
    		// turn the grey cell blue
    		this.addCell(cell);
    	}
    };
    
}

{
    var mouseIsDown = false;
    var mouseDownX = 0;
    var mouseDownY = 0;
    var topCorner,width,height;
    window.onmousedown = function(Event){
    	mouseIsDown = true;
        mouseDownX = Event.pageX;
        mouseDownY = Event.pageY;
        var cell = new Cell(Math.floor((mouseDownX - Grid.offsetX)/Grid.gridSize),
                Math.floor((mouseDownY - Grid.offsetY)/Grid.gridSize));
        if(shapeIsSet){
        	mainIsSet = true;
        	mainTessal.toggle(cell);
        } else {
        	topCorner = cell;
    	}
        draw();
    };
    window.onmousemove = function(Event){  
    	var cell = new Cell(Math.floor((Event.pageX - Grid.offsetX)/Grid.gridSize),
                Math.floor((Event.pageY - Grid.offsetY)/Grid.gridSize));
    	if(mouseIsDown && !mainIsSet){
    		width = cell.pxLeft - topCorner.pxLeft;
    		height = cell.pxTop - topCorner.pxTop;
    		draw();
    		ctx.fillStyle = "#7ca6ea";
    		ctx.fillRect(Grid.offsetX + Grid.gridSize * topCorner.x,
    			Grid.offsetY + Grid.gridSize * topCorner.y,width,height);
    	}
    };
    window.onmouseup = function(){
    	mouseIsDown = false;
    	if(!mainIsSet && Math.abs(width/Grid.gridSize*height/Grid.gridSize) >= 3){
    		shapeIsSet = true;
    		mainTessal = new Tessellation(width/Grid.gridSize,height/Grid.gridSize,0,29);
    		mainTessal.init();
    		draw();
    	}
    };
 } // Mouse Handlers

{
    window.addEventListener("keydown", function (event) {
        if (event.defaultPrevented) {
            return; // Should do nothing if the key event was already consumed.
            }
        // 187 +
        // 189 -
        
        // alert(event.keyCode);
        switch(event.keyCode) {
            case 187:
            Grid.zoom("in");
            break;
            case 189:
            Grid.zoom("out");
            break;
            case 37: // <-
            	if(shapeIsSet && !mainIsSet){
            		mainTessal.vertShift = 0;
            		mainTessal.horzShift++;
            		draw();
            	}
            	break;
            case 38: // ^
            	if(shapeIsSet && !mainIsSet){
            		mainTessal.horzShift = 0;
            		mainTessal.vertShift--;
            		draw();
            	}
            	break;
            case 39: // ->
            	if(shapeIsSet && !mainIsSet){
            		mainTessal.vertShift = 0;
            		mainTessal.horzShift--;
            		draw();
            	}
            	break;
            case 40: // v
            	if(shapeIsSet && !mainIsSet){
            		mainTessal.horzShift = 0;
            		mainTessal.vertShift++;
            		draw();
            	}
            	break;
            case 13:
            	mainIsSet = true;
            	break;
            default:
            return;
            }
        
        // Consume the event to avoid it being handled twice
        event.preventDefault();
        }, true);
} // Keyboard Handler

function draw() {
    // clear screen
    ctx.clearRect(0,0,canvas.width,canvas.height);
	if(SHOW_GRID){Grid.draw();}
	if(shapeIsSet){
		mainTessal.draw();
		mainTessal.fillBoard();
	} else if(!shapeIsSet) {
		ctx.fillStyle = "#000";
		ctx.font = "20px Arial";
		ctx.fillText("Click and Drag to make the tessalation the size you want",100,100);
	} else {
		ctx.fillStyle = "#000";
		ctx.font = "20px Arial";
		ctx.fillText("use arrow keys to adjust shift, press enter when done",100,100);
	}
}

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Grid.init();
    mainTessal = new Tessellation(9,3,0,2);
    draw();
}

window.onresize = function(){
	canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Grid.init();
    draw();
}

init();
