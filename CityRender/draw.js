    //Camera Parameters
    var relativeCameraVector = [0,3];
    var relativeCameraZ = 0.2;
    var cameraElevation = 90.0;
    var cameraAngle = 0.0;
    var cameraDelta = 0.01;

    var cameraSpeedsVector = [0.0,0.0];
    var cameraAngleSpeed = 0.0;
    var cameraElevationSpeed = 0.0;


    function main() {

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
    var vaos = new Array();

    var roadVertices = new Array();
    var roadIndices = new Array();
    var roadTextCoords = new Array();
    var modelMeshMatIndex = new Array();

    var imageName = new Array();

    var image = new Array();

    var texture = new Array();

    var world = new Array();

    world[0] = utils.MakeWorld(0.0, 1.145, 0.0, modelRx, modelRy, modelRz, 1.0);
    world[1] = utils.MakeWorld(0.0, 3.43, 0.0, modelRx, modelRy, modelRz, 1.0);
    world[2] = utils.MakeWorld(0.0, 5.72, 0.0, modelRx, modelRy, modelRz, 1.0);

    
    var UVFileNamePropertyIndex = new Array();
    var diffuseColorPropertyIndex = new Array();
    var specularColorPropertyIndex = new Array();

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }
    for(let i=0; i<world.length; i++){
        vaos[i] = gl.createVertexArray();
    }

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

    utils.get_json(assetDir + 'roads/road03.json', function(loadedModel){roadModel[0] = loadedModel;});
    utils.get_json(assetDir + 'roads/road04.json', function(loadedModel){roadModel[1] = loadedModel;});
    utils.get_json(assetDir + 'roads/road01.json', function(loadedModel){roadModel[2] = loadedModel;});

    for (let i=0; i<world.length; i++) {
        roadVertices[i] = new Array();
        roadIndices[i] = new Array();
        roadTextCoords[i] = new Array();
        for(let j=0; j<roadModel[i].meshes.length; j++){
            roadVertices[i][j] = roadModel[i].meshes[j].vertices;
            roadIndices[i][j] = [].concat.apply([], roadModel[i].meshes[j].faces);
            if(roadModel[i].meshes[j].hasOwnProperty("texturecoords"))
                roadTextCoords[i][j] = roadModel[i].meshes[j].texturecoords[0];
        }

    }

    var perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var textLocation = gl.getUniformLocation(program, "u_texture");

    for(let modelIndex = 0; modelIndex < world.length; modelIndex ++){
        modelMeshMatIndex[modelIndex] = new Array();
        UVFileNamePropertyIndex[modelIndex] = new Array();
        diffuseColorPropertyIndex[modelIndex] = new Array();
        specularColorPropertyIndex[modelIndex] = new Array();
        imageName[modelIndex] = new Array();
        texture[modelIndex] = new Array();
        image[modelIndex] = new Array();
        
        
        modelSizeCalculator(roadVertices[modelIndex]);
        
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

    var positionBuffer;
    var uvBuffer;
    var indexBuffer;
    initInteraction();
    drawScene();

    function drawScene() {
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


        
        for (let modelIndex = 0; modelIndex < world.length; modelIndex++) {
            let currentModel = modelIndex;
            for (let meshIndex = 0; meshIndex < roadModel[currentModel].meshes.length; meshIndex++) {

                let viewWorldMatrix = utils.multiplyMatrices(viewMatrix, world[currentModel]);
                let projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);


                gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

                let positionBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[currentModel][meshIndex]), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(positionAttributeLocation);
                gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture[modelIndex][meshIndex]);

                let uvBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadTextCoords[currentModel][meshIndex]), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(uvAttributeLocation);
                gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);


                let indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(roadIndices[currentModel][meshIndex]), gl.STATIC_DRAW);
                gl.uniform1i(textLocation, texture[currentModel][meshIndex]);


                gl.drawElements(gl.TRIANGLES, roadIndices[currentModel][meshIndex].length, gl.UNSIGNED_SHORT, 0);
            }
        }

        window.requestAnimationFrame(drawScene);


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

function modelSizeCalculator(model){
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
    console.log(minX,maxX,minZ,maxZ);
    let offsetX = -(minX+maxX)/2;
    let offsetZ = -(minZ+maxZ)/2;
    for(let i = 0; i < model.length; i++){
        for(let j = 0; j < model[i].length; j++){
            model[i][j] += offsetX;
            j++;
            j++;
            model[i][j] += offsetZ;
            }
    }
}

main();

