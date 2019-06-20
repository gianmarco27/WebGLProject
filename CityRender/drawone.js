function main() {

    var shaderDir = new URL(origin) + "CityRender/shaders/";
    var baseDir = new URL(origin) + "CityRender/";
    var assetDir = new URL(origin) + "CityRender/assets/";
    var program = null;

    var lastUpdateTime = (new Date).getTime();

    //Cube parameters
    var cubeRx = 0.0;
    var cubeRy = 90.0;
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

    world[0] = utils.MakeWorld(0.0, 1.0, 0.0, cubeRx, cubeRy, cubeRz, 1.0);
    world[1] = utils.MakeWorld(0.0, 4.5, 0.0, cubeRx, cubeRy, cubeRz, 1.0);
    world[2] = utils.MakeWorld(0.0, 7.0, 0.0, cubeRx, cubeRy, cubeRz, 1.0);


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
    gl.enable(gl.DEPTH_TEST);

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
    

    var perspectiveMatrix = utils.MakePerspective(90, gl.canvas.width/gl.canvas.height, 0.1, 100.0);
    var viewMatrix = utils.MakeView(0, -1.5, 3.0, 60.0, 0.0);

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
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
            gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
        };

    }

    utils.resizeCanvasToDisplaySize(gl.canvas);
    gl.clearColor(0.85, 0.85, 0.85, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var positionBuffer = gl.createBuffer();
    var uvBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    
    drawScene();

    function drawScene() {
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

function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}

main();

