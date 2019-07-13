    var gl;
    var canvas;
    var positionBuffer;
    var uvBuffer;
    var indexBuffer;
    var normalBuffer;

//Camera Parameters
    var relativeCameraVector = [15,0];
    var relativeCameraZ = 0.2;
    var cameraElevation = 90.0;
    var cameraAngle = 0.0;
    var cameraDelta = 0.03;
    var speedFactor = 2.0;
    var cameraSpeedsVector = [0.0,0.0];
    var cameraAngleSpeed = 0.0;
    var cameraElevationSpeed = 0.0;

    var xSize = 2.30;
    var ySize = 2.30;
    var mapXrep = 0;
    var mapYrep = 0;
    var modelErrorCorrection = 0.0;
    var renderRange = 10;
    var lightAngle = 90;
    var floorIndex = 99;

    var shaderDir = new URL(origin) + "CityRender/shaders/";
    var baseDir = new URL(origin) + "CityRender/";
    var assetDir = new URL(origin) + "CityRender/assets/";
    var program = null;

    var lastUpdateTime = (new Date).getTime();

    //Models Parameters
    var modelRx = 0.0;
    var modelRy = 90.0;
    var modelRz = 0.0;
    var modelS  = 0.5;
    var roadModel = new Array();

    var roadVertices = new Array();
    var roadIndices = new Array();
    var roadTextCoords = new Array();
    var roadNormals = new Array();
    var modelMeshMatIndex = new Array();
    var imageName = new Array();
    var image = new Array();
    var texture = new Array();

    var world = [[]];
    var detailWorld = [[]];
    var floorWorld = [[]];

    
    var UVFileNamePropertyIndex = new Array();
    var diffuseColorPropertyIndex = new Array();
    var specularColorPropertyIndex = new Array();
    var cameraPosUniformLocation;
    var angleLocation;
    var matrixViewLocation;

    var perspectiveMatrix;
    var positionAttributeLocation;
    var normalAttributeLocation;
    var uvAttributeLocation;
    var matrixLocation;
    var matrixWorldLocation;
    var textLocation;
    var matrixViewWorldLocation;
    var currentModel;

    var lightXPositionMatrix = [];
    var lightYPositionMatrix = [];
    var IntensityMatrix = [];

   
