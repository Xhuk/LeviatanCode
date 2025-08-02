#!/usr/bin/env python3
"""
LeviatanCode Comprehensive Project Analyzer
Advanced project analysis tool that creates complete insightsproject.ia files
Designed to run from /scripts folder and analyze target project directories
"""

import os
import json
import time
import hashlib
import subprocess
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import re

class ComprehensiveProjectAnalyzer:
    def __init__(self, project_path: str = ".", api_key: str = None):
        self.project_path = Path(project_path).resolve()
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.start_time = datetime.now()
        
        # Initialize comprehensive analysis data structure matching insightsproject.ia format
        self.insights_data = {
            "version": "1.0",
            "projectId": self.project_path.name,
            "projectName": self.project_path.name,
            "projectPath": str(self.project_path),
            "createdAt": self.start_time.isoformat(),
            "lastModified": self.start_time.isoformat(),
            "lastAnalyzed": self.start_time.isoformat(),
            
            # Core project data
            "technologies": [],
            "frameworks": [],
            "languages": [],
            "totalFiles": 0,
            "totalLinesOfCode": 0,
            "fileTypes": {},
            "dependencies": {},
            
            # Architecture and structure
            "projectType": "",
            "mainEntryPoints": [],
            "configFiles": [],
            "buildSystems": [],
            "testingFrameworks": [],
            "cicdPipelines": [],
            
            # Analysis results
            "insights": [],
            "recommendations": [],
            "securityFindings": [],
            "performanceInsights": [],
            "codeQualityMetrics": {},
            
            # AI analysis
            "aiSummary": "",
            "aiArchitectureAnalysis": "",
            "aiTechnologyRecommendations": [],
            "aiSecurityAssessment": "",
            "aiPerformanceAnalysis": "",
            
            # Setup and deployment
            "setupInstructions": [],
            "runCommands": [],
            "deploymentInfo": {
                "type": "",
                "requirements": [],
                "commands": []
            },
            
            # File analysis
            "fileStructure": {},
            "importantFiles": {},
            "documentationFiles": [],
            "testFiles": [],
            "configurationFiles": [],
            
            # Development environment
            "devEnvironment": {
                "nodeVersion": "",
                "pythonVersion": "",
                "javaVersion": "",
                "dockerfiles": [],
                "requirements": []
            },
            
            # Quality metrics
            "complexity": {
                "cyclomatic": 0,
                "cognitive": 0,
                "fileComplexity": {}
            },
            
            # Git analysis
            "gitInfo": {
                "isGitRepo": False,
                "branchCount": 0,
                "commitCount": 0,
                "lastCommit": "",
                "contributors": []
            }
        }

    def is_analyzable_file(self, file_path: Path) -> bool:
        """Check if file should be analyzed for code content."""
        analyzable_extensions = {
            '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
            '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml', '.svg',
            '.json', '.md', '.txt', '.yaml', '.yml', '.toml', '.ini', '.conf',
            '.config', '.sql', '.sh', '.bat', '.ps1', '.cmd', '.dockerfile',
            '.vue', '.svelte', '.elm', '.clj', '.hs', '.ml', '.fs', '.dart',
            '.r', '.jl', '.lua', '.pl', '.tcl', '.vim', '.tex'
        }
        
        return (file_path.suffix.lower() in analyzable_extensions or 
                file_path.name.lower() in ['dockerfile', 'makefile', 'rakefile', 'gemfile'])

    def scan_comprehensive_files(self):
        """Comprehensive file scanning with detailed analysis."""
        print(f"📁 Scanning project files in: {self.project_path}")
        
        ignore_patterns = {
            'node_modules', '.git', '__pycache__', '.venv', 'venv', 'env',
            'dist', 'build', '.next', 'target', 'bin', 'obj', 'out',
            '.idea', '.vscode', '.vs', '.nyc_output', 'coverage',
            'logs', 'uploads', 'migrations'  # Added common project folders to ignore
        }
        
        important_files = {
            'package.json', 'requirements.txt', 'pom.xml', 'build.gradle',
            'Cargo.toml', 'go.mod', 'composer.json', 'Gemfile',
            'setup.py', 'pyproject.toml', 'CMakeLists.txt', 'Makefile',
            'Dockerfile', 'docker-compose.yml', '.env', '.env.example',
            'README.md', 'README.txt', 'CHANGELOG.md', 'LICENSE',
            'tsconfig.json', 'babel.config.js', 'webpack.config.js',
            'vite.config.js', 'rollup.config.js', 'jest.config.js',
            'tailwind.config.js', 'postcss.config.js', 'drizzle.config.ts',
            'components.json', 'replit.md'
        }
        
        entry_point_patterns = [
            'index.js', 'index.ts', 'main.py', 'app.py', 'server.js',
            'main.js', 'main.ts', 'App.js', 'App.tsx', 'main.go',
            'main.java', 'Program.cs', 'main.cpp', 'main.c'
        ]
        
        file_count = 0
        total_lines = 0
        
        for root, dirs, files in os.walk(self.project_path):
            # Filter out ignored directories
            dirs[:] = [d for d in dirs if d not in ignore_patterns]
            
            for file in files:
                if any(pattern in file for pattern in ignore_patterns if '*' not in pattern):
                    continue
                    
                file_path = Path(root) / file
                relative_path = str(file_path.relative_to(self.project_path))
                
                try:
                    stat = file_path.stat()
                    ext = file_path.suffix.lower()
                    
                    # Count file types
                    self.insights_data["fileTypes"][ext] = self.insights_data["fileTypes"].get(ext, 0) + 1
                    
                    # Categorize files
                    if file in important_files:
                        self.insights_data["importantFiles"][relative_path] = {
                            "type": "configuration",
                            "size": stat.st_size,
                            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                        }
                        self.insights_data["configFiles"].append(relative_path)
                    
                    if file in entry_point_patterns:
                        self.insights_data["mainEntryPoints"].append(relative_path)
                    
                    if ('test' in relative_path.lower() or 
                        file.lower().endswith(('.test.js', '.test.ts', '.spec.js', '.spec.ts', '_test.py')) or
                        'test' in file.lower()):
                        self.insights_data["testFiles"].append(relative_path)
                    
                    if file.lower().endswith(('.md', '.txt', '.rst', '.adoc', '.doc')):
                        self.insights_data["documentationFiles"].append(relative_path)
                    
                    # Analyze text files
                    if self.is_analyzable_file(file_path):
                        try:
                            content = file_path.read_text(encoding='utf-8', errors='ignore')
                            lines = len(content.splitlines())
                            total_lines += lines
                            
                            # Store file structure info
                            self.insights_data["fileStructure"][relative_path] = {
                                "size": stat.st_size,
                                "lines": lines,
                                "extension": ext,
                                "language": self.detect_file_language(ext),
                                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                            }
                            
                        except (UnicodeDecodeError, PermissionError):
                            continue
                    
                    file_count += 1
                    
                except (OSError, PermissionError):
                    continue
        
        self.insights_data["totalFiles"] = file_count
        self.insights_data["totalLinesOfCode"] = total_lines
        
        print(f"📊 Scanned {file_count} files, {total_lines:,} lines of code")

    def detect_file_language(self, extension: str) -> str:
        """Detect programming language from file extension."""
        language_map = {
            '.js': 'JavaScript', '.ts': 'TypeScript', '.jsx': 'JavaScript',
            '.tsx': 'TypeScript', '.py': 'Python', '.java': 'Java',
            '.cpp': 'C++', '.c': 'C', '.h': 'C/C++', '.cs': 'C#',
            '.php': 'PHP', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust',
            '.swift': 'Swift', '.kt': 'Kotlin', '.scala': 'Scala',
            '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
            '.html': 'HTML', '.htm': 'HTML', '.xml': 'XML', '.svg': 'SVG',
            '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML', '.toml': 'TOML',
            '.sql': 'SQL', '.sh': 'Shell', '.bat': 'Batch', '.ps1': 'PowerShell'
        }
        return language_map.get(extension.lower(), 'Unknown')

    def detect_comprehensive_technologies(self):
        """Comprehensive technology detection with advanced patterns."""
        print("🔧 Detecting technologies and frameworks...")
        
        tech_patterns = {
            # Frontend Frameworks
            'React': [r'import.*react', r'"react":', r'useState', r'useEffect', r'jsx', r'React\.'],
            'Vue.js': [r'import.*vue', r'"vue":', r'<template>', r'v-if', r'v-for', r'Vue\.'],
            'Angular': [r'@angular', r'ng-', r'angular\.json', r'@Component', r'Angular'],
            'Svelte': [r'\.svelte$', r'svelte', r'SvelteKit'],
            'Next.js': [r'"next":', r'next\.config', r'getStaticProps', r'getServerSideProps'],
            'Nuxt.js': [r'"nuxt":', r'nuxt\.config', r'@nuxt'],
            'Gatsby': [r'"gatsby":', r'gatsby-config'],
            
            # Backend Frameworks  
            'Express.js': [r'"express":', r'app\.listen', r'app\.get', r'express\(\)', r'router\.'],
            'Fastify': [r'"fastify":', r'fastify\.register'],
            'Koa': [r'"koa":', r'ctx\.'],
            'Django': [r'django', r'models\.Model', r'settings\.py', r'urls\.py', r'manage\.py'],
            'Flask': [r'from flask', r'Flask\(__name__\)', r'@app\.route', r'render_template'],
            'FastAPI': [r'from fastapi', r'FastAPI\(\)', r'@app\.get', r'@app\.post'],
            'Spring Framework': [r'@SpringBootApplication', r'@Controller', r'spring-boot', r'@Service'],
            'ASP.NET': [r'Microsoft\.AspNetCore', r'@page', r'@model'],
            'Ruby on Rails': [r'rails', r'ActiveRecord', r'Gemfile'],
            
            # Languages
            'JavaScript': [r'\.js$', r'\.mjs$', r'function ', r'const ', r'let ', r'var '],
            'TypeScript': [r'\.ts$', r'\.tsx$', r'interface ', r'type ', r': string', r': number'],
            'Python': [r'\.py$', r'import ', r'def ', r'class ', r'from .* import'],
            'Java': [r'\.java$', r'public class', r'import java', r'public static void main'],
            'C#': [r'\.cs$', r'using System', r'namespace ', r'public class'],
            'C++': [r'\.cpp$', r'\.hpp$', r'#include <', r'std::', r'namespace'],
            'Go': [r'\.go$', r'package main', r'import "', r'func main'],
            'Rust': [r'\.rs$', r'Cargo\.toml', r'fn main', r'use std::'],
            'PHP': [r'\.php$', r'<?php', r'namespace ', r'composer\.json'],
            'Ruby': [r'\.rb$', r'Gemfile', r'require ', r'class '],
            'Swift': [r'\.swift$', r'import Foundation'],
            'Kotlin': [r'\.kt$', r'package ', r'import '],
            'Dart': [r'\.dart$', r'import \'dart:'],
            
            # Databases
            'PostgreSQL': [r'postgresql', r'psql', r'pg_', r'@neondatabase'],
            'MySQL': [r'mysql', r'CREATE TABLE'],
            'MongoDB': [r'mongodb', r'mongoose', r'db\.collection'],
            'Redis': [r'redis', r'REDIS_URL'],
            'SQLite': [r'sqlite', r'\.db$'],
            'Drizzle ORM': [r'drizzle-orm', r'drizzle\.config', r'drizzle-kit'],
            'Prisma': [r'prisma', r'@prisma/client'],
            
            # DevOps & Infrastructure
            'Docker': [r'Dockerfile', r'docker-compose', r'FROM '],
            'Kubernetes': [r'\.yaml$', r'\.yml$', r'apiVersion:', r'kind:'],
            'Git': [r'\.git/', r'\.gitignore'],
            'GitHub Actions': [r'\.github/workflows', r'uses:', r'runs-on:'],
            
            # Testing
            'Jest': [r'"jest":', r'describe\(', r'it\(', r'test\(', r'jest\.config'],
            'Mocha': [r'"mocha":', r'describe\(', r'it\('],
            'Cypress': [r'"cypress":', r'cy\.'],
            'PyTest': [r'pytest', r'test_', r'@pytest'],
            'JUnit': [r'junit', r'@Test'],
            
            # Build Tools & Package Managers
            'Webpack': [r'"webpack":', r'webpack\.config'],
            'Vite': [r'"vite":', r'vite\.config'],
            'Rollup': [r'"rollup":', r'rollup\.config'],
            'Parcel': [r'"parcel":', r'\.parcelrc'],
            'npm': [r'package\.json', r'package-lock\.json'],
            'Yarn': [r'yarn\.lock', r'\.yarnrc'],
            'pnpm': [r'pnpm-lock\.yaml'],
            'pip': [r'requirements\.txt', r'pip install'],
            'Poetry': [r'pyproject\.toml', r'poetry\.lock'],
            'Maven': [r'pom\.xml', r'mvn'],
            'Gradle': [r'build\.gradle', r'gradlew'],
            'Make': [r'Makefile', r'makefile'],
            'Cargo': [r'Cargo\.toml', r'cargo'],
            
            # CSS Frameworks & Preprocessors
            'Tailwind CSS': [r'"tailwindcss":', r'@tailwind', r'tailwind\.config'],
            'Bootstrap': [r'"bootstrap":', r'btn-', r'container-'],
            'Sass': [r'\.sass$', r'\.scss$', r'@mixin', r'@include'],
            'Less': [r'\.less$', r'@import'],
            'PostCSS': [r'"postcss":', r'postcss\.config'],
            
            # UI Libraries
            'Material-UI': [r'@mui', r'@material-ui'],
            'Ant Design': [r'"antd":', r'ant-design'],
            'Chakra UI': [r'@chakra-ui'],
            'shadcn/ui': [r'"@radix-ui":', r'components\.json', r'ui/.*\.tsx'],
            
            # State Management
            'Redux': [r'"redux":', r'@reduxjs/toolkit', r'useSelector'],
            'Zustand': [r'"zustand":', r'create\('],
            'MobX': [r'"mobx":', r'observable'],
            
            # Mobile Development
            'React Native': [r'"react-native":', r'React Native'],
            'Flutter': [r'"flutter":', r'pubspec\.yaml'],
            'Ionic': [r'"@ionic":', r'ion-'],
            
            # API & Communication
            'GraphQL': [r'"graphql":', r'query ', r'mutation '],
            'REST API': [r'/api/', r'@RestController'],
            'tRPC': [r'"@trpc":', r'trpc'],
            'Axios': [r'"axios":', r'axios\.'],
            'Fetch API': [r'fetch\('],
            
            # Authentication
            'NextAuth': [r'"next-auth":', r'NextAuth'],
            'Passport': [r'"passport":', r'passport\.use'],
            'Auth0': [r'"@auth0":', r'auth0'],
            'Firebase Auth': [r'firebase/auth'],
            
            # Cloud & Services
            'Vercel': [r'vercel\.json', r'\.vercel'],
            'Netlify': [r'netlify\.toml', r'_redirects'],
            'AWS': [r'"aws-', r'amazonaws'],
            'Google Cloud': [r'"@google-cloud":', r'googleapis'],
            'Replit': [r'\.replit', r'replit\.nix'],
            
            # Monitoring & Analytics
            'Sentry': [r'"@sentry":', r'Sentry\.'],
            'Google Analytics': [r'gtag\(', r'ga\('],
            'Posthog': [r'"posthog":', r'posthog\.'],
            
            # Content Management
            'Strapi': [r'"@strapi":', r'strapi'],
            'Contentful': [r'"contentful":', r'contentful'],
            'Sanity': [r'"@sanity":', r'sanity'],
            
            # Development Tools
            'ESLint': [r'\.eslintrc', r'"eslint":'],
            'Prettier': [r'\.prettierrc', r'"prettier":'],
            'Husky': [r'"husky":', r'\.husky'],
            'TypeScript': [r'tsconfig\.json', r'\.ts$', r'\.tsx$'],
            'Babel': [r'babel\.config', r'"@babel"'],
            
            # E-commerce
            'Stripe': [r'"stripe":', r'stripe\.'],
            'PayPal': [r'"@paypal":', r'paypal'],
            'Shopify': [r'"@shopify":', r'shopify']
        }
        
        detected_techs = set()
        detected_frameworks = set()
        detected_languages = set()
        detected_build_systems = set()
        detected_testing = set()
        
        # Analyze all files for technology patterns
        all_content = ""
        all_filenames = ""
        
        for file_path in self.insights_data["fileStructure"]:
            all_filenames += f" {file_path} "
            try:
                actual_path = self.project_path / file_path
                if actual_path.exists() and self.is_analyzable_file(actual_path):
                    content = actual_path.read_text(encoding='utf-8', errors='ignore')
                    all_content += f" {content} "
            except:
                continue
        
        # Add config files
        for file_path in self.insights_data["configFiles"]:
            all_filenames += f" {file_path} "
        
        search_text = all_filenames + " " + all_content
        
        # Detect technologies
        for tech, patterns in tech_patterns.items():
            for pattern in patterns:
                if re.search(pattern, search_text, re.IGNORECASE | re.MULTILINE):
                    detected_techs.add(tech)
                    
                    # Categorize technologies
                    frontend_frameworks = ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby']
                    backend_frameworks = ['Express.js', 'Fastify', 'Koa', 'Django', 'Flask', 'FastAPI', 'Spring Framework', 'ASP.NET', 'Ruby on Rails']
                    languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart']
                    build_systems = ['Webpack', 'Vite', 'Rollup', 'Parcel', 'npm', 'Yarn', 'pnpm', 'pip', 'Poetry', 'Maven', 'Gradle', 'Make', 'Cargo']
                    testing_frameworks = ['Jest', 'Mocha', 'Cypress', 'PyTest', 'JUnit']
                    
                    if tech in frontend_frameworks or tech in backend_frameworks:
                        detected_frameworks.add(tech)
                    elif tech in languages:
                        detected_languages.add(tech)
                    elif tech in build_systems:
                        detected_build_systems.add(tech)
                    elif tech in testing_frameworks:
                        detected_testing.add(tech)
                    break
        
        self.insights_data["technologies"] = sorted(list(detected_techs))
        self.insights_data["frameworks"] = sorted(list(detected_frameworks))
        self.insights_data["languages"] = sorted(list(detected_languages))
        self.insights_data["buildSystems"] = sorted(list(detected_build_systems))
        self.insights_data["testingFrameworks"] = sorted(list(detected_testing))
        
        print(f"🔍 Detected {len(detected_techs)} technologies: {', '.join(sorted(list(detected_techs))[:10])}{'...' if len(detected_techs) > 10 else ''}")

    def analyze_dependencies_comprehensive(self):
        """Comprehensive dependency analysis for all package managers."""
        print("📦 Analyzing dependencies...")
        
        dependency_analyzers = {
            'package.json': self.analyze_npm_dependencies,
            'requirements.txt': self.analyze_pip_dependencies,
            'pyproject.toml': self.analyze_poetry_dependencies,
            'Gemfile': self.analyze_bundler_dependencies,
            'composer.json': self.analyze_composer_dependencies,
            'pom.xml': self.analyze_maven_dependencies,
            'build.gradle': self.analyze_gradle_dependencies,
            'Cargo.toml': self.analyze_cargo_dependencies,
            'go.mod': self.analyze_go_dependencies
        }
        
        for filename, analyzer in dependency_analyzers.items():
            file_path = self.project_path / filename
            if file_path.exists():
                try:
                    deps = analyzer(file_path)
                    if deps:
                        self.insights_data["dependencies"][filename] = deps
                except Exception as e:
                    print(f"⚠️  Could not analyze {filename}: {e}")

    def analyze_npm_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze npm package.json dependencies."""
        try:
            data = json.loads(file_path.read_text())
            result = {
                "dependencies": data.get('dependencies', {}),
                "devDependencies": data.get('devDependencies', {}),
                "scripts": data.get('scripts', {}),
                "engines": data.get('engines', {}),
                "total_count": len(data.get('dependencies', {})) + len(data.get('devDependencies', {}))
            }
            
            # Extract setup and run commands
            scripts = data.get('scripts', {})
            if 'start' in scripts:
                self.insights_data["runCommands"].append("npm start")
            if 'dev' in scripts:
                self.insights_data["runCommands"].append("npm run dev")
            if 'windev' in scripts:
                self.insights_data["runCommands"].append("npm run windev")
            if 'build' in scripts:
                self.insights_data["setupInstructions"].append("npm run build")
            if 'test' in scripts:
                self.insights_data["setupInstructions"].append("npm test")
            
            self.insights_data["setupInstructions"].append("npm install")
            
            return result
        except:
            return {}

    def analyze_pip_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Python requirements.txt."""
        deps = {}
        try:
            content = file_path.read_text()
            for line in content.splitlines():
                line = line.strip()
                if line and not line.startswith('#'):
                    if '==' in line:
                        name, version = line.split('==', 1)
                        deps[name.strip()] = version.strip()
                    elif '>=' in line:
                        name, version = line.split('>=', 1)
                        deps[name.strip()] = f">={version.strip()}"
                    else:
                        deps[line] = "latest"
            
            self.insights_data["setupInstructions"].extend([
                "python -m venv venv",
                "venv\\Scripts\\activate (Windows) or source venv/bin/activate (Unix)",
                "pip install -r requirements.txt"
            ])
            
            # Check for common Python entry points
            if (self.project_path / "app.py").exists():
                self.insights_data["runCommands"].append("python app.py")
            if (self.project_path / "main.py").exists():
                self.insights_data["runCommands"].append("python main.py")
            if (self.project_path / "manage.py").exists():
                self.insights_data["runCommands"].append("python manage.py runserver")
            
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_poetry_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Poetry pyproject.toml."""
        try:
            content = file_path.read_text()
            # Simple TOML parsing for dependencies
            deps = {}
            in_dependencies = False
            for line in content.splitlines():
                line = line.strip()
                if line == '[tool.poetry.dependencies]':
                    in_dependencies = True
                elif line.startswith('[') and line != '[tool.poetry.dependencies]':
                    in_dependencies = False
                elif in_dependencies and '=' in line and not line.startswith('#'):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        name = parts[0].strip()
                        version = parts[1].strip().strip('"\'')
                        deps[name] = version
            
            self.insights_data["setupInstructions"].extend([
                "poetry install",
                "poetry shell"
            ])
            
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_bundler_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Ruby Gemfile."""
        deps = {}
        try:
            content = file_path.read_text()
            for line in content.splitlines():
                line = line.strip()
                if line.startswith('gem '):
                    parts = line.split()
                    if len(parts) >= 2:
                        name = parts[1].strip('\'"')
                        deps[name] = "latest"
            
            self.insights_data["setupInstructions"].append("bundle install")
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_composer_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze PHP composer.json."""
        try:
            data = json.loads(file_path.read_text())
            deps = data.get('require', {})
            
            self.insights_data["setupInstructions"].append("composer install")
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_maven_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Maven pom.xml."""
        deps = {}
        try:
            content = file_path.read_text()
            import re
            pattern = r'<dependency>.*?<groupId>(.*?)</groupId>.*?<artifactId>(.*?)</artifactId>.*?<version>(.*?)</version>.*?</dependency>'
            matches = re.findall(pattern, content, re.DOTALL)
            for group, artifact, version in matches:
                deps[f"{group.strip()}:{artifact.strip()}"] = version.strip()
            
            self.insights_data["setupInstructions"].extend([
                "mvn compile",
                "mvn test"
            ])
            self.insights_data["runCommands"].append("mvn spring-boot:run")
            
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_gradle_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Gradle build.gradle."""
        deps = {}
        try:
            content = file_path.read_text()
            lines = content.splitlines()
            in_dependencies = False
            for line in lines:
                line = line.strip()
                if 'dependencies {' in line:
                    in_dependencies = True
                elif in_dependencies and '}' in line:
                    in_dependencies = False
                elif in_dependencies and any(keyword in line for keyword in ['implementation', 'compile']):
                    import re
                    match = re.search(r'[\'"]([^:]+):([^:]+):([^\'"]+)[\'"]', line)
                    if match:
                        group, artifact, version = match.groups()
                        deps[f"{group}:{artifact}"] = version
            
            self.insights_data["setupInstructions"].append("./gradlew build")
            self.insights_data["runCommands"].append("./gradlew bootRun")
            
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_cargo_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Rust Cargo.toml."""
        try:
            content = file_path.read_text()
            deps = {}
            in_dependencies = False
            for line in content.splitlines():
                line = line.strip()
                if line == '[dependencies]':
                    in_dependencies = True
                elif line.startswith('[') and line != '[dependencies]':
                    in_dependencies = False
                elif in_dependencies and '=' in line and not line.startswith('#'):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        name = parts[0].strip()
                        version = parts[1].strip().strip('"\'')
                        deps[name] = version
            
            self.insights_data["setupInstructions"].append("cargo build")
            self.insights_data["runCommands"].append("cargo run")
            
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_go_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Go go.mod."""
        deps = {}
        try:
            content = file_path.read_text()
            for line in content.splitlines():
                line = line.strip()
                if line.startswith('require '):
                    parts = line.replace('require ', '').split()
                    if len(parts) >= 2:
                        deps[parts[0]] = parts[1]
                elif line and not line.startswith('module') and not line.startswith('go ') and ' ' in line:
                    parts = line.split()
                    if len(parts) >= 2 and not line.startswith('//'):
                        deps[parts[0]] = parts[1]
            
            self.insights_data["setupInstructions"].append("go mod download")
            self.insights_data["runCommands"].append("go run main.go")
            
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def detect_project_type(self):
        """Detect the primary project type."""
        print("🎯 Detecting project type...")
        
        type_indicators = {
            "Web Application": [
                'package.json', 'index.html', 'React', 'Vue.js', 'Angular', 'Express.js',
                'Next.js', 'Nuxt.js', 'Gatsby', 'Svelte'
            ],
            "API/Backend Service": [
                'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Framework',
                'routes/', 'controllers/', 'api/', '/api'
            ],
            "Full-Stack Application": [
                'React', 'Vue.js', 'Angular', 'Express.js', 'Django', 'Flask',
                'client/', 'server/', 'backend/', 'frontend/'
            ],
            "Desktop Application": [
                'electron', 'tauri', 'PyQt', 'tkinter', '.exe'
            ],
            "Mobile Application": [
                'React Native', 'Flutter', 'Ionic', 'android/', 'ios/'
            ],
            "Library/Package": [
                'setup.py', 'pyproject.toml', 'lib/', 'src/', 'index.js'
            ],
            "Documentation": [
                'docs/', 'README.md', '.md', 'jekyll', 'hugo'
            ],
            "Development Environment": [
                'IDE', 'development environment', 'code editor', 'Monaco', 'AI'
            ]
        }
        
        scores = {}
        all_indicators = (
            " ".join(self.insights_data["technologies"]) + " " +
            " ".join(self.insights_data["configFiles"]) + " " +
            " ".join(self.insights_data["fileStructure"].keys()) + " " +
            str(self.insights_data["projectName"]).lower() + " " +
            str(self.insights_data["projectPath"]).lower()
        ).lower()
        
        for project_type, indicators in type_indicators.items():
            score = sum(1 for indicator in indicators if indicator.lower() in all_indicators)
            scores[project_type] = score
        
        if scores:
            primary_type = max(scores, key=scores.get)
            self.insights_data["projectType"] = primary_type if scores[primary_type] > 0 else "General Software Project"
        else:
            self.insights_data["projectType"] = "Unknown"
        
        print(f"🏷️  Project type: {self.insights_data['projectType']}")

    def analyze_git_repository(self):
        """Analyze Git repository information."""
        try:
            git_dir = self.project_path / ".git"
            if git_dir.exists():
                self.insights_data["gitInfo"]["isGitRepo"] = True
                
                try:
                    result = subprocess.run(['git', 'branch', '-a'], 
                                          capture_output=True, text=True, 
                                          cwd=self.project_path, timeout=10)
                    if result.returncode == 0:
                        branches = [line.strip() for line in result.stdout.splitlines() if line.strip()]
                        self.insights_data["gitInfo"]["branchCount"] = len(set(branches))
                except:
                    pass
                
                try:
                    result = subprocess.run(['git', 'rev-list', '--count', 'HEAD'], 
                                          capture_output=True, text=True, 
                                          cwd=self.project_path, timeout=10)
                    if result.returncode == 0:
                        self.insights_data["gitInfo"]["commitCount"] = int(result.stdout.strip())
                except:
                    pass
                
                try:
                    result = subprocess.run(['git', 'log', '-1', '--format=%H %s %an %ad'], 
                                          capture_output=True, text=True, 
                                          cwd=self.project_path, timeout=10)
                    if result.returncode == 0:
                        self.insights_data["gitInfo"]["lastCommit"] = result.stdout.strip()
                except:
                    pass
        except:
            pass

    def generate_comprehensive_insights(self):
        """Generate comprehensive project insights and recommendations."""
        print("💡 Generating comprehensive insights...")
        
        insights = []
        recommendations = []
        security_findings = []
        performance_insights = []
        
        # Project scale insights
        if self.insights_data["totalFiles"] > 1000:
            insights.append(f"Large-scale project with {self.insights_data['totalFiles']:,} files")
            recommendations.append("Consider implementing monorepo tools and code organization strategies")
        elif self.insights_data["totalFiles"] > 100:
            insights.append(f"Medium-scale project with {self.insights_data['totalFiles']} files")
            recommendations.append("Implement automated testing and continuous integration")
        else:
            insights.append(f"Small-to-medium project with {self.insights_data['totalFiles']} files")
        
        # Code volume insights
        if self.insights_data["totalLinesOfCode"] > 100000:
            insights.append(f"Substantial codebase with {self.insights_data['totalLinesOfCode']:,} lines of code")
            recommendations.append("Implement comprehensive testing strategy and automated code quality checks")
        elif self.insights_data["totalLinesOfCode"] > 10000:
            insights.append(f"Moderate codebase with {self.insights_data['totalLinesOfCode']:,} lines of code")
            recommendations.append("Implement automated testing and code review processes")
        
        # Technology insights
        tech_count = len(self.insights_data["technologies"])
        if tech_count > 20:
            insights.append(f"Highly diverse technology stack with {tech_count} technologies")
            recommendations.append("Document technology choices and maintain team expertise across all technologies")
            recommendations.append("Consider technology consolidation where appropriate")
        elif tech_count > 10:
            insights.append(f"Multi-technology project using {tech_count} technologies")
            recommendations.append("Ensure team knowledge coverage and maintain technology documentation")
        elif tech_count > 5:
            insights.append(f"Moderate technology diversity with {tech_count} technologies")
        
        # Language analysis
        if len(self.insights_data["languages"]) > 3:
            insights.append(f"Polyglot project using {len(self.insights_data['languages'])} programming languages: {', '.join(self.insights_data['languages'])}")
            recommendations.append("Establish coding standards for each language")
            recommendations.append("Consider language-specific linting and formatting tools")
        elif self.insights_data["languages"]:
            insights.append(f"Primary languages: {', '.join(self.insights_data['languages'])}")
        
        # Framework insights
        if self.insights_data["frameworks"]:
            insights.append(f"Uses modern frameworks: {', '.join(self.insights_data['frameworks'])}")
            recommendations.append("Keep frameworks updated for security and performance benefits")
            recommendations.append("Monitor framework deprecation notices and migration paths")
        
        # Dependency analysis
        total_deps = sum(deps.get('total_count', 0) for deps in self.insights_data["dependencies"].values())
        if total_deps > 200:
            insights.append(f"Very heavy dependency usage: {total_deps} total dependencies")
            recommendations.append("Critical: Implement automated dependency scanning and vulnerability management")
            recommendations.append("Consider dependency bundling and tree-shaking to reduce bundle size")
            security_findings.append("Extremely large number of dependencies significantly increases attack surface")
        elif total_deps > 100:
            insights.append(f"Heavy dependency usage: {total_deps} total dependencies")
            recommendations.append("Regularly audit dependencies for security vulnerabilities")
            recommendations.append("Consider dependency bundling and tree-shaking")
            security_findings.append("Large number of dependencies increases attack surface")
        elif total_deps > 50:
            insights.append(f"Moderate dependency usage: {total_deps} dependencies")
            recommendations.append("Implement dependency scanning in CI/CD pipeline")
        elif total_deps > 0:
            insights.append(f"Lightweight dependency usage: {total_deps} dependencies")
        
        # Testing insights
        if self.insights_data["testingFrameworks"]:
            insights.append(f"Testing frameworks detected: {', '.join(self.insights_data['testingFrameworks'])}")
            if len(self.insights_data["testFiles"]) > 20:
                insights.append(f"Extensive testing coverage with {len(self.insights_data['testFiles'])} test files")
            elif len(self.insights_data["testFiles"]) > 5:
                insights.append(f"Good testing coverage with {len(self.insights_data['testFiles'])} test files")
            else:
                recommendations.append("Consider expanding test coverage")
        else:
            recommendations.append("No testing frameworks detected - implement automated testing")
            security_findings.append("Lack of automated testing may lead to undetected issues")
        
        # Build system insights
        if self.insights_data["buildSystems"]:
            insights.append(f"Build systems in use: {', '.join(self.insights_data['buildSystems'])}")
        else:
            recommendations.append("Consider implementing a build system for consistent builds")
        
        # Security insights
        if 'Docker' in self.insights_data["technologies"]:
            insights.append("Containerized application using Docker")
            security_findings.append("Ensure Docker images are regularly updated and scanned for vulnerabilities")
            recommendations.append("Implement multi-stage builds and minimal base images")
        
        # Check for authentication/security related dependencies
        auth_deps = []
        for deps_file, deps_data in self.insights_data["dependencies"].items():
            if isinstance(deps_data, dict) and 'dependencies' in deps_data:
                for dep_name in deps_data['dependencies']:
                    if any(keyword in dep_name.lower() for keyword in ['auth', 'passport', 'jwt', 'bcrypt', 'crypto']):
                        auth_deps.append(dep_name)
        
        if auth_deps:
            insights.append(f"Authentication/security dependencies detected: {', '.join(auth_deps[:5])}")
            security_findings.append("Ensure authentication dependencies are regularly updated")
            recommendations.append("Implement secure authentication practices and regular security audits")
        
        # Performance insights
        if any('webpack' in str(deps).lower() for deps in self.insights_data["dependencies"].values()):
            performance_insights.append("Webpack detected - consider bundle optimization strategies")
            recommendations.append("Implement code splitting and lazy loading for better performance")
        
        if any('vite' in str(deps).lower() for deps in self.insights_data["dependencies"].values()):
            performance_insights.append("Vite detected - modern build tool with good performance defaults")
        
        # Check for image files that might need optimization
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']
        if any(ext in self.insights_data["fileTypes"] for ext in image_extensions):
            performance_insights.append("Image files detected - consider implementing image optimization")
            recommendations.append("Implement image optimization and lazy loading")
        
        # Documentation insights
        doc_count = len(self.insights_data["documentationFiles"])
        if doc_count > 10:
            insights.append(f"Well-documented project with {doc_count} documentation files")
        elif doc_count > 5:
            insights.append(f"Good documentation coverage with {doc_count} documentation files")
        elif doc_count > 0:
            insights.append(f"Some documentation present: {doc_count} files")
            recommendations.append("Consider expanding project documentation")
        else:
            recommendations.append("No documentation files detected - add README and API documentation")
        
        # Git insights
        if self.insights_data["gitInfo"]["isGitRepo"]:
            commit_count = self.insights_data["gitInfo"]["commitCount"]
            if commit_count > 1000:
                insights.append(f"Mature project with {commit_count} commits")
            elif commit_count > 100:
                insights.append(f"Active development with {commit_count} commits")
            elif commit_count > 10:
                insights.append(f"Early development stage with {commit_count} commits")
        
        # Project-specific insights based on detected type
        if self.insights_data["projectType"] == "Development Environment":
            insights.append("AI-powered development environment with intelligent code analysis capabilities")
            recommendations.append("Consider implementing user authentication and project management features")
            recommendations.append("Add real-time collaboration features for team development")
        
        self.insights_data["insights"] = insights
        self.insights_data["recommendations"] = recommendations
        self.insights_data["securityFindings"] = security_findings
        self.insights_data["performanceInsights"] = performance_insights
        
        print(f"💡 Generated {len(insights)} insights and {len(recommendations)} recommendations")

    def generate_ai_analysis(self):
        """Generate AI-powered analysis using Gemini API."""
        if not self.api_key:
            print("⚠️  No API key provided - skipping AI analysis")
            self.insights_data["aiSummary"] = "AI analysis skipped - no API key provided"
            return {}
        
        print("🤖 Generating AI analysis...")
        
        try:
            import requests
            
            # Prepare comprehensive project summary for AI
            project_summary = {
                "projectName": self.insights_data["projectName"],
                "projectType": self.insights_data["projectType"],
                "totalFiles": self.insights_data["totalFiles"],
                "totalLinesOfCode": self.insights_data["totalLinesOfCode"],
                "technologies": self.insights_data["technologies"][:10],  # Limit for API
                "frameworks": self.insights_data["frameworks"],
                "languages": self.insights_data["languages"],
                "buildSystems": self.insights_data["buildSystems"],
                "testingFrameworks": self.insights_data["testingFrameworks"],
                "fileTypes": dict(list(self.insights_data["fileTypes"].items())[:10]),
                "dependencyCount": sum(deps.get('total_count', 0) for deps in self.insights_data["dependencies"].values()),
                "hasGit": self.insights_data["gitInfo"]["isGitRepo"],
                "hasTests": len(self.insights_data["testFiles"]) > 0,
                "hasDocumentation": len(self.insights_data["documentationFiles"]) > 0,
                "mainEntryPoints": self.insights_data["mainEntryPoints"][:5],
                "runCommands": self.insights_data["runCommands"][:3]
            }
            
            prompt = f"""
            As a senior software architect, analyze this project comprehensively:
            
            Project Data:
            {json.dumps(project_summary, indent=2)}
            
            Provide a detailed analysis including:
            1. Executive Summary: Brief overview of the project
            2. Architecture Assessment: Evaluate structure and design patterns
            3. Technology Stack Analysis: Assess technology choices and compatibility
            4. Security Assessment: Identify potential security concerns
            5. Performance Analysis: Evaluate performance implications
            6. Maintainability Score: Rate from 1-10 with explanation
            7. Strategic Recommendations: Top 3 priority improvements
            
            Respond in valid JSON format with these exact keys:
            {{
                "summary": "executive summary text",
                "architecture_assessment": "architecture analysis text",
                "technology_evaluation": "technology stack analysis text", 
                "security_analysis": "security assessment text",
                "performance_analysis": "performance evaluation text",
                "maintainability_score": 8,
                "strategic_recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
            }}
            """
            
            headers = {'Content-Type': 'application/json'}
            data = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 3000,
                    "topP": 0.8,
                    "topK": 10
                }
            }
            
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={self.api_key}',
                headers=headers,
                json=data,
                timeout=45
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and result['candidates']:
                    text_response = result['candidates'][0]['content']['parts'][0]['text']
                    
                    try:
                        # Extract JSON from response
                        import re
                        json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
                        if json_match:
                            ai_analysis = json.loads(json_match.group())
                            
                            # Store AI analysis results in insights data
                            self.insights_data["aiSummary"] = ai_analysis.get("summary", "")
                            self.insights_data["aiArchitectureAnalysis"] = ai_analysis.get("architecture_assessment", "")
                            self.insights_data["aiTechnologyRecommendations"] = ai_analysis.get("strategic_recommendations", [])
                            self.insights_data["aiSecurityAssessment"] = ai_analysis.get("security_analysis", "")
                            self.insights_data["aiPerformanceAnalysis"] = ai_analysis.get("performance_analysis", "")
                            
                            # Add AI recommendations to the main recommendations list
                            if ai_analysis.get("strategic_recommendations"):
                                self.insights_data["recommendations"].extend(ai_analysis["strategic_recommendations"])
                            
                            print("🤖 AI analysis completed successfully")
                            return ai_analysis
                        else:
                            # If JSON extraction fails, store the raw response
                            self.insights_data["aiSummary"] = text_response[:1000] + "..." if len(text_response) > 1000 else text_response
                            print("🤖 AI analysis completed (raw text format)")
                            return {"raw_response": text_response}
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Failed to parse AI response as JSON: {e}")
                        self.insights_data["aiSummary"] = text_response[:500] + "..."
                        return {"error": "Failed to parse JSON response", "raw_response": text_response}
            else:
                error_msg = f"API request failed with status {response.status_code}"
                print(f"⚠️  {error_msg}")
                self.insights_data["aiSummary"] = f"AI analysis failed: {error_msg}"
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            error_msg = "AI analysis timed out"
            print(f"⚠️  {error_msg}")
            self.insights_data["aiSummary"] = error_msg
            return {"error": error_msg}
        except Exception as e:
            error_msg = f"AI analysis error: {str(e)}"
            print(f"⚠️  {error_msg}")
            self.insights_data["aiSummary"] = error_msg
            return {"error": error_msg}

    def calculate_quality_metrics(self):
        """Calculate comprehensive code quality metrics."""
        print("📊 Calculating quality metrics...")
        
        # Define quality factors with weights
        quality_factors = {
            "hasTests": {
                "value": len(self.insights_data["testFiles"]) > 0,
                "weight": 0.25,
                "description": "Automated testing implementation"
            },
            "hasDocumentation": {
                "value": len(self.insights_data["documentationFiles"]) > 0,
                "weight": 0.15,
                "description": "Project documentation"
            },
            "hasGit": {
                "value": self.insights_data["gitInfo"]["isGitRepo"],
                "weight": 0.10,
                "description": "Version control usage"
            },
            "hasBuildSystem": {
                "value": len(self.insights_data["buildSystems"]) > 0,
                "weight": 0.15,
                "description": "Build system implementation"
            },
            "moderateDependencies": {
                "value": sum(deps.get('total_count', 0) for deps in self.insights_data["dependencies"].values()) < 150,
                "weight": 0.10,
                "description": "Reasonable dependency count"
            },
            "hasFrameworks": {
                "value": len(self.insights_data["frameworks"]) > 0,
                "weight": 0.10,
                "description": "Modern framework usage"
            },
            "goodFileOrganization": {
                "value": self.insights_data["totalFiles"] > 5 and len(self.insights_data["fileTypes"]) > 2,
                "weight": 0.10,
                "description": "File organization and structure"
            },
            "hasTypeScript": {
                "value": 'TypeScript' in self.insights_data["technologies"],
                "weight": 0.05,
                "description": "Type safety implementation"
            }
        }
        
        # Calculate weighted quality score
        total_weight = sum(factor["weight"] for factor in quality_factors.values())
        weighted_score = sum(
            factor["weight"] * (1 if factor["value"] else 0) 
            for factor in quality_factors.values()
        )
        quality_score = (weighted_score / total_weight) * 10
        
        # Additional complexity metrics
        complexity_metrics = {
            "averageFileSize": (
                sum(file_info.get("size", 0) for file_info in self.insights_data["fileStructure"].values()) /
                max(len(self.insights_data["fileStructure"]), 1)
            ),
            "averageLinesPerFile": (
                self.insights_data["totalLinesOfCode"] / 
                max(len([f for f in self.insights_data["fileStructure"].values() if f.get("lines", 0) > 0]), 1)
            ),
            "fileTypeDistribution": self.insights_data["fileTypes"],
            "dependencyDensity": (
                sum(deps.get('total_count', 0) for deps in self.insights_data["dependencies"].values()) /
                max(self.insights_data["totalLinesOfCode"], 1) * 1000  # Dependencies per 1000 lines
            )
        }
        
        self.insights_data["codeQualityMetrics"] = {
            "overallScore": round(quality_score, 1),
            "maxScore": 10.0,
            "factors": {k: {"passed": v["value"], "description": v["description"]} 
                      for k, v in quality_factors.items()},
            "complexity": complexity_metrics,
            "recommendations": []
        }
        
        # Generate quality-specific recommendations
        quality_recommendations = []
        for factor_name, factor_data in quality_factors.items():
            if not factor_data["value"]:
                if factor_name == "hasTests":
                    quality_recommendations.append("Implement automated testing with a testing framework")
                elif factor_name == "hasDocumentation":
                    quality_recommendations.append("Add comprehensive project documentation")
                elif factor_name == "hasGit":
                    quality_recommendations.append("Initialize Git repository for version control")
                elif factor_name == "hasBuildSystem":
                    quality_recommendations.append("Implement a build system for consistent builds")
                elif factor_name == "hasFrameworks":
                    quality_recommendations.append("Consider adopting modern frameworks for better development experience")
        
        self.insights_data["codeQualityMetrics"]["recommendations"] = quality_recommendations
        
        print(f"📊 Quality score: {quality_score:.1f}/10")
        print(f"📊 Quality factors passed: {sum(1 for f in quality_factors.values() if f['value'])}/{len(quality_factors)}")

    def create_insightsproject_ia_file(self):
        """Create the insightsproject.ia file with all analysis data."""
        print("💾 Creating insightsproject.ia file...")
        
        try:
            insights_file_path = self.project_path / "insightsproject.ia"
            
            # Update final timestamps
            self.insights_data["lastModified"] = datetime.now().isoformat()
            self.insights_data["lastAnalyzed"] = datetime.now().isoformat()
            
            # Clean and deduplicate lists
            self.insights_data["recommendations"] = list(dict.fromkeys(self.insights_data["recommendations"]))  # Remove duplicates while preserving order
            self.insights_data["setupInstructions"] = list(dict.fromkeys(self.insights_data["setupInstructions"]))
            self.insights_data["runCommands"] = list(dict.fromkeys(self.insights_data["runCommands"]))
            self.insights_data["configFiles"] = list(dict.fromkeys(self.insights_data["configFiles"]))
            
            # Ensure all required fields are present
            required_fields = [
                "version", "projectId", "projectName", "projectPath", "createdAt", 
                "lastModified", "lastAnalyzed", "technologies", "frameworks", 
                "languages", "totalFiles", "totalLinesOfCode", "fileTypes", 
                "dependencies", "projectType", "insights", "recommendations"
            ]
            
            for field in required_fields:
                if field not in self.insights_data:
                    self.insights_data[field] = [] if field in ["technologies", "frameworks", "languages", "insights", "recommendations"] else ""
            
            # Write the insights file with proper formatting
            with open(insights_file_path, 'w', encoding='utf-8') as f:
                json.dump(self.insights_data, f, indent=2, ensure_ascii=False, sort_keys=False)
            
            file_size_kb = insights_file_path.stat().st_size / 1024
            
            print(f"✅ insightsproject.ia file created successfully")
            print(f"📁 Location: {insights_file_path}")
            print(f"📊 File size: {file_size_kb:.1f} KB")
            
            return str(insights_file_path)
            
        except Exception as e:
            print(f"❌ Failed to create insightsproject.ia file: {e}")
            import traceback
            traceback.print_exc()
            return None

    def run_comprehensive_analysis(self):
        """Run the complete comprehensive analysis."""
        print(f"🚀 Starting comprehensive analysis of: {self.project_path}")
        print(f"📅 Analysis started at: {self.start_time.isoformat()}")
        print(f"🎯 Target directory: {self.project_path}")
        print("=" * 80)
        
        try:
            # Step 1: File scanning
            print("📂 STEP 1: Comprehensive File Scanning")
            self.scan_comprehensive_files()
            print()
            
            # Step 2: Technology detection
            print("🔧 STEP 2: Technology Detection")
            self.detect_comprehensive_technologies()
            print()
            
            # Step 3: Dependency analysis
            print("📦 STEP 3: Dependency Analysis")
            self.analyze_dependencies_comprehensive()
            print()
            
            # Step 4: Project type detection
            print("🎯 STEP 4: Project Type Detection")
            self.detect_project_type()
            print()
            
            # Step 5: Git analysis
            print("📊 STEP 5: Git Repository Analysis")
            self.analyze_git_repository()
            print()
            
            # Step 6: Generate insights
            print("💡 STEP 6: Insight Generation")
            self.generate_comprehensive_insights()
            print()
            
            # Step 7: Quality metrics
            print("📊 STEP 7: Quality Metrics Calculation")
            self.calculate_quality_metrics()
            print()
            
            # Step 8: AI analysis (if API key provided)
            print("🤖 STEP 8: AI-Powered Analysis")
            ai_result = self.generate_ai_analysis()
            print()
            
            # Step 9: Create insightsproject.ia file
            print("💾 STEP 9: Creating insightsproject.ia File")
            insights_file = self.create_insightsproject_ia_file()
            print()
            
            # Summary
            end_time = datetime.now()
            duration = (end_time - self.start_time).total_seconds()
            
            print("=" * 80)
            print("✅ COMPREHENSIVE ANALYSIS COMPLETE")
            print("=" * 80)
            print(f"📊 Analysis Results Summary:")
            print(f"   • Project: {self.insights_data['projectName']}")
            print(f"   • Type: {self.insights_data['projectType']}")
            print(f"   • Files: {self.insights_data['totalFiles']:,}")
            print(f"   • Lines of Code: {self.insights_data['totalLinesOfCode']:,}")
            print(f"   • Technologies: {len(self.insights_data['technologies'])} ({', '.join(self.insights_data['technologies'][:5])}{'...' if len(self.insights_data['technologies']) > 5 else ''})")
            print(f"   • Languages: {', '.join(self.insights_data['languages']) if self.insights_data['languages'] else 'None detected'}")
            print(f"   • Frameworks: {', '.join(self.insights_data['frameworks']) if self.insights_data['frameworks'] else 'None detected'}")
            print(f"   • Dependencies: {sum(deps.get('total_count', 0) for deps in self.insights_data['dependencies'].values())}")
            print(f"   • Quality Score: {self.insights_data['codeQualityMetrics']['overallScore']}/10")
            print(f"   • Insights Generated: {len(self.insights_data['insights'])}")
            print(f"   • Recommendations: {len(self.insights_data['recommendations'])}")
            print(f"   • Analysis Duration: {duration:.1f} seconds")
            
            if insights_file:
                print(f"   • insightsproject.ia: ✅ Created successfully")
            else:
                print(f"   • insightsproject.ia: ❌ Creation failed")
            
            if ai_result and not ai_result.get('error'):
                print(f"   • AI Analysis: ✅ Completed successfully")
            elif self.api_key:
                print(f"   • AI Analysis: ⚠️  Failed - {ai_result.get('error', 'Unknown error')}")
            else:
                print(f"   • AI Analysis: ⚠️  Skipped (no API key provided)")
            
            print("=" * 80)
            print("🎉 Analysis complete! The insightsproject.ia file contains comprehensive")
            print("   project data for AI consumption and development insights.")
            
            return self.insights_data
            
        except Exception as e:
            print(f"❌ Analysis failed with error: {e}")
            import traceback
            traceback.print_exc()
            return None

def main():
    """Main function to run comprehensive analysis."""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(
        description='LeviatanCode Comprehensive Project Analyzer',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python comprehensive_analyzer.py                                    # Analyze current directory
  python comprehensive_analyzer.py C:\\ReactProjects\\LeviatanCode      # Analyze specific directory
  python comprehensive_analyzer.py . --api-key YOUR_GEMINI_KEY        # Include AI analysis
  python comprehensive_analyzer.py /project --output analysis.json    # Save additional output
        '''
    )
    
    parser.add_argument('path', nargs='?', default='.', 
                        help='Project path to analyze (default: current directory)')
    parser.add_argument('--api-key', 
                        help='Gemini API key for AI-powered analysis')
    parser.add_argument('--output', 
                        help='Additional output file for analysis results (JSON format)')
    parser.add_argument('--verbose', '-v', action='store_true',
                        help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Validate project path
    project_path = Path(args.path).resolve()
    if not project_path.exists():
        print(f"❌ Error: Project path does not exist: {project_path}")
        sys.exit(1)
    
    if not project_path.is_dir():
        print(f"❌ Error: Project path is not a directory: {project_path}")
        sys.exit(1)
    
    try:
        # Initialize and run comprehensive analysis
        analyzer = ComprehensiveProjectAnalyzer(str(project_path), args.api_key)
        results = analyzer.run_comprehensive_analysis()
        
        if results is None:
            print("❌ Analysis failed")
            sys.exit(1)
        
        # Save additional results if output file specified
        if args.output:
            output_file = Path(args.output)
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"📄 Additional results saved to: {output_file}")
            print(f"📊 Output file size: {output_file.stat().st_size / 1024:.1f} KB")
        
        print(f"\n🎯 Primary output: insightsproject.ia file in {project_path}")
        print("📖 This file contains all analysis data for AI consumption")
        
        # Success exit
        sys.exit(0)
        
    except KeyboardInterrupt:
        print("\n❌ Analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error during analysis: {e}")
        import traceback
        if args.verbose:
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()