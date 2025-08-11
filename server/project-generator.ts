import path from "path";
import fs from "fs";

// Fallback project structure generator for when AI fails
export function generateFallbackStructure(name: string, description: string, technologies: string[]) {
  const structure = {
    name,
    description: description || `A ${technologies.join(', ')} application`,
    technologies,
    files: []
  };

  // Add basic folder structure
  structure.files.push(
    { path: "src", type: "folder" },
    { path: "public", type: "folder" },
    { path: "src/components", type: "folder" },
    { path: "src/pages", type: "folder" },
    { path: "src/utils", type: "folder" }
  );

  // Add package.json based on technologies
  const packageJson = generatePackageJson(name, description, technologies);
  structure.files.push({
    path: "package.json",
    type: "file",
    content: JSON.stringify(packageJson, null, 2)
  });

  // Add technology-specific files
  if (technologies.includes("Vite") || technologies.includes("React")) {
    addViteReactFiles(structure, technologies);
  }

  if (technologies.includes("Tailwind CSS")) {
    addTailwindFiles(structure);
  }

  if (technologies.includes("Supabase")) {
    addSupabaseFiles(structure);
  }

  if (technologies.includes("TypeScript")) {
    addTypeScriptFiles(structure);
  }

  // Add basic files
  addBasicFiles(structure, name, description, technologies);

  return structure;
}

function generatePackageJson(name: string, description: string, technologies: string[]) {
  const pkg = {
    name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    version: "1.0.0",
    description: description || `A ${technologies.join(', ')} application`,
    type: "module",
    scripts: {},
    dependencies: {},
    devDependencies: {}
  };

  // Add scripts and dependencies based on technologies
  if (technologies.includes("Vite")) {
    pkg.scripts = {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    };
    pkg.devDependencies["vite"] = "^5.0.0";
  }

  if (technologies.includes("React")) {
    pkg.dependencies["react"] = "^18.2.0";
    pkg.dependencies["react-dom"] = "^18.2.0";
    pkg.devDependencies["@vitejs/plugin-react"] = "^4.0.0";
  }

  if (technologies.includes("TypeScript")) {
    pkg.devDependencies["typescript"] = "^5.0.0";
    pkg.devDependencies["@types/react"] = "^18.2.0";
    pkg.devDependencies["@types/react-dom"] = "^18.2.0";
  }

  if (technologies.includes("Tailwind CSS")) {
    pkg.dependencies["tailwindcss"] = "^3.3.0";
    pkg.dependencies["autoprefixer"] = "^10.4.0";
    pkg.dependencies["postcss"] = "^8.4.0";
  }

  if (technologies.includes("Supabase")) {
    pkg.dependencies["@supabase/supabase-js"] = "^2.38.0";
  }

  return pkg;
}

function addViteReactFiles(structure: any, technologies: string[]) {
  const isTypeScript = technologies.includes("TypeScript");
  const ext = isTypeScript ? "tsx" : "jsx";

  // Vite config
  structure.files.push({
    path: `vite.config.${isTypeScript ? 'ts' : 'js'}`,
    type: "file",
    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
`
  });

  // Main App component
  structure.files.push({
    path: `src/App.${ext}`,
    type: "file",
    content: `import { useState } from 'react'
${technologies.includes("Tailwind CSS") ? "" : "import './App.css'"}

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="${technologies.includes("Tailwind CSS") ? "min-h-screen bg-gray-50 flex items-center justify-center" : "App"}">
      <div className="${technologies.includes("Tailwind CSS") ? "text-center p-8" : ""}">
        <h1 className="${technologies.includes("Tailwind CSS") ? "text-4xl font-bold text-gray-900 mb-8" : ""}">
          Welcome to ${structure.name}
        </h1>
        <div className="${technologies.includes("Tailwind CSS") ? "space-y-4" : "card"}">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="${technologies.includes("Tailwind CSS") ? "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" : ""}"
          >
            count is {count}
          </button>
          <p className="${technologies.includes("Tailwind CSS") ? "text-gray-600" : ""}">
            Edit <code>src/App.${ext}</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
`
  });

  // Main entry point
  structure.files.push({
    path: `src/main.${isTypeScript ? 'tsx' : 'jsx'}`,
    type: "file",
    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.${ext}'
${technologies.includes("Tailwind CSS") ? "import './index.css'" : "import './index.css'"}

ReactDOM.createRoot(document.getElementById('root')${isTypeScript ? '!' : ''}).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
  });

  // Index HTML
  structure.files.push({
    path: "index.html",
    type: "file",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${structure.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${isTypeScript ? 'tsx' : 'jsx'}"></script>
  </body>
</html>
`
  });
}

function addTailwindFiles(structure: any) {
  // Tailwind config
  structure.files.push({
    path: "tailwind.config.js",
    type: "file",
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
  });

  // PostCSS config
  structure.files.push({
    path: "postcss.config.js",
    type: "file",
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
  });

  // CSS file with Tailwind
  structure.files.push({
    path: "src/index.css",
    type: "file",
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`
  });
}

function addSupabaseFiles(structure: any) {
  // Supabase config
  structure.files.push({
    path: "src/lib/supabase.js",
    type: "file",
    content: `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
`
  });

  // Environment template
  structure.files.push({
    path: ".env.example",
    type: "file",
    content: `VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
`
  });
}

function addTypeScriptFiles(structure: any) {
  // TypeScript config
  structure.files.push({
    path: "tsconfig.json",
    type: "file",
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`
  });

  structure.files.push({
    path: "tsconfig.node.json",
    type: "file",
    content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
`
  });
}

function addBasicFiles(structure: any, name: string, description: string, technologies: string[]) {
  // README
  structure.files.push({
    path: "README.md",
    type: "file",
    content: `# ${name}

${description || `A ${technologies.join(', ')} application`}

## Technologies Used

${technologies.map(tech => `- ${tech}`).join('\n')}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. ${technologies.includes("Supabase") ? `Configure environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Fill in your Supabase credentials.

3. ` : ""}Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure

- \`src/\` - Source code
- \`public/\` - Static assets
- \`src/components/\` - React components
- \`src/pages/\` - Page components
- \`src/utils/\` - Utility functions

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build

---

Generated by LeviatanCode AI
`
  });

  // .gitignore
  structure.files.push({
    path: ".gitignore",
    type: "file",
    content: `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production
/dist
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# OS generated files
Thumbs.db
`
  });

  if (!technologies.includes("Tailwind CSS")) {
    // Basic CSS if not using Tailwind
    structure.files.push({
      path: "src/index.css",
      type: "file",
      content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`
    });

    structure.files.push({
      path: "src/App.css",
      type: "file",
      content: `.App {
  text-align: center;
  padding: 2rem;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}
`
    });
  }
}