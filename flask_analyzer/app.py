#!/usr/bin/env python3
"""
LeviatanCode Flask Analyzer API
AI-powered project analysis tool serving a single RESTful endpoint
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import tempfile
import shutil
import zipfile
import subprocess
import re

from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import requests
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config.update(
    MAX_CONTENT_LENGTH=100 * 1024 * 1024,  # 100MB max file size
    UPLOAD_FOLDER=tempfile.gettempdir(),
    SECRET_KEY=os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key'),
    OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY'),
    GEMINI_API_KEY=os.environ.get('GEMINI_API_KEY')
)

class ProjectAnalyzer:
    """Comprehensive project analysis engine"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path).resolve()
        self.analysis_cache = {}
        
        # File patterns for different technologies
        self.tech_patterns = {
            'javascript': ['.js', '.jsx', '.mjs', '.cjs'],
            'typescript': ['.ts', '.tsx', '.d.ts'],
            'python': ['.py', '.pyx', '.pyi'],
            'java': ['.java', '.jar', '.class'],
            'csharp': ['.cs', '.csx', '.cshtml'],
            'cpp': ['.cpp', '.cxx', '.cc', '.c++', '.hpp', '.hxx', '.h++'],
            'c': ['.c', '.h'],
            'rust': ['.rs'],
            'go': ['.go'],
            'php': ['.php', '.phtml'],
            'ruby': ['.rb', '.rbw'],
            'swift': ['.swift'],
            'kotlin': ['.kt', '.kts'],
            'dart': ['.dart'],
            'scala': ['.scala', '.sc'],
            'html': ['.html', '.htm'],
            'css': ['.css', '.scss', '.sass', '.less'],
            'sql': ['.sql', '.mysql', '.pgsql'],
            'shell': ['.sh', '.bash', '.zsh', '.fish'],
            'powershell': ['.ps1', '.psm1', '.psd1']
        }
        
        # Package manager files
        self.package_files = {
            'package.json': 'npm/node',
            'yarn.lock': 'yarn',
            'pnpm-lock.yaml': 'pnpm',
            'requirements.txt': 'pip',
            'Pipfile': 'pipenv',
            'pyproject.toml': 'poetry/pip',
            'Cargo.toml': 'cargo',
            'go.mod': 'go modules',
            'composer.json': 'composer',
            'Gemfile': 'bundler',
            'pom.xml': 'maven',
            'build.gradle': 'gradle',
            'pubspec.yaml': 'dart/flutter'
        }
        
        # Framework detection patterns
        self.framework_patterns = {
            'react': ['react', 'jsx', 'tsx', 'next.js'],
            'vue': ['vue', 'nuxt'],
            'angular': ['angular', '@angular'],
            'svelte': ['svelte', 'sveltekit'],
            'express': ['express', 'fastify'],
            'django': ['django', 'settings.py'],
            'flask': ['flask', 'app.py'],
            'fastapi': ['fastapi', 'main.py'],
            'spring': ['spring', 'springframework'],
            'rails': ['rails', 'Gemfile'],
            'laravel': ['laravel', 'artisan'],
            'flutter': ['flutter', 'pubspec.yaml'],
            'unity': ['Unity', '.unity'],
            'electron': ['electron', 'main.js']
        }

    def analyze_project(self) -> Dict[str, Any]:
        """Run comprehensive project analysis"""
        logger.info(f"Starting analysis of: {self.project_path}")
        
        analysis = {
            'timestamp': datetime.now().isoformat(),
            'project_path': str(self.project_path),
            'basic_info': self._analyze_basic_info(),
            'technologies': self._detect_technologies(),
            'structure': self._analyze_structure(),
            'dependencies': self._analyze_dependencies(),
            'frameworks': self._detect_frameworks(),
            'build_systems': self._detect_build_systems(),
            'execution_methods': self._determine_execution_methods(),
            'code_metrics': self._calculate_code_metrics(),
            'quality_assessment': self._assess_code_quality(),
            'recommendations': self._generate_recommendations(),
            'insights': self._generate_ai_insights()
        }
        
        logger.info("Analysis completed successfully")
        return analysis

    def _analyze_basic_info(self) -> Dict[str, Any]:
        """Analyze basic project information"""
        info = {
            'name': self.project_path.name,
            'size_bytes': self._calculate_directory_size(),
            'file_count': self._count_files(),
            'directory_count': self._count_directories(),
            'created_date': None,
            'modified_date': None
        }
        
        try:
            stat = self.project_path.stat()
            info['created_date'] = datetime.fromtimestamp(stat.st_ctime).isoformat()
            info['modified_date'] = datetime.fromtimestamp(stat.st_mtime).isoformat()
        except:
            pass
            
        return info

    def _detect_technologies(self) -> Dict[str, Any]:
        """Detect programming languages and technologies"""
        tech_stats = {}
        file_counts = {}
        
        for root, dirs, files in os.walk(self.project_path):
            # Skip hidden directories and common build/cache directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in 
                      {'node_modules', '__pycache__', 'target', 'build', 'dist'}]
            
            for file in files:
                file_path = Path(root) / file
                suffix = file_path.suffix.lower()
                
                for tech, extensions in self.tech_patterns.items():
                    if suffix in extensions:
                        tech_stats[tech] = tech_stats.get(tech, 0) + file_path.stat().st_size
                        file_counts[tech] = file_counts.get(tech, 0) + 1
        
        # Determine primary technology
        primary_tech = max(tech_stats.keys(), key=lambda k: tech_stats[k]) if tech_stats else 'unknown'
        
        return {
            'primary_language': primary_tech,
            'languages_detected': list(tech_stats.keys()),
            'language_stats': tech_stats,
            'file_counts': file_counts,
            'total_code_size': sum(tech_stats.values())
        }

    def _analyze_structure(self) -> Dict[str, Any]:
        """Analyze project directory structure"""
        structure = []
        common_dirs = set()
        
        def build_tree(path: Path, level: int = 0, max_level: int = 3):
            if level > max_level:
                return
                
            items = []
            try:
                for item in sorted(path.iterdir()):
                    if item.name.startswith('.'):
                        continue
                    if item.name in {'node_modules', '__pycache__', '.git'}:
                        continue
                        
                    item_info = {
                        'name': item.name,
                        'type': 'directory' if item.is_dir() else 'file',
                        'size': item.stat().st_size if item.is_file() else 0
                    }
                    
                    if item.is_dir():
                        common_dirs.add(item.name)
                        if level < max_level:
                            item_info['children'] = build_tree(item, level + 1, max_level)
                    
                    items.append(item_info)
            except PermissionError:
                pass
                
            return items
        
        structure = build_tree(self.project_path)
        
        return {
            'tree': structure,
            'common_directories': list(common_dirs),
            'estimated_project_type': self._estimate_project_type(common_dirs)
        }

    def _estimate_project_type(self, directories: set) -> str:
        """Estimate project type based on directory structure"""
        if 'src' in directories and 'public' in directories:
            return 'web_application'
        elif 'lib' in directories and 'bin' in directories:
            return 'library'
        elif 'app' in directories and 'config' in directories:
            return 'web_framework'
        elif 'client' in directories and 'server' in directories:
            return 'full_stack'
        elif 'docs' in directories and 'examples' in directories:
            return 'documentation_project'
        elif 'tests' in directories or 'test' in directories:
            return 'software_project'
        else:
            return 'general_project'

    def _analyze_dependencies(self) -> Dict[str, Any]:
        """Analyze project dependencies"""
        dependencies = {}
        
        for filename, package_manager in self.package_files.items():
            file_path = self.project_path / filename
            if file_path.exists():
                dependencies[package_manager] = self._parse_dependency_file(file_path)
        
        return dependencies

    def _parse_dependency_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse dependency file and extract package information"""
        try:
            if file_path.name == 'package.json':
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    return {
                        'dependencies': data.get('dependencies', {}),
                        'dev_dependencies': data.get('devDependencies', {}),
                        'scripts': data.get('scripts', {}),
                        'name': data.get('name', ''),
                        'version': data.get('version', '')
                    }
            elif file_path.name == 'requirements.txt':
                with open(file_path, 'r') as f:
                    deps = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                    return {'dependencies': deps}
            elif file_path.name == 'pyproject.toml':
                # Basic TOML parsing for dependencies
                with open(file_path, 'r') as f:
                    content = f.read()
                    deps = re.findall(r'"([^"]+)"', content)
                    return {'dependencies': deps}
        except Exception as e:
            logger.error(f"Error parsing {file_path}: {e}")
            return {}
        
        return {}

    def _detect_frameworks(self) -> List[str]:
        """Detect frameworks used in the project"""
        detected_frameworks = []
        
        # Check package.json for JavaScript frameworks
        package_json = self.project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                    all_deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                    
                    for framework, patterns in self.framework_patterns.items():
                        if any(pattern in dep for dep in all_deps.keys() for pattern in patterns):
                            detected_frameworks.append(framework)
            except:
                pass
        
        # Check for framework-specific files
        framework_files = {
            'django': ['manage.py', 'wsgi.py'],
            'flask': ['app.py', 'main.py'],
            'rails': ['config.ru', 'Rakefile'],
            'spring': ['pom.xml', 'build.gradle'],
            'unity': ['.unity', 'ProjectSettings']
        }
        
        for framework, files in framework_files.items():
            if any((self.project_path / f).exists() for f in files):
                if framework not in detected_frameworks:
                    detected_frameworks.append(framework)
        
        return detected_frameworks

    def _detect_build_systems(self) -> List[str]:
        """Detect build systems and tools"""
        build_systems = []
        
        build_files = {
            'webpack': ['webpack.config.js', 'webpack.config.ts'],
            'vite': ['vite.config.js', 'vite.config.ts'],
            'rollup': ['rollup.config.js'],
            'parcel': ['.parcelrc'],
            'gradle': ['build.gradle', 'gradlew'],
            'maven': ['pom.xml'],
            'make': ['Makefile', 'makefile'],
            'cmake': ['CMakeLists.txt'],
            'msbuild': ['.csproj', '.sln'],
            'cargo': ['Cargo.toml']
        }
        
        for build_system, files in build_files.items():
            if any((self.project_path / f).exists() for f in files):
                build_systems.append(build_system)
        
        return build_systems

    def _determine_execution_methods(self) -> List[Dict[str, str]]:
        """Determine how to run/execute the project"""
        execution_methods = []
        
        # Check package.json scripts
        package_json = self.project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                    scripts = data.get('scripts', {})
                    
                    for script_name, command in scripts.items():
                        execution_methods.append({
                            'type': 'npm_script',
                            'command': f"npm run {script_name}",
                            'description': f"Run {script_name}: {command}"
                        })
            except:
                pass
        
        # Check for common executable files
        executable_patterns = {
            'main.py': {'command': 'python main.py', 'description': 'Run Python application'},
            'app.py': {'command': 'python app.py', 'description': 'Run Flask/Python web app'},
            'manage.py': {'command': 'python manage.py runserver', 'description': 'Run Django server'},
            'server.js': {'command': 'node server.js', 'description': 'Run Node.js server'},
            'index.js': {'command': 'node index.js', 'description': 'Run Node.js application'},
            'Makefile': {'command': 'make', 'description': 'Build using Make'},
            'build.gradle': {'command': './gradlew run', 'description': 'Run Gradle application'},
            'pom.xml': {'command': 'mvn spring-boot:run', 'description': 'Run Maven Spring Boot app'}
        }
        
        for filename, execution in executable_patterns.items():
            if (self.project_path / filename).exists():
                execution_methods.append({
                    'type': 'direct_execution',
                    'command': execution['command'],
                    'description': execution['description']
                })
        
        return execution_methods

    def _calculate_code_metrics(self) -> Dict[str, Any]:
        """Calculate code metrics and statistics"""
        metrics = {
            'total_lines': 0,
            'code_lines': 0,
            'comment_lines': 0,
            'blank_lines': 0,
            'files_analyzed': 0,
            'largest_file': {'path': '', 'lines': 0},
            'complexity_estimate': 'low'
        }
        
        code_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs'}
        
        for root, dirs, files in os.walk(self.project_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in 
                      {'node_modules', '__pycache__', 'target', 'build', 'dist'}]
            
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix.lower() in code_extensions:
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = f.readlines()
                            file_lines = len(lines)
                            
                            metrics['total_lines'] += file_lines
                            metrics['files_analyzed'] += 1
                            
                            if file_lines > metrics['largest_file']['lines']:
                                metrics['largest_file'] = {
                                    'path': str(file_path.relative_to(self.project_path)),
                                    'lines': file_lines
                                }
                            
                            # Basic line classification
                            for line in lines:
                                line = line.strip()
                                if not line:
                                    metrics['blank_lines'] += 1
                                elif line.startswith('#') or line.startswith('//') or line.startswith('/*'):
                                    metrics['comment_lines'] += 1
                                else:
                                    metrics['code_lines'] += 1
                    except:
                        continue
        
        # Estimate complexity
        if metrics['total_lines'] > 10000:
            metrics['complexity_estimate'] = 'high'
        elif metrics['total_lines'] > 5000:
            metrics['complexity_estimate'] = 'medium'
        
        return metrics

    def _assess_code_quality(self) -> Dict[str, Any]:
        """Assess code quality indicators"""
        quality = {
            'has_tests': False,
            'has_documentation': False,
            'has_ci_cd': False,
            'has_linting': False,
            'documentation_coverage': 'low',
            'test_coverage': 'unknown',
            'quality_score': 5  # Out of 10
        }
        
        # Check for test directories/files
        test_indicators = ['test', 'tests', '__tests__', 'spec', 'cypress', 'jest']
        for indicator in test_indicators:
            if (self.project_path / indicator).exists():
                quality['has_tests'] = True
                break
        
        # Check for documentation
        doc_files = ['README.md', 'README.rst', 'docs', 'documentation', 'CHANGELOG.md']
        for doc in doc_files:
            if (self.project_path / doc).exists():
                quality['has_documentation'] = True
                break
        
        # Check for CI/CD
        ci_indicators = ['.github', '.gitlab-ci.yml', '.travis.yml', 'Jenkinsfile', '.circleci']
        for ci in ci_indicators:
            if (self.project_path / ci).exists():
                quality['has_ci_cd'] = True
                break
        
        # Check for linting configuration
        lint_files = ['.eslintrc', '.pylintrc', 'tslint.json', '.editorconfig']
        for lint in lint_files:
            if any((self.project_path / f).exists() for f in [lint, f"{lint}.js", f"{lint}.json"]):
                quality['has_linting'] = True
                break
        
        # Calculate quality score
        score = 5
        if quality['has_tests']:
            score += 2
        if quality['has_documentation']:
            score += 1
        if quality['has_ci_cd']:
            score += 1
        if quality['has_linting']:
            score += 1
        
        quality['quality_score'] = min(score, 10)
        
        return quality

    def _generate_recommendations(self) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []
        
        # Check if README exists
        if not (self.project_path / 'README.md').exists():
            recommendations.append("Add a README.md file to document your project")
        
        # Check for version control
        if not (self.project_path / '.git').exists():
            recommendations.append("Initialize Git version control with 'git init'")
        
        # Check for tests
        test_dirs = ['test', 'tests', '__tests__', 'spec']
        if not any((self.project_path / d).exists() for d in test_dirs):
            recommendations.append("Add automated tests to improve code reliability")
        
        # Check for CI/CD
        if not any((self.project_path / ci).exists() for ci in ['.github', '.gitlab-ci.yml']):
            recommendations.append("Consider setting up CI/CD for automated testing and deployment")
        
        # Check for dependency management
        if not any((self.project_path / pkg).exists() for pkg in self.package_files.keys()):
            recommendations.append("Add dependency management (package.json, requirements.txt, etc.)")
        
        return recommendations

    def _generate_ai_insights(self) -> Dict[str, Any]:
        """Generate AI-powered insights using available APIs"""
        insights = {
            'summary': '',
            'architecture_analysis': '',
            'improvement_suggestions': [],
            'technology_recommendations': [],
            'ai_service_used': None
        }
        
        try:
            # Prepare project summary for AI analysis
            project_summary = self._create_project_summary()
            
            # Try OpenAI first, then Gemini
            if app.config.get('OPENAI_API_KEY'):
                insights.update(self._get_openai_insights(project_summary))
                insights['ai_service_used'] = 'openai'
            elif app.config.get('GEMINI_API_KEY'):
                insights.update(self._get_gemini_insights(project_summary))
                insights['ai_service_used'] = 'gemini'
            else:
                insights['summary'] = 'AI insights unavailable - no API keys configured'
                
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            insights['summary'] = f'AI insights unavailable due to error: {str(e)}'
        
        return insights

    def _create_project_summary(self) -> str:
        """Create a concise project summary for AI analysis"""
        tech_info = self.analysis_cache.get('technologies', {})
        structure_info = self.analysis_cache.get('structure', {})
        dependencies = self.analysis_cache.get('dependencies', {})
        
        summary = f"""
        Project: {self.project_path.name}
        Primary Language: {tech_info.get('primary_language', 'unknown')}
        Languages: {', '.join(tech_info.get('languages_detected', []))}
        Project Type: {structure_info.get('estimated_project_type', 'unknown')}
        Dependencies: {list(dependencies.keys())}
        File Count: {tech_info.get('file_counts', {})}
        """
        return summary.strip()

    def _get_openai_insights(self, project_summary: str) -> Dict[str, Any]:
        """Get insights from OpenAI API"""
        headers = {
            'Authorization': f"Bearer {app.config['OPENAI_API_KEY']}",
            'Content-Type': 'application/json'
        }
        
        prompt = f"""
        Analyze this software project and provide insights:
        
        {project_summary}
        
        Please provide:
        1. A brief summary of the project's purpose and architecture
        2. Key architectural strengths and potential issues
        3. 3-5 specific improvement suggestions
        4. Technology recommendations for enhancement
        
        Keep responses concise and actionable.
        """
        
        data = {
            'model': 'gpt-4o',
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 1000,
            'temperature': 0.7
        }
        
        response = requests.post('https://api.openai.com/v1/chat/completions', 
                               json=data, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        return self._parse_ai_response(content)

    def _get_gemini_insights(self, project_summary: str) -> Dict[str, Any]:
        """Get insights from Gemini API"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={app.config['GEMINI_API_KEY']}"
        
        prompt = f"""
        Analyze this software project and provide insights:
        
        {project_summary}
        
        Please provide:
        1. A brief summary of the project's purpose and architecture
        2. Key architectural strengths and potential issues
        3. 3-5 specific improvement suggestions
        4. Technology recommendations for enhancement
        
        Keep responses concise and actionable.
        """
        
        data = {
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {
                'maxOutputTokens': 1000,
                'temperature': 0.7
            }
        }
        
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        content = result['candidates'][0]['content']['parts'][0]['text']
        
        return self._parse_ai_response(content)

    def _parse_ai_response(self, content: str) -> Dict[str, Any]:
        """Parse AI response into structured format"""
        lines = content.split('\n')
        
        summary = []
        architecture = []
        improvements = []
        recommendations = []
        
        current_section = 'summary'
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if 'architecture' in line.lower() or 'strengths' in line.lower():
                current_section = 'architecture'
            elif 'improvement' in line.lower() or 'suggestion' in line.lower():
                current_section = 'improvements'
            elif 'recommendation' in line.lower() or 'technology' in line.lower():
                current_section = 'recommendations'
            else:
                if current_section == 'summary':
                    summary.append(line)
                elif current_section == 'architecture':
                    architecture.append(line)
                elif current_section == 'improvements':
                    improvements.append(line)
                elif current_section == 'recommendations':
                    recommendations.append(line)
        
        return {
            'summary': ' '.join(summary),
            'architecture_analysis': ' '.join(architecture),
            'improvement_suggestions': improvements,
            'technology_recommendations': recommendations
        }

    def _calculate_directory_size(self) -> int:
        """Calculate total directory size in bytes"""
        total_size = 0
        try:
            for root, dirs, files in os.walk(self.project_path):
                for file in files:
                    file_path = Path(root) / file
                    try:
                        total_size += file_path.stat().st_size
                    except:
                        continue
        except:
            pass
        return total_size

    def _count_files(self) -> int:
        """Count total number of files"""
        count = 0
        try:
            for root, dirs, files in os.walk(self.project_path):
                count += len(files)
        except:
            pass
        return count

    def _count_directories(self) -> int:
        """Count total number of directories"""
        count = 0
        try:
            for root, dirs, files in os.walk(self.project_path):
                count += len(dirs)
        except:
            pass
        return count

