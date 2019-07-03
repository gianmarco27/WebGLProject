#version 300 es

precision mediump int;
precision mediump float;

in vec2 uvFS;
in vec3 Normal;
in vec3 lightDir;
out vec4 outColor;
uniform sampler2D u_texture;


//vec3 lightPos= vec3(100.0f,7.0f,10.0f);
vec3 lightColor = vec3(2.0f,2.0f,2.1f);
vec3 objectColor = vec3(1.0f,1.0f,1.0f);
//vec3 FragPos = vec3(1.0f,1.0f,1.0f);



//distance = 13
float constant = 1.0;
float linear = 0.35;
float quadratic = 0.44;


void main() {

    float ambientStrength = 0.7;
    vec3 ambient = ambientStrength * lightColor;
    vec3 norm = normalize(Normal);
    vec3 lightDirNorm = normalize(lightDir);
    float diff = max(dot(norm, lightDirNorm),0.0);
    vec3 diffuse = diff * lightColor ;
    
    
   float distance = length(lightDir);
   float attenuation = 1.0 / (constant + linear * distance + 
    		    quadratic * (distance * distance));    
                
   ambient  *= attenuation; 
   diffuse  *= attenuation;
    

    vec3 result =  (ambient + diffuse) * objectColor;
    vec4 texColor= texture(u_texture, uvFS);
    if(texColor.a < 0.5)  // cut to 0.5 considering objects are only visible (1.0) or invisible (0.0) 
        discard;
    outColor = vec4(result, 1.0)* texColor;
}



/* distance = 7
float constant = 1.0;
float linear = 0.7;
float quadratic = 1.8;

*/

/* distance = 20
float constant = 1.0;
float linear = 0.22;
float quadratic = 0.20;
*/


/* distance = 32
float constant = 1.0;
float linear = 0.14;
float quadratic = 0.07;
*/


/* distance=200
float constant = 1.0;
float linear = 0.022;
float quadratic = 0.0019;
*/
