#version 300 es

in vec3 a_position;
in vec2 a_uv;
in vec3 a_normal;
out vec2 uvFS;
out vec3 Normal;
out vec3 FragPos;
out vec3 lightDir;

uniform mat4 matrix;
uniform mat4 model;
vec3 lightPos = vec3(0,4,1);
void main() {
  uvFS = a_uv;
  gl_Position = matrix * vec4(a_position,1.0);
  FragPos= vec3(model* vec4(a_position, 1.0));
  lightDir = lightPos - FragPos;
  Normal = a_normal; 
}






/*

float constant = 1.0f;
float linear = 0.09;
float quadratic = 0.032;

*/




/*
#version 300 es

in vec4 a_position;
in vec2 a_uv;
in vec3 a_normal;
out vec2 uvFS;
out vec3 Normal;
out vec3 v_surfaceToLight;
uniform mat4 matrix;
uniform mat4 model;  //(u_world)
vec3 u_lightWorldPosition= vec3(10,10,10);

vec3 FragPos;


void main() {
  uvFS = a_uv;
  gl_Position = matrix * a_position;
  vec3 FragPos= (model * a_position).xyz;
  v_surfaceToLight = u_lightWorldPosition - FragPos;
  Normal = a_normal; 
}
*/