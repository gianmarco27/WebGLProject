#version 300 es

in vec3 a_position;
in vec2 a_uv;
in vec3 a_normal;

out vec2 uvFS;
out vec3 Normal;
out vec3 FragPos;

uniform mat4 matrix;
uniform mat4 model;

void main() {
  uvFS = a_uv;
  gl_Position = matrix * vec4(a_position,1.0);
  FragPos= vec3(model* vec4(a_position, 1.0));
  Normal = a_normal;  
} 


//TODO contributo rotazione nelle normali
//TODO Spotlight fari





