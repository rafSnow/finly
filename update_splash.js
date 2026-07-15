const fs = require('fs');

const logContent = fs.readFileSync('C:/Users/rafaelsouza/.gemini/antigravity/brain/74a004c2-5c45-48cd-9ccd-bb80e03d2993/.system_generated/tasks/task-1045.log', 'utf8');

const linkRegex = /<link rel="apple-touch-startup-image" href="public\/(splash\/apple-splash-[0-9]+-[0-9]+\.jpg)" media="(.*?)">/g;

const startupImages = [];
let match;
while ((match = linkRegex.exec(logContent)) !== null) {
  startupImages.push(`      { url: "/${match[1]}", media: "${match[2]}" },`);
}

const layoutPath = 'c:/Projetos/finly/app/layout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

const appleWebAppReplacement = `  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finly",
    startupImage: [
${startupImages.join('\n')}
    ],
  },`;

layoutContent = layoutContent.replace(/  appleWebApp: \{\s+capable: true,\s+statusBarStyle: "default",\s+title: "Finly",\s+\},/, appleWebAppReplacement);

fs.writeFileSync(layoutPath, layoutContent);
console.log('Layout updated with splash screens!');
