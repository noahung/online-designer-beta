@echo off
echo Creating deployment package...

:: Create a clean directory
if exist "deploy-temp" rmdir /s /q "deploy-temp"
mkdir "deploy-temp"

:: Copy essential files
copy "index.js" "deploy-temp\"
copy "package.json" "deploy-temp\"
copy "authentication.js" "deploy-temp\"
copy "README.md" "deploy-temp\"
copy "ZAPIER_FORM_DROPDOWN_GUIDE.md" "deploy-temp\"

:: Copy directories
xcopy "triggers" "deploy-temp\triggers" /E /I
xcopy "searches" "deploy-temp\searches" /E /I
xcopy "test" "deploy-temp\test" /E /I

:: Install production dependencies in deploy-temp
cd "deploy-temp"
npm install --production
cd ..

:: Create zip file
powershell -command "Compress-Archive -Path 'deploy-temp\*' -DestinationPath 'zapier-app-deployment.zip' -Force"

echo Deployment package created: zapier-app-deployment.zip
echo You can now manually upload this to Zapier Developer Platform
pause
