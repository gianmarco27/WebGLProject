var Map = [[]];
var MapWidth = 30;
var MapHeight = 30;
var road = 1;
var Turn = 2;
var Tintersection = 3;
var Xintersection = 4;
var emptySlot = 0;

//initializing matrix to avoid sanity checks within the code
for(let i = 0; i < MapWidth; i++){
    Map[i] = [];
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function NoStreetsAround(width,height){
    return Map[wrapAround(width,-1)][wrapAround(height,-1)] != road && Map[wrapAround(width,+1)][wrapAround(height,+1)] != road &&
           Map[wrapAround(width,+1)][wrapAround(height,-1)] != road && Map[wrapAround(width,-1)][wrapAround(height,+1)] != road;
}

function checkForParallelStreets(){
    
}

function wrapAround(dimension, offset){
    if(dimension+offset < 0)
        return MapWidth;
    if(dimension+offset >= MapWidth)
        return 0;
    if(dimension+offset >= 0 && dimension+offset < MapWidth)
        return dimension+offset;
}
let currentWidth = 0;
let currentHeight = 0;
while(Map[currentWidth][currentHeight] != road)
Map[currentWidth][currentHeight] = getRandomInt(0,4)

console.log(JSON.stringify(Map));