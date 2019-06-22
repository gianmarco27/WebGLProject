    //Camera Parameters
    var relativeCameraVector = [0,3];
    var relativeCameraZ = 0.1;
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
    var meshMatIndex = new Array();

    var imageName = new Array();

    var image = new Array();

    var texture = new Array();

    var world = new Array();

    world[0] = utils.MakeWorld(0.0, 2.0, 0.0, modelRx, modelRy, modelRz, 1.0);
    world[1] = utils.MakeWorld(-0.05, 5.4, 0.0, modelRx, modelRy, modelRz, 1.0);
    world[2] = utils.MakeWorld(0.0, 7.7, 0.0, modelRx, modelRy, modelRz, 1.0);

    
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
    utils.get_json(assetDir + 'roads/road01.json', function(loadedModel){roadModel[1] = loadedModel;});
    utils.get_json(assetDir + 'roads/road04.json', function(loadedModel){roadModel[2] = loadedModel;});
    
    for (let i=0; i<world.length; i++) {
        roadVertices[i] = roadModel[i].meshes[0].vertices;
        roadIndices[i] = [].concat.apply([], roadModel[i].meshes[0].faces);
        roadTextCoords[i] = roadModel[i].meshes[0].texturecoords[0];
        console.log(i)
    }
    

    var perspectiveMatrix = utils.MakePerspective(60, gl.canvas.width/gl.canvas.height, 0.1, 100.0);

    for(let i=0; i<world.length; i++){

        meshMatIndex[i] = roadModel[i].meshes[0].materialindex;

        for (let n = 0; n < roadModel[i].materials[meshMatIndex[i]].properties.length; n++){
            if(roadModel[i].materials[meshMatIndex[i]].properties[n].key == "$tex.file") UVFileNamePropertyIndex[i] = n;
            if(roadModel[i].materials[meshMatIndex[i]].properties[n].key == "$clr.diffuse") diffuseColorPropertyIndex[i] = n;
            if(roadModel[i].materials[meshMatIndex[i]].properties[n].key == "$clr.specular") specularColorPropertyIndex[i] = n;
        }

        imageName[i] = roadModel[i].materials[meshMatIndex[i]].properties[UVFileNamePropertyIndex[i]].value;

        
        texture[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture[i]);

        image[i] = new Image();
        image[i].num = i;

        requestCORSIfNotSameOrigin(image[i], assetDir + "roads/" + imageName);
        image[i].src = assetDir + "roads/" + imageName[i];

        var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
        var matrixLocation = gl.getUniformLocation(program, "matrix");
        var textLocation = gl.getUniformLocation(program, "u_texture");

        image[i].onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture[this.num]);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
        };

    }

    var positionBuffer = gl.createBuffer();
    var uvBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
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
        
        for (let j=0; j<world.length; j++) {

            var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, world[j]);
            var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);
    
            
            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[j]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);


            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadTextCoords[j]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(uvAttributeLocation);
            gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(roadIndices[j]), gl.STATIC_DRAW);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(textLocation, texture[j]);

            gl.drawElements(gl.TRIANGLES, roadIndices[j].length, gl.UNSIGNED_SHORT, 0);
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
      //Z-position
      if (e.keyCode == 107) { // Add
        relativeCameraZ+=cameraDelta;
      }
      if (e.keyCode == 109) { // Subtract
        relativeCameraZ-=cameraDelta;
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
      //Z-position
      if (e.keyCode == 107) { // Add
        relativeCameraZ+=cameraDelta;
      }
      if (e.keyCode == 109) { // Subtract
        relativeCameraZ-=cameraDelta;
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

main();

