var Map = [[]];
var detailMap=[[]];
var MapWidth = 30;
var MapHeight = 30;
var road = 1;
var Turn = 2;
var Tintersection = 3;
var Xintersection = 4;
var emptySlot = 0;

var directions = ["N","S","E","W"];
var oppositeDirection = ["S","N","W","E"];
var directionSlope = [[0,-1],[0,1],[-1,0],[1,0]];
var currentDirection;
var currentWidth;
var currentHeight;
//initializing matrix to avoid sanity checks within the code
for(let i = 0; i < MapWidth; i++){
    Map[i] = [];
    detailMap[i] = [];
    for(let j = 0; j < MapHeight; j++){
        Map[i][j] = 0;
        detailMap[i][j] = {direction:null};
    }
}

function getDistance( x1, y1, x2, y2 ) {
	let	xs = x2 - x1;
	let ys = y2 - y1;		
	xs *= xs;
	ys *= ys;
	return Math.sqrt( xs + ys );
};

function wrapAround(size,offset){
    return (MapWidth + size + offset) % MapWidth;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getStreetsAround(width,height){
    let crossings = 0;
    if(Map[width][wrapAround(height,-1)] > 0)
         crossings++;
    if(Map[width][wrapAround(height,+1)] > 0)
         crossings++;
    if(Map[wrapAround(width,+1)][height] > 0)
         crossings++;
    if(Map[wrapAround(width,-1)][height] > 0)
         crossings++;
    return crossings;
}

function checkForParallelStreets(x,y,direction){
    let hasParallelStreet = false;
    if (direction == "N" || direction == "S"){
        if( (Map[wrapAround(x,-1)][wrapAround(y,-1)] > 0 && Map[wrapAround(x,-1)][wrapAround(y,+1)] > 0) ||
            (Map[wrapAround(x,+1)][wrapAround(y,-1)] > 0 && Map[wrapAround(x,+1)][wrapAround(y,+1)] > 0) )
            if (detailMap[wrapAround(x,-1)][wrapAround(y,-1)].direction == detailMap[wrapAround(x,-1)][wrapAround(y,+1)].direction ||
                detailMap[wrapAround(x,+1)][wrapAround(y,-1)].direction == detailMap[wrapAround(x,+1)][wrapAround(y,+1)].direction)
                hasParallelStreet = true;
    }
    if (direction == "W" || direction == "E"){
        if( (Map[wrapAround(x,-1)][wrapAround(y,-1)] > 0 && Map[wrapAround(x,+1)][wrapAround(y,-1)] > 0) ||
            (Map[wrapAround(x,-1)][wrapAround(y,+1)] > 0 && Map[wrapAround(x,+1)][wrapAround(y,+1)] > 0) )
            if (detailMap[wrapAround(x,-1)][wrapAround(y,-1)].direction == detailMap[wrapAround(x,+1)][wrapAround(y,-1)].direction ||
                detailMap[wrapAround(x,-1)][wrapAround(y,+1)].direction == detailMap[wrapAround(x,+1)][wrapAround(y,+1)].direction)
                hasParallelStreet = true;
    }
    return hasParallelStreet;
}

let lowSlot = [MapWidth,MapHeight];
let highSlot = [0,0];

function getLowestSlot(){
    for(let i = 0; i < MapWidth; i++){
        for(let j = 0; j < MapHeight; j++){
            if(Map[i][j] > 0 && i < lowSlot[0])
                lowSlot = [i,j];
        }
    }
}

function getHighestSlot(){
    for(let i = 0; i < MapWidth; i++){
        for(let j = 0; j < MapHeight; j++){
            if(Map[i][j] > 0 && i > highSlot[0])
                highSlot = [i,j];
        }
    }
}

function createPath(start,end,direction){
    let newPath = true;
    let stuck = false;
    currentWidth = start[0];
    currentHeight = start[1];
    let previousWidth,previousHeight;
    let currentDirection = directions.indexOf(direction);
    let tempDirection;
    let tempSlope;
    let distanceIncreased = false;
    let previousDistance;
    let newDistance = getDistance(currentWidth,currentHeight,end[0],end[1]);
    Map[currentWidth][currentHeight] += 1;
    detailMap[currentWidth][currentHeight].direction = direction;

    let startTime = new Date().getTime();
    while(newDistance > 0 || new Date().getTime() > startTime + 3000){
        newDistance = getDistance(currentWidth,currentHeight,end[0],end[1]);
        distanceIncreased = previousDistance <= newDistance;
        previousDistance = newDistance; 
        //go towards end
        previousWidth = currentWidth;
        previousHeight = currentHeight;
        do {
            tempDirection = getRandomInt(0,3);
            if(new Date().getTime() > startTime + 3000) break;
        } while ((oppositeDirection[tempDirection] == directions[currentDirection] && stuck) || directions[tempDirection] == oppositeDirection[directions.indexOf(direction)] || (distanceIncreased && tempDirection == currentDirection) || !((currentWidth + directionSlope[tempDirection][0] <= MapWidth) && (currentHeight + directionSlope[tempDirection][1] <= MapHeight)));
        tempSlope = directionSlope[tempDirection];
        if(new Date().getTime() > startTime + 3000) break;

        for(let i = 0; i < 2 ; i++){
            if(currentWidth + tempSlope[0] < MapWidth && currentWidth + tempSlope[0] > -1)
                currentWidth += tempSlope[0];
            if(currentHeight + tempSlope[1] < MapHeight && currentHeight + tempSlope[1] > -1)
                currentHeight += tempSlope[1];
        
            if(previousWidth != currentWidth || previousHeight != currentHeight){
                if(Map[currentWidth][currentHeight] < 4 && (!detailMap[currentWidth][currentHeight].hasOwnProperty("direction") || (detailMap[currentWidth][currentHeight].direction != directions[tempDirection] && detailMap[currentWidth][currentHeight].direction != oppositeDirection[tempDirection]))){
                    
                    Map[currentWidth][currentHeight] += 1;
                    
                    if(directions[currentDirection] != directions[tempDirection] && Map[previousWidth][previousHeight] < 4 && (!detailMap[currentWidth][currentHeight].hasOwnProperty("direction") || (detailMap[currentWidth][currentHeight].direction != detailMap[previousWidth][previousHeight].direction && detailMap[currentWidth][currentHeight].direction != oppositeDirection[directions.indexOf(detailMap[previousWidth][previousHeight].direction)]))){
                        Map[previousWidth][previousHeight] += 1;
                    }
                    detailMap[currentWidth][currentHeight].direction = directions[tempDirection];
                }
                                                                                                                               
            previousWidth = currentWidth;
            previousHeight = currentHeight;
            } else {
                stuck = true;
                console.log("Skipped due to no effective increment in any direction");
            }
            currentDirection = tempDirection;
        }
    } 
}

function crossingCorrection(){
    for(let i = 0; i < MapWidth; i++){
        for(let j = 0; j < MapHeight; j++){
            if(Map[i][j] > 0)
                Map[i][j] = getStreetsAround(i,j);
            if(Map[i][j] == 2){
                if(Map[wrapAround(i,-1)][j] > 0)
                    if(Map[i][wrapAround(j,-1)] > 0)
                        detailMap[i][j].rotation = 90.0;
                if(Map[wrapAround(i,-1)][j] > 0)
                    if(Map[i][wrapAround(j,+1)] > 0)
                        detailMap[i][j].rotation = 180.0;
                if(Map[wrapAround(i,+1)][j] > 0)
                    if(Map[i][wrapAround(j,-1)] > 0)
                        detailMap[i][j].rotation = 0.0;
                if(Map[wrapAround(i,+1)][j] > 0)
                    if(Map[i][wrapAround(j,+1)] > 0)
                        detailMap[i][j].rotation = -90.0;
            }
            if(Map[i][j] == 3){
                if(Map[wrapAround(i,-1)][j] == 0)
                    detailMap[i][j].rotation = 90.0;
                if(Map[wrapAround(i,+1)][j] == 0)
                    detailMap[i][j].rotation = -90.0;
                if(Map[i][wrapAround(j,-1)] == 0)
                    detailMap[i][j].rotation = 0.0;
                if(Map[i][wrapAround(j,+1)] == 0)
                    detailMap[i][j].rotation = 180.0;
            }
        }
    }
    Map[MapWidth/2][0] = getStreetsAround(MapWidth/2,0);
    Map[MapWidth/2][MapHeight-1] = getStreetsAround(MapWidth/2,MapHeight-1);
}

function curveCorrection(){
    for(let i = 0; i < MapWidth; i++){
        for(let j = 0; j < MapHeight; j++){
            if(Map[i][j] == 2)
                if((Map[wrapAround(i,-1)][j] > 0 && Map[wrapAround(i,1)][j] > 0) ||
                   (Map[i][wrapAround(j,-1)] > 0 && Map[i][wrapAround(j,1)] > 0))
                        Map[i][j] = 1;
        }
    }
    Map[MapWidth/2][0] = getStreetsAround(MapWidth/2,0);
    Map[MapWidth/2][MapHeight-1] = getStreetsAround(MapWidth/2,MapHeight-1);
}

createPath([MapWidth/2,0],[MapWidth/2,MapHeight-1],"S");

//console.log(JSON.stringify(Map));

crossingCorrection();
curveCorrection();
console.log(JSON.stringify(Map));

//optional enriching path, might cause unpleasant crossings
//getLowestSlot();
//getHighestSlot();
//createPath([0,MapHeight/2],lowSlot,"W");
//createPath(highSlot,[MapWidth-1,MapHeight/2],"W");
//crossingCorrection();
//curveCorrection();
//console.log(JSON.stringify(Map));
main();