function main() {
    
    relativeCameraVector = [(MapWidth/2)*(xSize-modelErrorCorrection),(MapWidth*4)*(ySize-modelErrorCorrection)];
    
    canvas = document.getElementById("c");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }

    positionBuffer = gl.createBuffer();
    uvBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    normalBuffer = gl.createBuffer();
    utils.resizeCanvasToDisplaySize(gl.canvas);
    //added for backface culling
    //gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);

    });
    gl.useProgram(program);

    utils.get_json(assetDir + 'roads/road04.json', function(loadedModel){roadModel[0] = loadedModel;});
    utils.get_json(assetDir + 'roads/road05.json', function(loadedModel){roadModel[1] = loadedModel;});
    utils.get_json(assetDir + 'roads/road03.json', function(loadedModel){roadModel[2] = loadedModel;});
    utils.get_json(assetDir + 'roads/road01.json', function(loadedModel){roadModel[3] = loadedModel;});
    utils.get_json(assetDir + 'roads/road06.json', function(loadedModel){roadModel[4] = loadedModel;});
    utils.get_json(assetDir + 'buildings/building2.json', function(loadedModel){roadModel[5] = loadedModel;});
    utils.get_json(assetDir + 'buildings/house2.json', function(loadedModel){roadModel[6] = loadedModel;});
    utils.get_json(assetDir + 'buildings/building9.json', function(loadedModel){roadModel[7] = loadedModel;});
    utils.get_json(assetDir + 'street_lamp/street_lamp.json', function(loadedModel){roadModel[8] = loadedModel;});
    utils.get_json(assetDir + 'buildings/erba.json', function(loadedModel){roadModel[floorIndex] = loadedModel;});

    perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    normalAttributeLocation = gl.getAttribLocation(program, "a_normal");
    uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    matrixLocation = gl.getUniformLocation(program, "matrix");
    matrixWorldLocation= gl.getUniformLocation(program,"world");
    textLocation = gl.getUniformLocation(program, "u_texture");
    matrixViewWorldLocation = gl.getUniformLocation(program, "viewWorld");
    cameraPosUniformLocation = gl.getUniformLocation(program, "cameraPos");
    angleLocation = gl.getUniformLocation(program, "angle");
    matrixWorldLocation = gl.getUniformLocation(program,"world");
    sliderDirectionalLightIntensity = gl.getUniformLocation(program,"DirectionalLightIntensity");
    sliderDirectionalLightDirection = gl.getUniformLocation(program,"DirectionalLightDirection");
    sliderPointLightG = gl.getUniformLocation(program,"PointLightG");
    sliderPointLightDecayFactor = gl.getUniformLocation(program,"PointLightDecayFactor");
    headlightsActiveLocation = gl.getUniformLocation(program,"headlightsOn");
    lightBufferXLocation = gl.getUniformLocation(program,"streetLightX");
    lightBufferYLocation = gl.getUniformLocation(program,"streetLightY");
    lightBufferIntensity = gl.getUniformLocation(program,"lightsIntensity");

    for (let MapI = 0; MapI < MapWidth; MapI ++){
        floorWorld[MapI] = [];
        world[MapI] = [];
        detailWorld[MapI] = [];
        for (let MapJ = 0; MapJ < MapHeight; MapJ ++){
            
            let currentModelWorld = Map[MapI][MapJ];
            let currentDetailWorld = decorationMap[MapI][MapJ];
            
            if(Map[wrapAround(MapI)][wrapAround(MapJ)] == 1){
                     if(detailMap[wrapAround(MapI)][wrapAround(MapJ)].direction == "E" ||
                        detailMap[wrapAround(MapI)][wrapAround(MapJ)].direction == "W"){
                            modelRx = 90.0;
                            detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ + (ySize/2 - 0.25), 0.0, modelRx, modelRy, modelRz, 1.0);
                     } else {
                         modelRx = 0.0;
                         detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI - (xSize/2 - 0.2), (ySize-modelErrorCorrection) * MapJ, 0.0, modelRx, modelRy, modelRz, 1.0);
                     }

                } else if(decorationMap[wrapAround(MapI)][wrapAround(MapJ)] > 1 &&
                          detailMap[wrapAround(MapI)][wrapAround(MapJ)].rotation != null){
                    modelRx = detailMap[wrapAround(MapI)][wrapAround(MapJ)].rotation;
                }

                if(currentDetailWorld == 5){
                    detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.087, modelRx, modelRy, modelRz, 1.0);
                } else if (currentDetailWorld != 9){
                    detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.001, modelRx, modelRy, modelRz, 1.0);
                }  
            
            world[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, 0.0, modelRx, modelRy, modelRz, 1.0);
            
            floorWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.0011, modelRx, modelRy, modelRz, 1.0);
 
            if (currentDetailWorld > 0){
                if(currentDetailWorld == 5){
                detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.087, modelRx, modelRy, modelRz, 1.0);
                } else {
                detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.001, modelRx, modelRy, modelRz, 1.0);
                }
            }
            
            
            if (!(currentModelWorld < 1 || roadVertices[currentModelWorld-1] != null && roadVertices[currentModelWorld-1].length > 0)){
                
                currentModelWorld--;

                roadVertices[currentModelWorld] = new Array();
                roadIndices[currentModelWorld] = new Array();
                roadTextCoords[currentModelWorld] = new Array();
                roadNormals[currentModelWorld]= new Array();
                for (let j=0; j<roadModel[currentModelWorld].meshes.length; j++){
                    roadVertices[currentModelWorld][j] = roadModel[currentModelWorld].meshes[j].vertices;
                    roadIndices[currentModelWorld][j] = [].concat.apply([], roadModel[currentModelWorld].meshes[j].faces);
                    roadNormals[currentModelWorld][j] = roadModel[currentModelWorld].meshes[j].normals;
                        if(roadModel[currentModelWorld].meshes[j].hasOwnProperty("texturecoords")){
                            roadTextCoords[currentModelWorld][j] = roadModel[currentModelWorld].meshes[j].texturecoords[0];
                        }
                    }
            }
            
            if (!(currentDetailWorld < 5 || roadVertices[currentDetailWorld-1] != null && roadVertices[currentDetailWorld-1].length > 0)){
                
                currentDetailWorld--;

                roadVertices[currentDetailWorld] = new Array();
                roadIndices[currentDetailWorld] = new Array();
                roadTextCoords[currentDetailWorld] = new Array();
                roadNormals[currentDetailWorld] = new Array();
                    for (let j=0; j<roadModel[currentDetailWorld].meshes.length; j++){
                        roadVertices[currentDetailWorld][j] = roadModel[currentDetailWorld].meshes[j].vertices;
                        roadIndices[currentDetailWorld][j] = [].concat.apply([], roadModel[currentDetailWorld].meshes[j].faces);
                        roadNormals[currentDetailWorld][j] = roadModel[currentDetailWorld].meshes[j].normals;
                            if(roadModel[currentDetailWorld].meshes[j].hasOwnProperty("texturecoords")){
                                roadTextCoords[currentDetailWorld][j] = roadModel[currentDetailWorld].meshes[j].texturecoords[0];
                            }
                        }
                }
        }
    }
        
    //loading floor
    roadVertices[floorIndex] = new Array();
    roadIndices[floorIndex] = new Array();
    roadTextCoords[floorIndex] = new Array();
    roadNormals[floorIndex] = new Array();
    for (let j=0; j<roadModel[floorIndex].meshes.length; j++){
        roadVertices[floorIndex][j] = roadModel[floorIndex].meshes[j].vertices;
        roadIndices[floorIndex][j] = [].concat.apply([], roadModel[floorIndex].meshes[j].faces);
        roadNormals[floorIndex][j] = roadModel[floorIndex].meshes[j].normals;
            if(roadModel[floorIndex].meshes[j].hasOwnProperty("texturecoords")){
                roadTextCoords[floorIndex][j] = roadModel[floorIndex].meshes[j].texturecoords[0];
            }
    }
        
    for (let modelIndex = 0; modelIndex < roadVertices.length; modelIndex ++){
        if(roadVertices[modelIndex] == null){
            continue;
        }
                modelMeshMatIndex[modelIndex] = new Array();
                UVFileNamePropertyIndex[modelIndex] = new Array();
                diffuseColorPropertyIndex[modelIndex] = new Array();
                specularColorPropertyIndex[modelIndex] = new Array();
                imageName[modelIndex] = new Array();
                texture[modelIndex] = new Array();
                image[modelIndex] = new Array();

                if(roadVertices[modelIndex]!=null){
                    modelCentererAndScaler(roadVertices[modelIndex]);
                }
                    
                for (let meshIndex = 0; meshIndex < roadModel[modelIndex].meshes.length; meshIndex ++) {

                        modelMeshMatIndex[modelIndex][meshIndex] = roadModel[modelIndex].meshes[meshIndex].materialindex;

                        for (let n = 0; n < roadModel[modelIndex].materials[modelMeshMatIndex[modelIndex][meshIndex]].properties.length; n++) {
                            if (roadModel[modelIndex].materials[modelMeshMatIndex[modelIndex][meshIndex]].properties[n].key == "$tex.file")
                                UVFileNamePropertyIndex[modelIndex][meshIndex] = n;
                            if (roadModel[modelIndex].materials[modelMeshMatIndex[modelIndex][meshIndex]].properties[n].key == "$clr.diffuse")
                                diffuseColorPropertyIndex[modelIndex][meshIndex] = n;
                            if (roadModel[modelIndex].materials[modelMeshMatIndex[modelIndex][meshIndex]].properties[n].key == "$clr.specular")
                                specularColorPropertyIndex[modelIndex][meshIndex] = n;
                        }

                        if (roadModel[modelIndex].materials[modelMeshMatIndex[modelIndex][meshIndex]].properties
                                                    .hasOwnProperty(UVFileNamePropertyIndex[modelIndex][meshIndex])){
                            imageName[modelIndex][meshIndex] = roadModel[modelIndex].materials[modelMeshMatIndex[modelIndex][meshIndex]]
                                                                                .properties[UVFileNamePropertyIndex[modelIndex][meshIndex]].value;
                            texture[modelIndex][meshIndex] = gl.createTexture();
                            gl.bindTexture(gl.TEXTURE_2D, texture[modelIndex][meshIndex]);
                            image[modelIndex][meshIndex] = new Image();
                            image[modelIndex][meshIndex].obj = modelIndex;
                            image[modelIndex][meshIndex].mesh = meshIndex;
                            if(modelIndex < 5){
                                requestCORSIfNotSameOrigin(image[modelIndex][meshIndex], assetDir + "roads/" + imageName[modelIndex][meshIndex]);
                                image[modelIndex][meshIndex].src = assetDir + "roads/" + imageName[modelIndex][meshIndex];
                            } else {
                                requestCORSIfNotSameOrigin(image[modelIndex][meshIndex], assetDir + "buildings/" + imageName[modelIndex][meshIndex]);
                                image[modelIndex][meshIndex].src = assetDir + "buildings/" + imageName[modelIndex][meshIndex];
                            }
                            image[modelIndex][meshIndex].onload = function () {
                                gl.bindTexture(gl.TEXTURE_2D, texture[this.obj][this.mesh]);
                                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
                                gl.generateMipmap(gl.TEXTURE_2D);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                                gl.bindTexture(gl.TEXTURE_2D, null);
                            };
                        }

                }
            }
    
    initInteraction();
    drawScene();
    }

