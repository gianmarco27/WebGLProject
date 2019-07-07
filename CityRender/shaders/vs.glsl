#version 300 es

in vec3 a_position;
in vec2 a_uv;
in vec3 a_normal;

out vec2 uvFS;
out vec3 Normal;
out vec3 FragPos;

out vec3 PixPos;
out vec3 eyeVec;

uniform mat4 matrix;
uniform mat4 world;
uniform mat4 viewWorld;

void main() {
  uvFS = a_uv;
  vec3 ePosition= vec3 (viewWorld * vec4(a_position,1.0));
  gl_Position = matrix * vec4(a_position,1.0);
  FragPos= vec3(world * vec4(a_position, 1.0));
  Normal = mat3(transpose(inverse(world))) * a_normal;
  eyeVec = vec3(-ePosition);
  PixPos =  vec3(ePosition);

} 
