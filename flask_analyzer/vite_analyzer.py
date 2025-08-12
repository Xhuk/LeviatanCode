#!/usr/bin/env python3
"""
ViteFocusedAnalyzer - Optimized analyzer for Vite/React projects
Focuses on key directories and avoids heavy dependency scanning
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

def detect_project_type_fast(project_path):
    """Quick project type detection to optimize analysis strategy."""
    project_path = Path(project_path)
    
    # Check for Vite indicators
    vite_files = ['vite.config.js', 'vite.config.ts']
    if any((project_path / file).exists() for file in vite_files):
        return 'vite'
    
    # Check for package.json with Vite dependencies
    package_json_path = project_path / 'package.json'
    if package_json_path.exists():
        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
                deps = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
                if 'vite' in deps or '@vitejs/plugin-react' in deps:
                    return 'vite'
                if 'react' in deps and ('webpack' not in deps):
                    return 'react-vite'
        except:
            pass
    
    # Check for other project types
    if (project_path / 'next.config.js').exists():
        return 'nextjs'
    if (project_path / 'angular.json').exists():
        return 'angular'
    if (project_path / 'vue.config.js').exists():
        return 'vue'
    
    return 'standard'

class ViteFocusedAnalyzer:
    """Optimized analyzer specifically for Vite projects."""
    
    def __init__(self, project_path):
        self.project_path = Path(project_path)
        
    def analyze_project(self):
        """Run focused analysis for Vite projects."""
        print("🎯 Running Vite-focused analysis...")
        
        # Key directories to analyze for Vite projects
        focus_dirs = ['client', 'src', 'server', 'shared', 'public']
        
        analysis_data = {
            'basic_info': self._get_basic_info(),
            'technologies': self._detect_technologies(),
            'structure': self._analyze_structure(focus_dirs),
            'dependencies': self._analyze_dependencies(),
            'frameworks': self._detect_frameworks(),
            'build_systems': ['Vite'],
            'execution_methods': self._get_execution_methods(),
            'code_metrics': self._calculate_metrics(focus_dirs),
            'quality_assessment': self._assess_quality(),
            'recommendations': self._generate_recommendations(),
            'insights': self._generate_insights()
        }
        
        print("✅ Vite-focused analysis completed")
        return analysis_data
    
    def _get_basic_info(self):
        """Get basic project information."""
        try:
            stat = self.project_path.stat()
            # Count files excluding heavy directories
            exclude_patterns = ['node_modules', '.git', 'dist', 'build', 'logs', 'uploads', 'workspaces', 'attached_assets', 'migrations', 'metadata']
            files = [f for f in self.project_path.rglob('*') if f.is_file() and not any(pattern in str(f) for pattern in exclude_patterns)]
            dirs = [f for f in self.project_path.rglob('*') if f.is_dir() and not any(pattern in str(f) for pattern in exclude_patterns)]
            
            return {
                'name': self.project_path.name,
                'size_bytes': sum(f.stat().st_size for f in files[:1000]),  # Limit to first 1000 files for speed
                'file_count': len(files),
                'directory_count': len(dirs),
                'created_date': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'modified_date': datetime.fromtimestamp(stat.st_mtime).isoformat()
            }
        except Exception as e:
            return {'name': self.project_path.name, 'error': str(e)}
    
    def _detect_technologies(self):
        """Detect technologies used in Vite project."""
        languages = set()
        file_counts = {}
        total_size = 0
        
        # Focus on key file extensions for Vite projects
        vite_extensions = {'.js', '.ts', '.jsx', '.tsx', '.vue', '.css', '.scss', '.less', '.json', '.html'}
        exclude_patterns = ['node_modules', '.git', 'dist', 'build', 'logs', 'uploads', 'workspaces', 'attached_assets']
        
        for ext in vite_extensions:
            files = list(self.project_path.rglob(f'*{ext}'))
            # Filter out excluded directories
            files = [f for f in files if not any(pattern in str(f) for pattern in exclude_patterns)]
            
            if files:
                file_counts[ext] = len(files)
                # Only calculate size for reasonable number of files
                size_files = files[:100] if len(files) > 100 else files
                total_size += sum(f.stat().st_size for f in size_files if f.exists())
                
                # Map extensions to languages
                lang_map = {
                    '.js': 'JavaScript', '.ts': 'TypeScript', '.jsx': 'React JSX', 
                    '.tsx': 'React TSX', '.vue': 'Vue', '.css': 'CSS', 
                    '.scss': 'SCSS', '.less': 'Less', '.html': 'HTML'
                }
                if ext in lang_map:
                    languages.add(lang_map[ext])
        
        primary_language = 'TypeScript' if '.ts' in file_counts or '.tsx' in file_counts else 'JavaScript'
        
        return {
            'primary_language': primary_language,
            'languages_detected': list(languages),
            'language_stats': {lang: file_counts.get(ext, 0) for ext, lang in {
                '.js': 'JavaScript', '.ts': 'TypeScript', '.jsx': 'React JSX', '.tsx': 'React TSX'
            }.items()},
            'file_counts': file_counts,
            'total_code_size': total_size
        }
    
    def _analyze_structure(self, focus_dirs):
        """Analyze project structure focusing on key directories."""
        structure = []
        common_dirs = []
        
        for dir_name in focus_dirs:
            dir_path = self.project_path / dir_name
            if dir_path.exists() and dir_path.is_dir():
                common_dirs.append(dir_name)
                # Quick count of files in directory
                try:
                    files_in_dir = sum(1 for _ in dir_path.rglob('*') if _.is_file())
                    structure.append({
                        'name': dir_name,
                        'type': 'directory',
                        'file_count': min(files_in_dir, 1000)  # Cap for performance
                    })
                except:
                    structure.append({
                        'name': dir_name,
                        'type': 'directory',
                        'file_count': 0
                    })
        
        return {
            'tree': structure,
            'common_directories': common_dirs,
            'estimated_project_type': 'Vite React Application'
        }
    
    def _analyze_dependencies(self):
        """Analyze package.json dependencies."""
        package_json = self.project_path / 'package.json'
        if not package_json.exists():
            return {}
        
        try:
            with open(package_json, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            deps = data.get('dependencies', {})
            dev_deps = data.get('devDependencies', {})
            
            return {
                'npm': {
                    'dependencies': dict(list(deps.items())[:20]),  # Limit for performance
                    'devDependencies': dict(list(dev_deps.items())[:20]),
                    'total_count': len(deps) + len(dev_deps)
                }
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _detect_frameworks(self):
        """Detect frameworks used."""
        frameworks = ['Vite']
        
        package_json = self.project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                deps = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
                
                framework_indicators = {
                    'react': 'React',
                    'vue': 'Vue',
                    '@tanstack/react-query': 'React Query',
                    'express': 'Express',
                    'tailwindcss': 'Tailwind CSS',
                    '@radix-ui/react-accordion': 'Radix UI',
                    'drizzle-orm': 'Drizzle ORM',
                    'wouter': 'Wouter Router'
                }
                
                for dep, framework in framework_indicators.items():
                    if dep in deps:
                        frameworks.append(framework)
                        
            except:
                pass
        
        return frameworks
    
    def _get_execution_methods(self):
        """Get execution methods for Vite projects."""
        methods = [
            {'type': 'development', 'command': 'npm run dev', 'description': 'Start development server'},
            {'type': 'build', 'command': 'npm run build', 'description': 'Build for production'},
            {'type': 'preview', 'command': 'npm run preview', 'description': 'Preview production build'}
        ]
        
        package_json = self.project_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                scripts = data.get('scripts', {})
                for script_name, script_cmd in list(scripts.items())[:10]:  # Limit for performance
                    if script_name not in ['dev', 'build', 'preview']:
                        methods.append({
                            'type': 'custom',
                            'command': f'npm run {script_name}',
                            'description': f'Run {script_name} script'
                        })
            except:
                pass
        
        return methods
    
    def _calculate_metrics(self, focus_dirs):
        """Calculate code metrics for focused directories."""
        total_lines = 0
        code_lines = 0
        files_analyzed = 0
        largest_file = {'path': '', 'lines': 0}
        
        # Process files in chunks to avoid memory issues
        file_limit = 200  # Analyze max 200 files for performance
        files_processed = 0
        
        for dir_name in focus_dirs:
            dir_path = self.project_path / dir_name
            if dir_path.exists() and files_processed < file_limit:
                for file_path in dir_path.rglob('*'):
                    if files_processed >= file_limit:
                        break
                        
                    if file_path.is_file() and file_path.suffix in ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss']:
                        try:
                            # Use a more efficient line counting method
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                                lines = content.count('\n') + 1
                                file_lines = lines
                                total_lines += file_lines
                                
                                # Simple code line estimation
                                non_empty_lines = len([line for line in content.split('\n') if line.strip()])
                                code_lines += non_empty_lines
                                files_analyzed += 1
                                files_processed += 1
                                
                                if file_lines > largest_file['lines']:
                                    largest_file = {'path': str(file_path.relative_to(self.project_path)), 'lines': file_lines}
                        except:
                            continue
        
        return {
            'total_lines': total_lines,
            'code_lines': code_lines,
            'comment_lines': max(0, total_lines - code_lines),
            'blank_lines': max(0, total_lines - code_lines),
            'files_analyzed': files_analyzed,
            'largest_file': largest_file,
            'complexity_estimate': 'High' if total_lines > 10000 else 'Medium' if total_lines > 5000 else 'Low'
        }
    
    def _assess_quality(self):
        """Assess code quality for Vite project."""
        # Quick checks without heavy file system operations
        has_tests = len(list(self.project_path.glob('**/*.test.*'))[:5]) > 0 or len(list(self.project_path.glob('**/*.spec.*'))[:5]) > 0
        has_docs = (self.project_path / 'README.md').exists() or (self.project_path / 'README.txt').exists()
        has_ci = (self.project_path / '.github').exists() or (self.project_path / '.gitlab-ci.yml').exists()
        has_linting = any((self.project_path / lint_file).exists() for lint_file in ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js'])
        
        quality_score = sum([has_tests, has_docs, has_ci, has_linting, True]) * 2  # Base score for being structured
        
        return {
            'has_tests': has_tests,
            'has_documentation': has_docs,
            'has_ci_cd': has_ci,
            'has_linting': has_linting,
            'documentation_coverage': 'Good' if has_docs else 'Poor',
            'test_coverage': 'Good' if has_tests else 'Poor',
            'quality_score': min(quality_score, 10)
        }
    
    def _generate_recommendations(self):
        """Generate recommendations for Vite projects."""
        return [
            "Consider using TypeScript for better type safety",
            "Implement unit tests with Vitest for better code quality",
            "Use ESLint and Prettier for code formatting",
            "Consider implementing CI/CD with GitHub Actions",
            "Add comprehensive documentation"
        ]
    
    def _generate_insights(self):
        """Generate insights for Vite projects."""
        return {
            'summary': 'Modern Vite-based web application with optimized build system',
            'architecture_analysis': 'Well-structured full-stack application using Vite for fast development and Express for backend services',
            'improvement_suggestions': [
                'Add comprehensive test suite',
                'Implement code splitting for better performance',
                'Consider adding PWA capabilities',
                'Optimize bundle size with tree shaking'
            ],
            'technology_recommendations': [
                'Vite for fast development and building',
                'React Query for state management',
                'Tailwind CSS for styling',
                'TypeScript for type safety'
            ],
            'ai_service_used': 'Vite-focused analyzer'
        }