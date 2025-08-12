#!/usr/bin/env python3
"""
LeviatanCode Comprehensive Project Analyzer
Advanced project analysis tool that creates complete insightsproject.ia files
Run in specific project directory: C:\ReactProjects\LeviatanCode
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
            'site-packages', 'lib', 'lib64', 'include', 'Scripts', 'pyvenv.cfg',
            'logs', 'temp', 'tmp', '.temp', '.tmp', 'uploads', '.pytest_cache',
            '*.pyc', '*.log', '*.tmp', '*.cache', '*.lock', '*.pyo', '*.pyd'
        }
        
        important_files = {
            'package.json', 'requirements.txt', 'pom.xml', 'build.gradle',
            'Cargo.toml', 'go.mod', 'composer.json', 'Gemfile',
            'setup.py', 'pyproject.toml', 'CMakeLists.txt', 'Makefile',
            'Dockerfile', 'docker-compose.yml', '.env', '.env.example',
            'README.md', 'README.txt', 'CHANGELOG.md', 'LICENSE',
            'tsconfig.json', 'babel.config.js', 'webpack.config.js',
            'vite.config.js', 'rollup.config.js', 'jest.config.js'
        }
        
        entry_point_patterns = [
            'index.js', 'index.ts', 'main.py', 'app.py', 'server.js',
            'main.js', 'main.ts', 'App.js', 'App.tsx', 'main.go',
            'main.java', 'Program.cs', 'main.cpp', 'main.c'
        ]
        
        file_count = 0
        total_lines = 0
        max_files = 5000  # Limit analysis to prevent timeouts
        
        for root, dirs, files in os.walk(self.project_path):
            # Filter out ignored directories  
            dirs[:] = [d for d in dirs if d not in ignore_patterns]
            
            # Skip very deep nested directories (usually dependencies)
            current_depth = len(Path(root).relative_to(self.project_path).parts)
            if current_depth > 6:
                dirs.clear()  # Don't recurse deeper
                continue
                
            # Early termination if too many files
            if file_count > max_files:
                print(f"⚠️ Analysis limited to {max_files} files to prevent timeout")
                break
            
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
                    
                    if 'test' in relative_path.lower() or file.lower().endswith(('.test.js', '.test.ts', '.spec.js', '.spec.ts')):
                        self.insights_data["testFiles"].append(relative_path)
                    
                    if file.lower().endswith(('.md', '.txt', '.rst', '.adoc')):
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
            'React': [r'import.*react', r'"react":', r'useState', r'useEffect', r'jsx'],
            'Vue.js': [r'import.*vue', r'"vue":', r'<template>', r'v-if', r'v-for'],
            'Angular': [r'@angular', r'ng-', r'angular\.json', r'@Component'],
            'Svelte': [r'\.svelte$', r'svelte'],
            'Next.js': [r'next', r'getStaticProps', r'getServerSideProps'],
            
            # Backend Frameworks  
            'Express.js': [r'"express":', r'app\.listen', r'app\.get', r'express\(\)'],
            'Django': [r'django', r'models\.Model', r'settings\.py', r'urls\.py'],
            'Flask': [r'from flask', r'Flask\(__name__\)', r'@app\.route'],
            'FastAPI': [r'from fastapi', r'FastAPI\(\)', r'@app\.get'],
            'Spring Framework': [r'@SpringBootApplication', r'@Controller', r'spring-boot'],
            
            # Languages
            'JavaScript': [r'\.js$', r'\.mjs$', r'function ', r'const ', r'let '],
            'TypeScript': [r'\.ts$', r'\.tsx$', r'interface ', r'type '],
            'Python': [r'\.py$', r'import ', r'def ', r'class '],
            'Java': [r'\.java$', r'public class', r'import java'],
            'C#': [r'\.cs$', r'using System', r'namespace '],
            'C++': [r'\.cpp$', r'\.hpp$', r'#include <', r'std::'],
            'Go': [r'\.go$', r'package main', r'import "'],
            'Rust': [r'\.rs$', r'Cargo\.toml', r'fn main'],
            'PHP': [r'\.php$', r'<?php', r'namespace '],
            'Ruby': [r'\.rb$', r'Gemfile', r'require '],
            
            # Databases
            'PostgreSQL': [r'postgresql', r'psql', r'pg_'],
            'MySQL': [r'mysql', r'CREATE TABLE'],
            'MongoDB': [r'mongodb', r'mongoose'],
            'Redis': [r'redis', r'REDIS_URL'],
            'SQLite': [r'sqlite', r'\.db$'],
            
            # DevOps & Infrastructure
            'Docker': [r'Dockerfile', r'docker-compose', r'FROM '],
            'Kubernetes': [r'\.yaml$', r'\.yml$', r'apiVersion:'],
            'Git': [r'\.git/', r'\.gitignore'],
            
            # Testing
            'Jest': [r'jest', r'describe\(', r'it\(', r'test\('],
            'Mocha': [r'mocha', r'describe\(', r'it\('],
            'PyTest': [r'pytest', r'test_'],
            
            # Build Tools
            'Webpack': [r'webpack', r'webpack\.config'],
            'Vite': [r'vite', r'vite\.config'],
            'npm': [r'package\.json', r'package-lock\.json'],
            'Yarn': [r'yarn\.lock'],
            'pip': [r'requirements\.txt'],
            'Maven': [r'pom\.xml'],
            'Gradle': [r'build\.gradle'],
            'Make': [r'Makefile'],
            'Cargo': [r'Cargo\.toml']
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
                    if tech in ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js']:
                        detected_frameworks.add(tech)
                    elif tech in ['Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Framework']:
                        detected_frameworks.add(tech)
                    elif tech in ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby']:
                        detected_languages.add(tech)
                    elif tech in ['Webpack', 'Vite', 'npm', 'Yarn', 'pip', 'Maven', 'Gradle', 'Make', 'Cargo']:
                        detected_build_systems.add(tech)
                    elif tech in ['Jest', 'Mocha', 'PyTest']:
                        detected_testing.add(tech)
                    break
        
        self.insights_data["technologies"] = sorted(list(detected_techs))
        self.insights_data["frameworks"] = sorted(list(detected_frameworks))
        self.insights_data["languages"] = sorted(list(detected_languages))
        self.insights_data["buildSystems"] = sorted(list(detected_build_systems))
        self.insights_data["testingFrameworks"] = sorted(list(detected_testing))
        
        print(f"🔍 Detected {len(detected_techs)} technologies")

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
                "total_count": len(data.get('dependencies', {})) + len(data.get('devDependencies', {}))
            }
            
            # Extract setup and run commands
            scripts = data.get('scripts', {})
            if 'start' in scripts:
                self.insights_data["runCommands"].append(f"npm start")
            if 'dev' in scripts:
                self.insights_data["runCommands"].append(f"npm run dev")
            if 'build' in scripts:
                self.insights_data["setupInstructions"].append(f"npm run build")
            
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
                "pip install -r requirements.txt"
            ])
            
            if (self.project_path / "app.py").exists():
                self.insights_data["runCommands"].append("python app.py")
            if (self.project_path / "main.py").exists():
                self.insights_data["runCommands"].append("python main.py")
            
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_poetry_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Poetry pyproject.toml."""
        try:
            import tomllib
        except ImportError:
            return {}
        
        try:
            content = file_path.read_text()
            data = tomllib.loads(content)
            
            tool_poetry = data.get('tool', {}).get('poetry', {})
            deps = tool_poetry.get('dependencies', {})
            
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
            return {"dependencies": deps, "total_count": len(deps)}
        except:
            return {}

    def analyze_cargo_dependencies(self, file_path: Path) -> Dict[str, Any]:
        """Analyze Rust Cargo.toml."""
        try:
            import tomllib
        except ImportError:
            return {}
        
        try:
            content = file_path.read_text()
            data = tomllib.loads(content)
            deps = data.get('dependencies', {})
            
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
                'package.json', 'index.html', 'React', 'Vue.js', 'Angular', 'Express.js'
            ],
            "API/Backend Service": [
                'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Framework'
            ],
            "Desktop Application": [
                'electron', 'tauri', 'PyQt', 'tkinter'
            ],
            "Library/Package": [
                'setup.py', 'pyproject.toml', 'lib/', 'src/'
            ],
            "Documentation": [
                'docs/', 'README.md', '.md'
            ]
        }
        
        scores = {}
        all_indicators = (
            " ".join(self.insights_data["technologies"]) + " " +
            " ".join(self.insights_data["configFiles"]) + " " +
            " ".join(self.insights_data["fileStructure"].keys())
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
                        self.insights_data["gitInfo"]["branchCount"] = len(branches)
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
            recommendations.append("Consider implementing code organization strategies")
        elif self.insights_data["totalFiles"] > 100:
            insights.append(f"Medium-scale project with {self.insights_data['totalFiles']} files")
        else:
            insights.append(f"Small project with {self.insights_data['totalFiles']} files")
        
        # Code volume insights
        if self.insights_data["totalLinesOfCode"] > 100000:
            insights.append(f"Substantial codebase with {self.insights_data['totalLinesOfCode']:,} lines of code")
            recommendations.append("Implement comprehensive testing strategy")
        elif self.insights_data["totalLinesOfCode"] > 10000:
            insights.append(f"Moderate codebase with {self.insights_data['totalLinesOfCode']:,} lines of code")
            recommendations.append("Implement automated testing")
        
        # Technology insights
        tech_count = len(self.insights_data["technologies"])
        if tech_count > 15:
            insights.append(f"Highly diverse technology stack with {tech_count} technologies")
            recommendations.append("Document technology choices and maintain expertise")
        elif tech_count > 8:
            insights.append(f"Multi-technology project using {tech_count} technologies")
        
        # Framework insights
        if self.insights_data["frameworks"]:
            insights.append(f"Uses modern frameworks: {', '.join(self.insights_data['frameworks'])}")
            recommendations.append("Keep frameworks updated for security")
        
        # Dependency analysis
        total_deps = sum(deps.get('total_count', 0) for deps in self.insights_data["dependencies"].values())
        if total_deps > 100:
            insights.append(f"Heavy dependency usage: {total_deps} total dependencies")
            recommendations.append("Regularly audit dependencies for vulnerabilities")
            security_findings.append("Large number of dependencies increases attack surface")
        elif total_deps > 50:
            insights.append(f"Moderate dependency usage: {total_deps} dependencies")
        
        # Testing insights
        if self.insights_data["testingFrameworks"]:
            insights.append(f"Testing frameworks: {', '.join(self.insights_data['testingFrameworks'])}")
        else:
            recommendations.append("Consider implementing automated testing")
        
        # Security insights
        if 'Docker' in self.insights_data["technologies"]:
            insights.append("Containerized application using Docker")
            security_findings.append("Ensure Docker images are regularly updated")
        
        # Documentation insights
        if len(self.insights_data["documentationFiles"]) > 5:
            insights.append(f"Well-documented project with {len(self.insights_data['documentationFiles'])} documentation files")
        else:
            recommendations.append("Consider adding more documentation")
        
        self.insights_data["insights"] = insights
        self.insights_data["recommendations"] = recommendations
        self.insights_data["securityFindings"] = security_findings
        self.insights_data["performanceInsights"] = performance_insights

    def generate_ai_analysis(self):
        """Generate AI-powered analysis using Gemini API."""
        if not self.api_key:
            print("⚠️  No API key provided - skipping AI analysis")
            return
        
        print("🤖 Generating AI analysis...")
        
        try:
            import requests
            
            project_summary = {
                "projectType": self.insights_data["projectType"],
                "totalFiles": self.insights_data["totalFiles"],
                "totalLinesOfCode": self.insights_data["totalLinesOfCode"],
                "technologies": self.insights_data["technologies"],
                "frameworks": self.insights_data["frameworks"],
                "languages": self.insights_data["languages"],
                "dependencies": {k: v.get('total_count', 0) for k, v in self.insights_data["dependencies"].items()}
            }
            
            prompt = f"""
            Analyze this software project and provide detailed insights:
            
            {json.dumps(project_summary, indent=2)}
            
            Provide:
            1. Architecture assessment
            2. Technology evaluation  
            3. Security analysis
            4. Performance recommendations
            5. Maintainability score (1-10)
            
            Respond in JSON format with keys: summary, architecture_assessment, 
            technology_evaluation, security_analysis, performance_analysis, maintainability_score
            """
            
            headers = {'Content-Type': 'application/json'}
            data = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048}
            }
            
            response = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={self.api_key}',
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and result['candidates']:
                    text_response = result['candidates'][0]['content']['parts'][0]['text']
                    
                    try:
                        import re
                        json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
                        if json_match:
                            ai_analysis = json.loads(json_match.group())
                            self.insights_data["aiSummary"] = ai_analysis.get("summary", "")
                            self.insights_data["aiArchitectureAnalysis"] = ai_analysis.get("architecture_assessment", "")
                            self.insights_data["aiSecurityAssessment"] = ai_analysis.get("security_analysis", "")
                            self.insights_data["aiPerformanceAnalysis"] = ai_analysis.get("performance_analysis", "")
                            
                            print("🤖 AI analysis completed successfully")
                            return ai_analysis
                    except:
                        self.insights_data["aiSummary"] = text_response[:500] + "..."
            
            print("⚠️  AI analysis failed")
            return {}
                
        except Exception as e:
            print(f"⚠️  AI analysis error: {e}")
            return {}

    def calculate_quality_metrics(self):
        """Calculate code quality metrics."""
        print("📊 Calculating quality metrics...")
        
        quality_factors = {
            "hasTests": len(self.insights_data["testFiles"]) > 0,
            "hasDocumentation": len(self.insights_data["documentationFiles"]) > 0,
            "hasGit": self.insights_data["gitInfo"]["isGitRepo"],
            "hasBuildSystem": len(self.insights_data["buildSystems"]) > 0,
            "moderateDependencies": sum(deps.get('total_count', 0) for deps in self.insights_data["dependencies"].values()) < 100
        }
        
        quality_score = sum(quality_factors.values()) / len(quality_factors) * 10
        
        self.insights_data["codeQualityMetrics"] = {
            "overallScore": round(quality_score, 1),
            "factors": quality_factors
        }
        
        print(f"📊 Quality score: {quality_score:.1f}/10")

    def create_insightsproject_ia_file(self):
        """Create the insightsproject.ia file with all analysis data."""
        print("💾 Creating insightsproject.ia file...")
        
        try:
            insights_file_path = self.project_path / "insightsproject.ia"
            
            # Update final timestamps
            self.insights_data["lastModified"] = datetime.now().isoformat()
            self.insights_data["lastAnalyzed"] = datetime.now().isoformat()
            
            # Remove duplicates from lists
            self.insights_data["recommendations"] = list(set(self.insights_data["recommendations"]))
            self.insights_data["setupInstructions"] = list(set(self.insights_data["setupInstructions"]))
            self.insights_data["runCommands"] = list(set(self.insights_data["runCommands"]))
            
            # Write the insights file
            with open(insights_file_path, 'w', encoding='utf-8') as f:
                json.dump(self.insights_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ insightsproject.ia file created at: {insights_file_path}")
            print(f"📊 File size: {insights_file_path.stat().st_size / 1024:.1f} KB")
            
            return str(insights_file_path)
            
        except Exception as e:
            print(f"❌ Failed to create insightsproject.ia file: {e}")
            return None

    def run_comprehensive_analysis(self):
        """Run the complete comprehensive analysis."""
        print(f"🚀 Starting comprehensive analysis of: {self.project_path}")
        print(f"📅 Analysis started at: {self.start_time.isoformat()}")
        print("=" * 80)
        
        # Step 1: File scanning
        self.scan_comprehensive_files()
        print()
        
        # Step 2: Technology detection
        self.detect_comprehensive_technologies()
        print()
        
        # Step 3: Dependency analysis
        self.analyze_dependencies_comprehensive()
        print()
        
        # Step 4: Project type detection
        self.detect_project_type()
        print()
        
        # Step 5: Git analysis
        self.analyze_git_repository()
        print()
        
        # Step 6: Generate insights
        self.generate_comprehensive_insights()
        print()
        
        # Step 7: Quality metrics
        self.calculate_quality_metrics()
        print()
        
        # Step 8: AI analysis (if API key provided)
        ai_result = self.generate_ai_analysis()
        print()
        
        # Step 9: Create insightsproject.ia file
        insights_file = self.create_insightsproject_ia_file()
        print()
        
        # Summary
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        print("=" * 80)
        print("✅ COMPREHENSIVE ANALYSIS COMPLETE")
        print("=" * 80)
        print(f"📊 Analysis Results:")
        print(f"   • Project Type: {self.insights_data['projectType']}")
        print(f"   • Total Files: {self.insights_data['totalFiles']:,}")
        print(f"   • Lines of Code: {self.insights_data['totalLinesOfCode']:,}")
        print(f"   • Technologies: {len(self.insights_data['technologies'])}")
        print(f"   • Languages: {', '.join(self.insights_data['languages'])}")
        print(f"   • Dependencies: {sum(deps.get('total_count', 0) for deps in self.insights_data['dependencies'].values())}")
        print(f"   • Quality Score: {self.insights_data['codeQualityMetrics']['overallScore']}/10")
        print(f"   • Insights: {len(self.insights_data['insights'])}")
        print(f"   • Recommendations: {len(self.insights_data['recommendations'])}")
        print(f"   • Duration: {duration:.1f} seconds")
        
        if insights_file:
            print(f"   • insightsproject.ia: ✅ Created successfully")
        
        if ai_result:
            print(f"   • AI Analysis: ✅ Completed")
        else:
            print(f"   • AI Analysis: ⚠️  Skipped (no API key)")
        
        print("=" * 80)
        
        return self.insights_data

def main():
    """Main function to run comprehensive analysis."""
    import argparse
    
    parser = argparse.ArgumentParser(description='LeviatanCode Comprehensive Project Analyzer')
    parser.add_argument('path', nargs='?', default='.', help='Project path to analyze')
    parser.add_argument('--api-key', help='Gemini API key for AI analysis')
    parser.add_argument('--output', help='Output JSON file path')
    
    args = parser.parse_args()
    
    # Validate project path
    project_path = Path(args.path).resolve()
    if not project_path.exists():
        print(f"❌ Error: Project path does not exist: {project_path}")
        sys.exit(1)
    
    try:
        # Run comprehensive analysis
        analyzer = ComprehensiveProjectAnalyzer(str(project_path), args.api_key)
        results = analyzer.run_comprehensive_analysis()
        
        # Save results if output specified
        if args.output:
            output_file = Path(args.output)
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"📄 Results saved to: {output_file}")
        
        sys.exit(0)
        
    except KeyboardInterrupt:
        print("\n❌ Analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()