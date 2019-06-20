function main() {

    var shaderDir = "http://127.0.0.1:8887/shaders/"
    var baseDir = "http://127.0.0.1:8887/"
    var program = null;

    var lastUpdateTime = (new Date).getTime();

    //Cube parameters
    var cubeRx = 0.0;
    var cubeRy = 0.0;
    var cubeRz = 0.0;
    var cubeS  = 0.5;
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

    world[0] = utils.MakeWorld(0.0, 0.0, 0.0, cubeRx, 90, cubeRz, 1.0);
    world[1] = utils.MakeWorld(0.0, 1.0, 0.0, cubeRx, 90, cubeRz, 1.0);


    var UVFileNamePropertyIndex = new Array();
    var diffuseColorPropertyIndex = new Array();
    var specularColorPropertyIndex = new Array();

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }
    for(let i=0; i<2; i++){
        vaos[i] = gl.createVertexArray();
    }

    var positionBuffer = gl.createBuffer();
    var uvBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    utils.loadFiles([shaderDir + 'vs.glsl', shaderDir + 'fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        program = utils.createProgram(gl, vertexShader, fragmentShader);

    });
    gl.useProgram(program);

    utils.get_json(baseDir + 'road02.json', function(loadedModel){roadModel[0] = loadedModel;});
    utils.get_json(baseDir + 'road01.json', function(loadedModel){roadModel[1] = loadedModel;});

    for (let i=0; i<2; i++) {
        roadVertices[i] = roadModel[i].meshes[0].vertices;
        roadIndices[i] = [].concat.apply([], roadModel[i].meshes[0].faces);
        roadTextCoords[i] = roadModel[i].meshes[0].texturecoords[0];
    }

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var textLocation = gl.getUniformLocation(program, "u_texture");

    var perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    var viewMatrix = utils.MakeView(1.5, 0.0, 3.0, 0.0, -30.0);

    for(let i=0; i<2; i++){

        console.log(roadVertices[i]);

        meshMatIndex[i] = roadModel[i].meshes[0].materialindex;

        for (n = 0; n < roadModel[i].materials[meshMatIndex[i]].properties.length; n++){
            if(roadModel[i].materials[meshMatIndex[i]].properties[n].key == "$tex.file") UVFileNamePropertyIndex[i] = n;
            if(roadModel[i].materials[meshMatIndex[i]].properties[n].key == "$clr.diffuse") diffuseColorPropertyIndex[i] = n;
            if(roadModel[i].materials[meshMatIndex[i]].properties[n].key == "$clr.specular") specularColorPropertyIndex[i] = n;
        }

        imageName[i] = roadModel[i].materials[meshMatIndex[i]].properties[UVFileNamePropertyIndex[i]].value;



        texture[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture[i]);

        image[i] = new Image();
        image[i].num = i;

        requestCORSIfNotSameOrigin(image[i], baseDir + imageName);
        image[i].src = baseDir + imageName[i];


        image[i].onload= function() {
            gl.bindTexture(gl.TEXTURE_2D, texture[this.num]);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
                gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
        };

    }

    drawScene();

    function animate(){
        var currentTime = (new Date).getTime();
        if(lastUpdateTime){
            var deltaC = (30 * (currentTime - lastUpdateTime)) / 1000.0;
            cubeRx += 0;
            cubeRy -= 0;
            cubeRz += 0;
        }

        worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, cubeRx, 67, cubeRz, 1.0);

        lastUpdateTime = currentTime;
    }

    function drawScene() {
        for (let i=0; i<2; i++) {
            animate();

            utils.resizeCanvasToDisplaySize(gl.canvas);
            gl.clearColor(0.85, 0.85, 0.85, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, world[i]);
            var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));


            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[i]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);


            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadTextCoords[i]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(uvAttributeLocation);
            gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(roadIndices[i]), gl.STATIC_DRAW);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(textLocation, texture[i]);

            gl.drawElements(gl.TRIANGLES, roadIndices[i].length, gl.UNSIGNED_SHORT, 0);
        }

        window.requestAnimationFrame(drawScene);

    }
}

function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}

main();

