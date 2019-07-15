#version 300 es

in vec3 a_position;
in vec2 a_uv;
in vec3 a_normal;


out vec2 uvFS;
out vec3 fs_norm;
out vec3 fs_pos;

uniform mat4 matrix; 
uniform mat4 world;
uniform mat4 view;
uniform mat4 viewWorld;


void main() {

  uvFS = a_uv;
  fs_norm = mat3(transpose(inverse(world))) * a_normal ; 
  fs_pos = vec3(world * vec4(a_position, 1.0));
  gl_Position = matrix * vec4(a_position,1.0);

}
