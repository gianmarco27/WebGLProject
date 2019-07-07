#version 300 es

in vec3 a_position;
in vec2 a_uv;
in vec3 a_normal;


out vec2 uvFS;
out vec3 fs_norm;
out vec3 fs_pos;
out vec3 cameraPos;

//
out vec3 Angle;

uniform mat4 matrix; 
uniform mat4 world;
uniform mat4 view;
uniform mat4 viewWorld;
uniform vec3 CameraPos;

//
uniform vec3 angle;




void main() {

  uvFS = a_uv;
  fs_norm = vec3(inverse(world) * vec4(a_normal,1.0)); 
  fs_pos = vec3(world * vec4(a_position, 1.0));
  cameraPos = CameraPos;
  
  //
  Angle= angle;


  gl_Position = matrix * vec4(a_position,1.0);

}
