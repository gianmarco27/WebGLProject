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
    var roadArray;

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl2");
    if (!gl) {
        document.write("GL context not opened");
        return;
    }
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

    var roadArray = new Array();
    var roadVertices = new Array();
    var roadIndexes = new Array();
    var roadTextCoords = new Array();
    var vaos = new Array;
    var meshMatIndex = new Array();
    var UVFileNamePropertyIndex = new Array();
    var diffuseColorPropertyIndex = new Array();
    var specularColorPropertyIndex = new Array();
    var imageName = new Array();



    utils.get_json(baseDir + 'road01.json', function(loadedModel){
        roadArray[0] = loadedModel;});


    utils.get_json(baseDir + 'road04.json', function(loadedModel){
        roadArray[1] = loadedModel;});

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
    var matrixLocation = gl.getUniformLocation(program, "matrix");
    var textLocation = gl.getUniformLocation(program, "u_texture");
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    var image = new Array();
    for (let i=0; i<2; i++){
        image[i] = new Image();
    }

    var perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    var viewMatrix = utils.MakeView(1.5, 0.0, 3.0, 0.0, -30.0);

    for (let i=0; i<2; i++) {
        roadVertices[i] = roadArray[i].meshes[0].vertices;
        roadIndexes[i] = [].concat.apply([], roadArray[i].meshes[0].faces);
        roadTextCoords[i] = roadArray[i].meshes[0].texturecoords[0];
    }



    for(let i=0; i<2; i++) {
        vaos[i] = gl.createVertexArray();
        gl.bindVertexArray(vaos[i]);

        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadVertices[i]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        var uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roadTextCoords[i]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(uvAttributeLocation);
        gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(roadIndexes[i]), gl.STATIC_DRAW);

        meshMatIndex[i] = roadArray[i].meshes[0].materialindex;

        for (n = 0; n < roadArray[i].materials[meshMatIndex[i]].properties.length; n++) {
            if (roadArray[i].materials[meshMatIndex[i]].properties[n].key == "$tex.file") UVFileNamePropertyIndex[i] = n;
            if (roadArray[i].materials[meshMatIndex[i]].properties[n].key == "$clr.diffuse") diffuseColorPropertyIndex[i] = n;
            if (roadArray[i].materials[meshMatIndex[i]].properties[n].key == "$clr.specular") specularColorPropertyIndex[i] = n;
        }

        imageName[i] = roadArray[i].materials[meshMatIndex[i]].properties[UVFileNamePropertyIndex[i]].value;


        requestCORSIfNotSameOrigin(image[i], baseDir + imageName[i]);
        image[i].src = baseDir + imageName[i];
        image[i].onload = function () {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
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
        worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, cubeRx, 90, cubeRz, 1.0);
        lastUpdateTime = currentTime;
    }

    function drawScene() {
        animate();
        for(let i=0; i<2; i++) {
            utils.resizeCanvasToDisplaySize(gl.canvas);
            gl.clearColor(0.85, 0.85, 0.85, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var viewWorldMatrix = utils.multiplyMatrices(viewMatrix, worldMatrix);
            var projectionMatrix = utils.multiplyMatrices(perspectiveMatrix, viewWorldMatrix);

            gl.uniformMatrix4fv(matrixLocation, gl.FALSE, utils.transposeMatrix(projectionMatrix));

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(textLocation, texture);

            gl.bindVertexArray(vaos[i]);
            gl.drawElements(gl.TRIANGLES, roadIndexes.length, gl.UNSIGNED_SHORT, 0);
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