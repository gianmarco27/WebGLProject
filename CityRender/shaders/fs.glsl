#version 300 es
precision mediump float;
in vec2 uvFS;
in vec3 fs_norm;
in vec3 fs_pos;
in vec3 cameraPos;
in vec3 Angle;
out vec4 outColor;

uniform sampler2D u_texture;


vec4 lightColor = vec4(0.3f,0.3f,0.3f,1.0); //directional light
vec4 lightColorP = vec4(1.0f,0.0f,0.0f,1.0); //point light
vec4 lightColorS = vec4(1.0f,1.0f,0.0f,1.0); //spotlight1
vec4 lightColorS2 = vec4(1.0f,1.0f,0.0f,1.0); //spotlight2


vec4 ambientLightColor= vec4(0.34f,0.34f,0.34f,1.0); //used only to calculate the ambient contribute 
vec4 diffuseColor; // used to calculate diffColor that will be used in the diffuseLambert
vec4 specularColor; //used to calculate specular phong 



vec4 ambient;
vec4 ambColor;
vec4 diffuse;
vec4 diffColor;
vec4 specular; 


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
}pointLight; 


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

 
    vec3 normalVec = normalize(fs_norm);
    
    //LIGHTS
    
    //Initialize direct light
    vec3 LDir= vec3(0.0,0.0,0.0); //direction directional light 
    directLight.dir= LDir;
    directLight.col= lightColor;
    

   /* NOT ACTIVE
    //Initialize point light
    pointLight.LPos = vec3(0.0,2.0,1.0);
    pointLight.g=0.5f;
    pointLight.LDecay= 1.0f;
    
    pointLight.dir= normalize(pointLight.LPos - fs_pos);
    pointLight.col= lightColorP * pow(pointLight.g / length(pointLight.LPos - fs_pos), pointLight.LDecay);
    */

    
    //Setup distance spotlights
    
    float offsetL = 20.0; // angular semidistance between the two spotlights
    float R= 0.5;
    
    //Initialize spotlight 1
    spotLight1.LConeOut = 25.0;
    spotLight1.LConeIn = 20.0 ;

    vec3 LDirSpot = vec3(0.0,0.0,1.0);

    
    
    spotLight1.LPos= vec3(float(R * sin(radians(Angle+offsetL))),float(R * cos(radians(Angle+offsetL))),1.0);
    spotLight1.LPos.x += cameraPos.x + float(R * sin(radians(Angle)));
    spotLight1.LPos.y += cameraPos.y + float(R * cos(radians(Angle)));
    spotLight1.LPos.z += cameraPos.z;
    
     
    

    float LCosOut = cos(radians(spotLight1.LConeOut / 2.0));
    float LCosIn = cos(radians(spotLight1.LConeIn / 2.0));  //formula used from slide 
    
    spotLight1.dir = normalize(spotLight1.LPos - fs_pos); 
    float CosAngle = dot(spotLight1.dir, LDirSpot); //TODO review
    
    spotLight1.col = lightColorS * pow(spotLight1.g / length(spotLight1.LPos - fs_pos), spotLight1.LDecay) *
						clamp((CosAngle - LCosOut) / (LCosIn - LCosOut), 0.0, 1.0);
                        
                                      
     //Initialize spotlight 2
    spotLight2.LConeOut = 25.0;
    spotLight2.LConeIn = 20.0 ;
    vec3 LDirSpot2 = vec3(0.0,0.0,1.0);
    spotLight2.LPos= vec3(float(R * sin(radians(Angle-offsetL))),float(R * cos(radians(Angle-offsetL))),1.0);
    
    spotLight2.LPos.x += cameraPos.x + float(R * sin(radians(Angle)));
    spotLight2.LPos.y += cameraPos.y + float(R * cos(radians(Angle)));
    spotLight2.LPos.z += cameraPos.z;

    
   
    

    float LCosOut2 = cos(radians(spotLight2.LConeOut / 2.0));
    float LCosIn2 = cos(radians(spotLight2.LConeIn / 2.0));  //formula used from slide 
    
    spotLight2.dir = normalize(spotLight2.LPos - fs_pos); 
    float CosAngle2 = dot(spotLight2.dir, LDirSpot2); //TODO review
    
    spotLight2.col = lightColorS * pow(spotLight2.g / length(spotLight2.LPos - fs_pos), spotLight2.LDecay) *
						clamp((CosAngle2 - LCosOut2) / (LCosIn2 - LCosOut2), 0.0, 1.0);
                        
       
    
                        
                        
    // Final components                    
    vec3 lightDir= directLight.dir + pointLight.dir + spotLight1.dir + spotLight2.dir;
    vec4 lightCol= directLight.col + pointLight.col + spotLight1.col + spotLight2.col;
    
    
    vec4 texColor= texture(u_texture, uvFS);
    if(texColor.a < 0.5)  // cut to 0.5 considering objects are only visible (1.0) or invisible (0.0) 
        discard;
    
    ambColor = texColor;
    diffColor = texColor;
    
    
    //Ambient 
     vec4 ambientAmbient = ambientLightColor * ambColor;
    //Diffuse 
    vec4 diffuseLambert = lightCol * clamp(dot(normalVec, lightDir),0.0,1.0) * diffColor;
    
    //Final output 
    outColor = vec4(clamp(ambientAmbient + diffuseLambert, 0.0, 1.0));

}


/* Transformation formulas for rotation

    
    LDirSpot.x = float((LDirSpot.x * cos(radians(-Angle))) - (LDirSpot.y * sin(radians(-Angle))));
    LDirSpot.y= float((LDirSpot.x * sin(radians(-Angle))) + (LDirSpot.y * cos(radians(-Angle))));
    
    spotLight1.LPos.x = float((spotLight1.LPos.x * cos(radians(-Angle))) - spotLight1.LPos.y * sin((radians(-Angle))));
    spotLight1.LPos.y = float((spotLight1.LPos.x * sin(radians(-Angle))) + spotLight1.LPos.y * cos((radians(-Angle))));

*/


