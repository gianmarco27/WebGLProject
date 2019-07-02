#version 300 es

precision mediump int;
precision mediump float;

in vec2 uvFS;
in vec3 Normal;
out vec4 outColor;
uniform sampler2D u_texture;


vec3 lightPos= vec3(0.0f,7.0f,10.0f);
vec3 lightColor = vec3(2.3f,2.1f,2.1f);
vec3 objectColor = vec3(0.4f,0.4f,0.4f);
vec3 FragPos = vec3(1.0f,1.0f,1.0f);


void main() {

    float ambientStrength = 0.5;
    vec3 ambient = ambientStrength * lightColor;


    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = dot(norm, lightDir);
    vec3 diffuse = diff * lightColor ;

    vec3 result =  (ambient + diffuse) * objectColor;
    vec4 texColor= texture(u_texture, uvFS);
    if(texColor.a < 0.5)  // cut to 0.5 considering objects are only visible (1.0) or invisible (0.0) 
        discard;
    outColor = vec4(result, 1.0) * texColor;
}