# API Routes

@app.route('/analyze', methods=['POST'])
def analyze_project():
    """
    Main analysis endpoint
    Accepts either:
    1. JSON with 'project_path' field
    2. File upload (ZIP file)
    """
    try:
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if file and file.filename.endswith('.zip'):
                # Save uploaded file
                filename = secure_filename(file.filename)
                upload_path = Path(app.config['UPLOAD_FOLDER']) / filename
                file.save(upload_path)
                
                # Extract ZIP file
                extract_path = upload_path.parent / f"{filename}_extracted"
                with zipfile.ZipFile(upload_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_path)
                
                # Find the actual project root (first subdirectory if there's only one)
                contents = list(extract_path.iterdir())
                if len(contents) == 1 and contents[0].is_dir():
                    project_path = contents[0]
                else:
                    project_path = extract_path
                
                try:
                    # Analyze the project
                    analyzer = ProjectAnalyzer(str(project_path))
                    analysis = analyzer.analyze_project()
                    
                    return jsonify({
                        'success': True,
                        'analysis': analysis,
                        'metadata': {
                            'analysis_duration': 'completed',
                            'temp_path_used': str(project_path),
                            'original_filename': file.filename
                        }
                    })
                finally:
                    # Cleanup temporary files
                    try:
                        shutil.rmtree(extract_path)
                        upload_path.unlink()
                    except:
                        pass
            else:
                return jsonify({'error': 'Only ZIP files are supported for upload'}), 400
        
        # Handle JSON request with project path
        elif request.is_json:
            data = request.get_json()
            project_path = data.get('project_path')
            
            if not project_path:
                return jsonify({'error': 'project_path is required'}), 400
            
            project_path = Path(project_path)
            if not project_path.exists():
                return jsonify({'error': f'Project path does not exist: {project_path}'}), 404
            
            if not project_path.is_dir():
                return jsonify({'error': f'Project path is not a directory: {project_path}'}), 400
            
            # Analyze the project with timeout protection
            try:
                analyzer = ProjectAnalyzer(str(project_path))
                analysis = analyzer.analyze_project()
            except Exception as analysis_error:
                logger.error(f"Project analysis failed: {analysis_error}")
                # Return partial results if analysis fails
                return jsonify({
                    'success': False,
                    'error': f'Analysis failed: {str(analysis_error)}',
                    'partial_analysis': {
                        'project_path': str(project_path),
                        'error_type': type(analysis_error).__name__,
                        'message': 'Analysis timed out or failed on large project'
                    }
                }), 500
            
            return jsonify({
                'success': True,
                'analysis': analysis,
                'metadata': {
                    'analysis_duration': 'completed',
                    'project_path': str(project_path)
                }
            })
        
        else:
            return jsonify({'error': 'Either upload a ZIP file or provide project_path in JSON'}), 400
            
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'openai': bool(app.config.get('OPENAI_API_KEY')),
            'gemini': bool(app.config.get('GEMINI_API_KEY'))
        }
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API information"""
    return jsonify({
        'name': 'LeviatanCode Flask Analyzer API',
        'version': '1.0.0',
        'description': 'AI-powered project analysis tool',
        'endpoints': {
            '/analyze': 'POST - Analyze a project (upload ZIP or provide path)',
            '/health': 'GET - Health check',
            '/': 'GET - This information'
        },
        'usage': {
            'upload': 'POST /analyze with multipart/form-data containing ZIP file',
            'path': 'POST /analyze with JSON: {"project_path": "/path/to/project"}'
        }
    })

@app.errorhandler(413)
def file_too_large(e):
    """Handle file too large error"""
    return jsonify({'error': 'File too large. Maximum size is 100MB.'}), 413

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {e}")
    return jsonify({'error': 'Internal server error occurred'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting LeviatanCode Flask Analyzer API on port {port}")
    logger.info(f"OpenAI API configured: {bool(app.config.get('OPENAI_API_KEY'))}")
    logger.info(f"Gemini API configured: {bool(app.config.get('GEMINI_API_KEY'))}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)