function drawScene() {
    
        //sliders values 
        directionalLightIntensity = document.getElementById("DirectionalLightIntensity").value;
        directionalLightX = document.getElementById("DirectionalLightX").value;
        directionalLightY = document.getElementById("DirectionalLightY").value;
        activeHeadlights  = document.getElementById("SpotlightsActive").value;
        
        pointLightG = document.getElementById("PointLightG").value;
        pointLightDecayFactor = document.getElementById("PointLightDecayFactor").value;
    
    
        // camera speed are set inside keyfunctions
        // now we obtain every draw the camera position by computing the matrices with the speed
        cameraAngle += cameraAngleSpeed;
        cameraElevation += cameraElevationSpeed;

        relativeCameraVector = math.add(relativeCameraVector,math.multiply(cameraSpeedsVector,makeCustomRotMatrix(cameraAngle)));

        //Calculating viewMatrix
        viewMatrix = MakeHorizontalView(relativeCameraVector[0], relativeCameraVector[1], relativeCameraZ, cameraElevation, cameraAngle);
        

        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.clearColor(0.24*directionalLightIntensity, 0.87*directionalLightIntensity, 1.66*directionalLightIntensity, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.ACCUM_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        let xIndexCounter = 0;
    
        for(let i = 0; i < 16; i++){
            lightXPositionMatrix[i] = 0;
            lightYPositionMatrix[i] = 0;
            IntensityMatrix[i] = 0;
        }
    
        let scaledPositionX = Math.floor(relativeCameraVector[0]/xSize);
        let scaledPositionY = Math.floor(relativeCameraVector[1]/ySize);
        
        for (let MapI = scaledPositionX - renderRange; MapI < scaledPositionX + renderRange; MapI++){
            for (let MapJ = scaledPositionY - renderRange; MapJ < scaledPositionY + renderRange; MapJ++){
                    if(decorationMap[wrapAround(MapI)][wrapAround(MapJ)] == 9 && xIndexCounter < 16){
                        lightXPositionMatrix[xIndexCounter] = MapI * xSize;
                        lightYPositionMatrix[xIndexCounter] = MapJ * xSize;
                        IntensityMatrix[xIndexCounter] = 1;
                        xIndexCounter++;
                    }
                }
            }
    
        for (let MapI = scaledPositionX - renderRange; MapI < scaledPositionX + renderRange; MapI++){
            for (let MapJ = scaledPositionY - renderRange; MapJ < scaledPositionY + renderRange; MapJ++){
                    currentModel = Map[wrapAround(MapI)][wrapAround(MapJ)];
                    worldRender(MapI,MapJ);
                    currentModel = decorationMap[wrapAround(MapI)][wrapAround(MapJ)];
                    detailRender(MapI,MapJ);
                    floorRender(MapI,MapJ);
                }
        }
    window.requestAnimationFrame(drawScene);
}

function worldRender(MapI,MapJ){
            if (currentModel > 0){
                if(world[MapI] == null)
                    world[MapI] = [];
                if((MapI >= MapWidth || MapJ >= MapHeight || MapI < 0 || MapI < 0) && world[MapI][MapJ] == null){

                    if(Map[wrapAround(MapI)][wrapAround(MapJ)] == 1){
                         if(detailMap[wrapAround(MapI)][wrapAround(MapJ)].direction == "E" || detailMap[wrapAround(MapI)][wrapAround(MapJ)].direction == "W"){
                             modelRx = 90.0;
                         } else modelRx = 0.0;
                        } else if(Map[wrapAround(MapI)][wrapAround(MapJ)] > 1 && detailMap[wrapAround(MapI)][wrapAround(MapJ)].rotation != null){
                            modelRx = detailMap[wrapAround(MapI)][wrapAround(MapJ)].rotation;
                        }
                    
                    world[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, 0.0, modelRx, modelRy, modelRz, 1.0);
                   }
                    currentModel--;
                    for (let meshIndex = 0; meshIndex < roadModel[currentModel].meshes.length; meshIndex++) {                                             
                        viewWorldMatrix = utils.multiplyMatrices(viewMatrix, world[MapI][MapJ]);
                        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

                        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
                        gl.uniformMatrix4fv(matrixWorldLocation,gl.FALSE, utils.transposeMatrix(world[MapI][MapJ]));
                        gl.uniformMatrix4fv(matrixViewWorldLocation, gl.FALSE, utils.transposeMatrix(viewMatrix));
                        
                        gl.uniformMatrix4fv(lightBufferXLocation, gl.FALSE, lightXPositionMatrix);
                        gl.uniformMatrix4fv(lightBufferYLocation, gl.FALSE, lightYPositionMatrix);
                        gl.uniformMatrix4fv(lightBufferIntensity, gl.FALSE, IntensityMatrix);

                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(positionAttributeLocation);
                        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
                                
                        gl.uniform3fv(cameraPosUniformLocation, new Array(relativeCameraVector[0],relativeCameraVector[1],relativeCameraZ));                
                        gl.uniform1f(angleLocation, cameraAngle);
                
                        gl.uniform3fv(sliderDirectionalLightIntensity, new Array(directionalLightIntensity,directionalLightIntensity,directionalLightIntensity)); 
                        gl.uniform3fv(sliderDirectionalLightDirection, new Array(directionalLightX,directionalLightY,0.0));
                        
                                            
                        gl.uniform1f(sliderPointLightG, pointLightG);
                        gl.uniform1f(sliderPointLightDecayFactor, pointLightDecayFactor);
                        gl.uniform1f(headlightsActiveLocation, activeHeadlights);
              
                        gl.activeTexture(gl.TEXTURE0);
                        gl.bindTexture(gl.TEXTURE_2D, texture[currentModel][meshIndex]);

                        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadNormals[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(normalAttributeLocation);
                        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

                        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadTextCoords[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(uvAttributeLocation);
                        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(roadIndices[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.uniform1i(textLocation, texture[currentModel][meshIndex]);


                        gl.drawElements(gl.TRIANGLES, roadIndices[currentModel][meshIndex].length, gl.UNSIGNED_SHORT, 0);
                    }
                }         
}

function detailRender(MapI,MapJ){
            if (currentModel > 0){
                        
                if(detailWorld[MapI] == null)
                    detailWorld[MapI] = [];
                
                if((MapI >= MapWidth || MapJ >= MapHeight || MapI < 0 || MapI < 0) && detailWorld[MapI][MapJ] == null){

                    if(Map[wrapAround(MapI)][wrapAround(MapJ)] == 1){
                             if(detailMap[wrapAround(MapI)][wrapAround(MapJ)].direction == "E" ||
                                detailMap[wrapAround(MapI)][wrapAround(MapJ)].direction == "W"){
                                    modelRx = 90.0;
                                    detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ + (ySize/2 - 0.88), 0.0, modelRx, modelRy, modelRz, 1.0);
                             } else {
                                 modelRx = 0.0;
                                 detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI - (xSize/2 - 0.8), (ySize-modelErrorCorrection) * MapJ, -0.087, modelRx, modelRy, modelRz, 1.0);
                             }
                        
                        } else if(decorationMap[wrapAround(MapI)][wrapAround(MapJ)] > 1 &&
                                  detailMap[wrapAround(MapI)][wrapAround(MapJ)].rotation != null){
                            modelRx = detailMap[wrapAround(MapI)][wrapAround(MapJ)].rotation;
                        }
                    
                        if(currentModel == 5){
                            detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.087, modelRx, modelRy, modelRz, 1.0);
                        } else if (currentModel != 9){
                            detailWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.001, modelRx, modelRy, modelRz, 1.0);
                        }   
                   }
                
                    currentModel--;
                    for (let meshIndex = 0; meshIndex < roadModel[currentModel].meshes.length; meshIndex++) {                                             
                        viewWorldMatrix = utils.multiplyMatrices(viewMatrix, detailWorld[MapI][MapJ]);
                        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

                        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
                        gl.uniformMatrix4fv(matrixWorldLocation,gl.FALSE, utils.transposeMatrix(detailWorld[MapI][MapJ]));
                        gl.uniformMatrix4fv(matrixViewWorldLocation, gl.FALSE, utils.transposeMatrix(viewMatrix));
                        gl.uniformMatrix4fv(matrixViewWorldLocation, gl.FALSE, utils.transposeMatrix(viewWorldMatrix));

                        
                        gl.uniformMatrix4fv(lightBufferXLocation, gl.FALSE, lightXPositionMatrix);
                        gl.uniformMatrix4fv(lightBufferYLocation, gl.FALSE, lightYPositionMatrix);
                        gl.uniformMatrix4fv(lightBufferIntensity, gl.FALSE, IntensityMatrix);
                        
                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(positionAttributeLocation);
                        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
                                
                        gl.uniform3fv(cameraPosUniformLocation, new Array(relativeCameraVector[0],relativeCameraVector[1],relativeCameraZ));                
                        gl.uniform1f(angleLocation, cameraAngle);
                
                        gl.uniform3fv(sliderDirectionalLightIntensity, new Array(directionalLightIntensity,directionalLightIntensity,directionalLightIntensity)); 
                        gl.uniform3fv(sliderDirectionalLightDirection, new Array(directionalLightX,directionalLightY,0.0));
                        
                                            
                        gl.uniform1f(sliderPointLightG, pointLightG);
                        gl.uniform1f(sliderPointLightDecayFactor, pointLightDecayFactor);
                        gl.uniform1f(headlightsActiveLocation, activeHeadlights);
              
                        gl.activeTexture(gl.TEXTURE0);
                        gl.bindTexture(gl.TEXTURE_2D, texture[currentModel][meshIndex]);

                        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadNormals[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(normalAttributeLocation);
                        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

                        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadTextCoords[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(uvAttributeLocation);
                        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(roadIndices[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.uniform1i(textLocation, texture[currentModel][meshIndex]);


                        gl.drawElements(gl.TRIANGLES, roadIndices[currentModel][meshIndex].length, gl.UNSIGNED_SHORT, 0);
                    }
                }         
}

function floorRender(MapI,MapJ){
    if((MapI >= MapWidth || MapJ >= MapHeight || MapI < 0 || MapI < 0) && floorWorld[MapI][MapJ] == null)
                    floorWorld[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, -0.0011, modelRx, modelRy, modelRz, 1.0);
        for (let meshIndex = 0; meshIndex < roadModel[floorIndex].meshes.length; meshIndex++) {                                             
            
            viewWorldMatrix = utils.multiplyMatrices(viewMatrix, floorWorld[MapI][MapJ]);
            projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
            gl.uniformMatrix4fv(matrixWorldLocation,gl.FALSE, utils.transposeMatrix(floorWorld[MapI][MapJ]));
            gl.uniformMatrix4fv(matrixViewWorldLocation, gl.FALSE, utils.transposeMatrix(viewMatrix));
            gl.uniformMatrix4fv(matrixViewWorldLocation, gl.FALSE, utils.transposeMatrix(viewWorldMatrix));

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[floorIndex][meshIndex]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

            gl.uniform3fv(cameraPosUniformLocation, new Array(relativeCameraVector[0],relativeCameraVector[1],relativeCameraZ));                
            gl.uniform1f(angleLocation, cameraAngle);

            gl.uniform3fv(sliderDirectionalLightIntensity, new Array(directionalLightIntensity,directionalLightIntensity,directionalLightIntensity)); 
            gl.uniform3fv(sliderDirectionalLightDirection, new Array(directionalLightX,directionalLightY,0.0));

            gl.uniform1f(sliderPointLightG, pointLightG);
            gl.uniform1f(sliderPointLightDecayFactor, pointLightDecayFactor);
            gl.uniform1f(headlightsActiveLocation, activeHeadlights);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture[floorIndex][meshIndex]);

            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadNormals[floorIndex][meshIndex]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(normalAttributeLocation);
            gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadTextCoords[floorIndex][meshIndex]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(uvAttributeLocation);
            gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(roadIndices[floorIndex][meshIndex]), gl.STATIC_DRAW);
            gl.uniform1i(textLocation, texture[floorIndex][meshIndex]);


            gl.drawElements(gl.TRIANGLES, roadIndices[floorIndex][meshIndex].length, gl.UNSIGNED_SHORT, 0);     
        }
}

function MakeHorizontalView(cx, cy, cz, elev, ang) {
	// Creates in {out} a view matrix. The camera is centerd in ({cx}, {cy}, {cz}).
	// It looks {ang} degrees on Z axis, and {elev} degrees on the x axis.

		let T = [];
		let Rx = [];
		let Ry = [];
		let tmp = [];
		let out = [];

		T =  utils.MakeTranslateMatrix(-cx, -cy, -cz);
		Rx = utils.MakeRotateXMatrix(-elev);
		Ry = utils.MakeRotateZMatrix(-ang);

		tmp = utils.multiplyMatrices(Ry, T);
		out = utils.multiplyMatrices(Rx, tmp);
    
		return out;
	}

function makeCustomRotMatrix(rotAngle){
   return [[ Math.cos(rotAngle*Math.PI/180), -Math.sin(rotAngle*Math.PI/180)],
           [Math.sin(rotAngle*Math.PI/180), Math.cos(rotAngle*Math.PI/180)]];
}

function initInteraction(){

    var keyFunctionDown =function(e) {

      if (e.keyCode == 37) {  // Left arrow
        //cx-=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([-cameraDelta,0],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[0] = -speedFactor*cameraDelta;
      }
      if (e.keyCode == 39) {  // Right arrow
        //cx+=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([cameraDelta,0],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[0] = speedFactor*cameraDelta;
      }
      if (e.keyCode == 38) {  // Up arrow
        //cz-=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([0,cameraDelta],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[1] = speedFactor*cameraDelta;
      }
      if (e.keyCode == 40) {  // Down arrow
        //cz+=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([0,-cameraDelta],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[1] = -speedFactor*cameraDelta;

      }

      if (e.keyCode == 65) {  // a
        //cameraAngle-=cameraDelta*10.0;
          cameraAngleSpeed = -cameraDelta*100.0;
      }
      if (e.keyCode == 68) {  // d
        //cameraAngle+=cameraDelta*10.0;
          cameraAngleSpeed = cameraDelta*100.0;
      }
      if (e.keyCode == 87) {  // w
        //cameraElevation+=cameraDelta*10.0;
          cameraElevationSpeed = cameraDelta*100.0;
      }
      if (e.keyCode == 83) {  // s
        //cameraElevation-=cameraDelta*10.0;
          cameraElevationSpeed = -cameraDelta*100.0;
      }
    }
    //'window' is a JavaScript object (if "canvas", it will not work)
    window.addEventListener("keydown", keyFunctionDown, false);

    var keyFunctionUp =function(e) {

      if (e.keyCode == 37) {  // Left arrow
        //cx-=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([-cameraDelta,0],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[0] = 0;
      }
      if (e.keyCode == 39) {  // Right arrow
        //cx+=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([cameraDelta,0],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[0] = 0;
      }
      if (e.keyCode == 38) {  // Up arrow
        //cz-=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([0,cameraDelta],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[1] = 0;
      }
      if (e.keyCode == 40) {  // Down arrow
        //cz+=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([0,-cameraDelta],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[1] = 0;

      }
      if (e.keyCode == 65) {  // a
        //cameraAngle-=cameraDelta*10.0;
          cameraAngleSpeed = 0;
      }
      if (e.keyCode == 68) {  // d
        //cameraAngle+=cameraDelta*10.0;
          cameraAngleSpeed = 0;
      }
      if (e.keyCode == 87) {  // w
        //cameraElevation+=cameraDelta*10.0;
          cameraElevationSpeed = 0;
      }
      if (e.keyCode == 83) {  // s
        //cameraElevation-=cameraDelta*10.0;
          cameraElevationSpeed = 0;
      }
    }
    //'window' is a JavaScript object (if "canvas", it will not work)
    window.addEventListener("keyup", keyFunctionUp, false);
  }

function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}

function modelCentererAndScaler(model){
    let minX = 100;
    let minZ = 100;
    let maxX = -100;
    let maxZ = -100;
    for (let i = 0; i < model.length; i++){
        for (let j = 0; j < model[i].length; j++){
            if(minX > model[i][j])
                minX = model[i][j];
            if(maxX < model[i][j])
                maxX = model[i][j];
            j++;
            j++;
            if(minZ > model[i][j])
                minZ = model[i][j];
            if(maxZ < model[i][j])
                maxZ = model[i][j];
        }
    }
    let offsetX = -(minX+maxX)/2;
    let offsetZ = -(minZ+maxZ)/2;
    let xRateo = (maxX-minX)/xSize;
    let zRateo = (maxZ-minZ)/ySize;
    let yRateo = Math.min(xRateo,zRateo);
    if(model == roadVertices[4]){
        xRateo = (maxX-minX)/(xSize*0.5);
        zRateo = (maxZ-minZ)/(ySize*0.5);
    }
    if(roadVertices.indexOf(model) > 4 && model!=roadVertices[floorIndex] && model != roadVertices[8]){
        xRateo = (maxX-minX)/(xSize * 0.9);
        zRateo = (maxZ-minZ)/(ySize * 0.9);
        yRateo = Math.min(xRateo,zRateo);
    }
    
    if(model == roadVertices[8]){
        xRateo = 1;
        zRateo = 1;
        yRateo = 1;
    }
    for (let i = 0; i < model.length; i++){
        for (let j = 0; j < model[i].length; j++){
            model[i][j] += offsetX;
            model[i][j] /= xRateo;
            j++;
            //added to scale buldings correctly
            model[i][j] /= yRateo;
            j++;
            model[i][j] += offsetZ;
            model[i][j] /= zRateo;
            }
    }
}