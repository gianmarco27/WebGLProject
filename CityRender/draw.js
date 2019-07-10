    var gl;
    var canvas;
    var positionBuffer;
    var uvBuffer;
    var indexBuffer;
    var normalBuffer;

//Camera Parameters
    var relativeCameraVector = [30,0];
    var relativeCameraZ = 0.2;
    var cameraElevation = 90.0;
    var cameraAngle = 0.0;
    var cameraDelta = 0.01;

    var cameraSpeedsVector = [0.0,0.0];
    var cameraAngleSpeed = 0.0;
    var cameraElevationSpeed = 0.0;

    var xSize = 2.30;
    var ySize = 2.30;
    var modelErrorCorrection = 0.027;
    var renderRange = 30;
    var lightAngle = 90;

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

    
    var UVFileNamePropertyIndex = new Array();
    var diffuseColorPropertyIndex = new Array();
    var specularColorPropertyIndex = new Array();


    var perspectiveMatrix;
    var positionAttributeLocation;
    var normalAttributeLocation;
    var uvAttributeLocation;
    var matrixLocation;
    var matrixWorldLocation;
    var textLocation;
    var matrixViewWorldLocation;
    var currentModel;

function main() {
    
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

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);

    });
    gl.useProgram(program);

    utils.get_json(assetDir + 'roads/road02.json', function(loadedModel){roadModel[0] = loadedModel;});
    utils.get_json(assetDir + 'roads/road05.json', function(loadedModel){roadModel[1] = loadedModel;});
    utils.get_json(assetDir + 'roads/road03.json', function(loadedModel){roadModel[2] = loadedModel;});
    utils.get_json(assetDir + 'roads/road01.json', function(loadedModel){roadModel[3] = loadedModel;});

    perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    normalAttributeLocation = gl.getAttribLocation(program, "a_normal");
    uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    matrixLocation = gl.getUniformLocation(program, "matrix");
    matrixWorldLocation= gl.getUniformLocation(program,"world");
    textLocation = gl.getUniformLocation(program, "u_texture");
    matrixViewWorldLocation = gl.getUniformLocation(program, "viewWorld");

    for(let MapI = 0; MapI < MapWidth; MapI ++){
        world[MapI] = [];
        for(let MapJ = 0; MapJ < MapHeight; MapJ ++){
            
            let currentModelWorld = Map[MapI][MapJ];

            if(Map[MapI][MapJ] == 1){
             if(detailMap[MapI][MapJ].direction == "E" || detailMap[MapI][MapJ].direction == "W"){
                 modelRx = 90.0;
             } else modelRx = 0.0;
            } else if(Map[MapI][MapJ] > 1){
                modelRx = detailMap[MapI][MapJ].rotation;
            }
            
            world[MapI][MapJ] = utils.MakeWorld((xSize-modelErrorCorrection) * MapI, (ySize-modelErrorCorrection) * MapJ, 0.0, modelRx, modelRy, modelRz, 1.0);
            
            if (currentModelWorld < 1 || roadVertices[currentModelWorld-1] != null && roadVertices[currentModelWorld-1].length > 0)
                continue;
            currentModelWorld--;
                    
            roadVertices[currentModelWorld] = new Array();
            roadIndices[currentModelWorld] = new Array();
            roadTextCoords[currentModelWorld] = new Array();
            roadNormals[currentModelWorld]= new Array();
                for(let j=0; j<roadModel[currentModelWorld].meshes.length; j++){
                    roadVertices[currentModelWorld][j] = roadModel[currentModelWorld].meshes[j].vertices;
                    roadIndices[currentModelWorld][j] = [].concat.apply([], roadModel[currentModelWorld].meshes[j].faces);
                    roadNormals[currentModelWorld][j] = roadModel[currentModelWorld].meshes[j].normals;
                        if(roadModel[currentModelWorld].meshes[j].hasOwnProperty("texturecoords")){
                            roadTextCoords[currentModelWorld][j] = roadModel[currentModelWorld].meshes[j].texturecoords[0];
                        }
                    }
                }
    }      
    
    for(let modelIndex = 0; modelIndex < roadVertices.length; modelIndex ++){
                modelMeshMatIndex[modelIndex] = new Array();
                UVFileNamePropertyIndex[modelIndex] = new Array();
                diffuseColorPropertyIndex[modelIndex] = new Array();
                specularColorPropertyIndex[modelIndex] = new Array();
                imageName[modelIndex] = new Array();
                texture[modelIndex] = new Array();
                image[modelIndex] = new Array();

                if(roadVertices[modelIndex]!=null)
                    modelCentererAndScaler(roadVertices[modelIndex]);

                for(let meshIndex = 0; meshIndex < roadModel[modelIndex].meshes.length; meshIndex ++) {

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
                            requestCORSIfNotSameOrigin(image[modelIndex][meshIndex], assetDir + "roads/" + imageName[modelIndex][meshIndex]);
                            image[modelIndex][meshIndex].src = assetDir + "roads/" + imageName[modelIndex][meshIndex];

                            image[modelIndex][meshIndex].onload = function () {
                                gl.bindTexture(gl.TEXTURE_2D, texture[this.obj][this.mesh]);
                                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                                gl.bindTexture(gl.TEXTURE_2D, null);
                            };
                        }

                }
            }

    initInteraction();
    drawScene();
    }

