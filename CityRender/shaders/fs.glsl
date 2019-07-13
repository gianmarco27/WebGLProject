#version 300 es
precision mediump float;
in vec2 uvFS;
in vec3 fs_norm;
in vec3 fs_pos;


out vec4 outColor;

uniform vec3 cameraPos; //cx cy cz
uniform float angle; // rotation angle of camera 
uniform sampler2D u_texture;
uniform vec3 DirectionalLightIntensity; // value from slider
uniform vec3 DirectionalLightDirection; // value from slider
uniform float PointLightG;
uniform float PointLightDecayFactor;
uniform float headlightsOn;
uniform mat4 streetLightX;
uniform mat4 streetLightY;
uniform mat4 lightsIntensity;


vec4 lightColor = vec4(0.3f,0.3f,0.3f,1.0); //directional light
vec4 lightColorP = vec4(1.0f,0.8f,0.5f,1.0); //point light
vec4 lightColorS = vec4(0.7f,0.7f,0.3f,1.0); //spotlight


vec4 ambientLightColor= vec4(0.34f,0.34f,0.34f,1.0); //used only to calculate the ambient contribute 
vec4 diffuseColor; // used to calculate diffColor that will be used in the diffuseLambert
vec4 specularColor; //used to calculate specular phong 



vec4 ambient;
vec4 ambColor;
vec4 diffuse;
vec4 diffColor;
vec4 specular; //TODO

struct DirectionalLight {
    vec3 dir;
    float theta;
    float phi;
    vec4 col;
   
}directLight;

struct PointLight {
   vec3 LPos;
   vec3 dir;
   float LDecay;
   vec4 col;
   float g;
};

PointLight p[16];
float px[16];
float py[16];
float lI[16];


struct SpotLight{
   vec3 LPos;
   float theta;
   float phi;
   float LConeOut; //angolo esterno 
   float LConeIn; //angolo interno 
   float LDecay;
   float g; 
   vec3 dir;
   vec4 col;
}spotLight1,spotLight2;


void main() {
    
//Lights

    int k=0;
    vec4 streetLightCol;
    vec3 streetLightDir;
    
    for(int i=0;i<4;i++){
        for(int j=0;j<4;j++){
            px[k] = streetLightX[i][j];
            py[k] = streetLightY[i][j];
            lI[k] = lightsIntensity[i][j];
            k++;
        }
    }

 //Initialize point light

for(int i=0;i<16;i++){
    p[i].LPos = vec3(px[i],py[i],1.0);
    p[i].g = PointLightG;
    p[i].LDecay = PointLightDecayFactor;
    
    p[i].dir = normalize(p[i].LPos - fs_pos);
    p[i].col = lightColorP * pow(p[i].g / length(p[i].LPos - fs_pos), p[i].LDecay) * lI[i];
    streetLightDir += p[i].dir;
    streetLightCol += p[i].col;
    
}


    

    lightColor = vec4(DirectionalLightIntensity.x, DirectionalLightIntensity.y, DirectionalLightIntensity.z-0.05,1.0);
 
    vec3 normalVec = normalize(fs_norm);
    
    //Initialize direct light
    vec3 LDir = vec3(0.0,0.0,1.0); //direction directional light
   
    
    LDir = vec3(DirectionalLightDirection.x,DirectionalLightDirection.y,1.0);
    
    directLight.dir = LDir;
    directLight.col = lightColor;
    
    
//Setup distance spotlights    
    float offsetL = 30.0; // angular semidistance between the two spotlights
    float R = 0.28;
    
//Initialize spotlight 1
    spotLight1.LConeOut = 25.0;
    spotLight1.LConeIn = 5.0 ;

    vec3 LDirSpot = vec3(0.0,0.0,1.0);

    spotLight1.LPos = vec3(float(R * sin(radians(angle+offsetL))),float(R * cos(radians(angle+offsetL))),1.0);
    spotLight1.LPos.x += cameraPos.x + float(R * sin(radians(angle)));
    spotLight1.LPos.y += cameraPos.y + float(R * cos(radians(angle)));
    spotLight1.LPos.z += cameraPos.z;
    
    float LCosOut = cos(radians(spotLight1.LConeOut / 2.0));
    float LCosIn = cos(radians(spotLight1.LConeIn / 2.0));  //formula used from slide 
    
    spotLight1.dir = normalize(spotLight1.LPos - fs_pos); 
    float CosAngle = dot(spotLight1.dir, LDirSpot); //TODO review
    
    spotLight1.col = lightColorS * pow(spotLight1.g / length(spotLight1.LPos - fs_pos), spotLight1.LDecay) *
						clamp((CosAngle - LCosOut) / (LCosIn - LCosOut), 0.0, 1.0);
                        
                                      
//Initialize spotlight 2
    spotLight2.LConeOut = 25.0;
    spotLight2.LConeIn = 5.0 ;
    vec3 LDirSpot2 = vec3(0.0,0.0,1.0);
    spotLight2.LPos = vec3(float(R * sin(radians(angle-offsetL))),float(R * cos(radians(angle-offsetL))),1.0);
    
    spotLight2.LPos.x += cameraPos.x + float(R * sin(radians(angle)));
    spotLight2.LPos.y += cameraPos.y + float(R * cos(radians(angle)));
    spotLight2.LPos.z += cameraPos.z;

    float LCosOut2 = cos(radians(spotLight2.LConeOut / 2.0));
    float LCosIn2 = cos(radians(spotLight2.LConeIn / 2.0));  //formula used from slide 
    
    spotLight2.dir = normalize(spotLight2.LPos - fs_pos); 
    float CosAngle2 = dot(spotLight2.dir, LDirSpot2); //TODO review
    
    spotLight2.col = lightColorS * pow(spotLight2.g / length(spotLight2.LPos - fs_pos), spotLight2.LDecay) *
						clamp((CosAngle2 - LCosOut2) / (LCosIn2 - LCosOut2), 0.0, 1.0);
                        
       
    
                        
                        
// Final components                    
    vec3 lightDir = directLight.dir + spotLight1.dir * headlightsOn + spotLight2.dir * headlightsOn + streetLightDir;
    vec4 lightCol = directLight.col + spotLight1.col * headlightsOn + spotLight2.col * headlightsOn + streetLightCol;
//Texture color
    vec4 texColor = texture(u_texture, uvFS);
    if(texColor.a < 0.5)  // cut to 0.5 considering objects are only visible (1.0) or invisible (0.0) 
        discard;
    if (texColor != vec4(0.0,0.0,0.0,1.0)){
        ambColor = texColor;
        diffColor = texColor;
    } else {
        ambColor = vec4(1.5,1.5,1.5,1.0);
        diffColor = texColor;
    }
    
    
//Ambient 
     vec4 ambientAmbient = ambientLightColor * ambColor;
//Diffuse 
    vec4 diffuseLambert = lightCol * clamp(dot(normalVec, lightDir),0.0,1.0) * diffColor;
    
//Final output 
    outColor = vec4(clamp(ambientAmbient + diffuseLambert, 0.0, 1.0));

}