function drawScene() {
    
        lightAngle = document.getElementById("LightRange").value;
        // camera speed are set inside keyfunctions
        // now we obtain every draw the camera position by computing the matrices with the speed
        cameraAngle += cameraAngleSpeed;
        cameraElevation += cameraElevationSpeed;

        relativeCameraVector = math.add(relativeCameraVector,math.multiply(cameraSpeedsVector,makeCustomRotMatrix(cameraAngle)));

        //Calculating viewMatrix
        viewMatrix = MakeHorizontalView(relativeCameraVector[0], relativeCameraVector[1], relativeCameraZ, cameraElevation, cameraAngle);

        utils.resizeCanvasToDisplaySize(gl.canvas);
        gl.clearColor(0.85, 0.85, 0.85, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);



        for(let MapI = 0; MapI < renderRange; MapI ++){
            for(let MapJ = 0; MapJ < renderRange; MapJ ++){
                currentModel = Map[MapI][MapJ];
                if (currentModel > 0){
                    currentModel--;
                    for (let meshIndex = 0; meshIndex < roadModel[currentModel].meshes.length; meshIndex++) {
                        viewWorldMatrix = utils.multiplyMatrices(viewMatrix, world[MapI][MapJ]);
                        projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);


                        gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));
                        gl.uniformMatrix4fv(matrixWorldLocation,gl.FALSE, utils.transposeMatrix(world[MapI][MapJ]));
                        gl.uniformMatrix4fv(matrixViewWorldLocation, gl.FALSE, utils.transposeMatrix(viewWorldMatrix));

                        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[currentModel][meshIndex]), gl.STATIC_DRAW);
                        gl.enableVertexAttribArray(positionAttributeLocation);
                        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

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
        }
    window.requestAnimationFrame(drawScene);
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
          cameraSpeedsVector[0] = -cameraDelta;
      }
      if (e.keyCode == 39) {  // Right arrow
        //cx+=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([cameraDelta,0],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[0] = cameraDelta;
      }
      if (e.keyCode == 38) {  // Up arrow
        //cz-=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([0,cameraDelta],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[1] = cameraDelta;
      }
      if (e.keyCode == 40) {  // Down arrow
        //cz+=cameraDelta;
        //relativeCameraVector = math.add(relativeCameraVector,math.multiply([0,-cameraDelta],makeCustomRotMatrix(cameraAngle)));
          cameraSpeedsVector[1] = -cameraDelta;

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
    for(let i = 0; i < model.length; i++){
        for(let j = 0; j < model[i].length; j++){
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
    
    for(let i = 0; i < model.length; i++){
        for(let j = 0; j < model[i].length; j++){
            model[i][j] += offsetX;
            model[i][j] *= xRateo;
            j++;
            j++;
            model[i][j] += offsetZ;
            model[i][j] *= zRateo;
            }
    }
}
