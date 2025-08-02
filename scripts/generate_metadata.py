#!/usr/bin/env python3
"""
LeviatanCode Metadata Generator
Automatically generates comprehensive metadata files for all source files
Creates detailed documentation for AI debugging and development assistance
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
import re

class MetadataGenerator:
    def __init__(self, project_path: str = "."):
        self.project_path = Path(project_path).resolve()
        self.metadata_path = self.project_path / "metadata"
        
        # File patterns to analyze
        self.source_extensions = {
            '.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json',
            '.css', '.scss', '.html', '.yaml', '.yml', '.toml'
        }
        
        # Directories to ignore
        self.ignore_dirs = {
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            'dist', 'build', '.next', 'target', 'bin', 'obj', 'out',
            '.idea', '.vscode', '.vs', '.nyc_output', 'coverage',
            'logs', 'uploads', 'migrations', 'metadata'
        }

    def should_analyze_file(self, file_path: Path) -> bool:
        """Check if file should have metadata generated."""
        if file_path.suffix.lower() not in self.source_extensions:
            return False
        
        if any(ignore_dir in file_path.parts for ignore_dir in self.ignore_dirs):
            return False
            
        if file_path.name.startswith('.'):
            return False
            
        return True

    def detect_file_type(self, file_path: Path) -> str:
        """Detect the type and purpose of a file."""
        ext = file_path.suffix.lower()
        name = file_path.name.lower()
        
        # Configuration files
        if name in ['package.json', 'tsconfig.json', 'tailwind.config.ts', 'vite.config.ts']:
            return 'configuration'
        
        # Component files
        if ext in ['.tsx', '.jsx'] and 'components' in str(file_path):
            return 'component'
        
        # Hook files
        if ext in ['.ts', '.tsx'] and 'hooks' in str(file_path):
            return 'hook'
        
        # Page files
        if ext in ['.tsx', '.jsx'] and 'pages' in str(file_path):
            return 'page'
        
        # Service files
        if ext in ['.ts', '.js'] and 'services' in str(file_path):
            return 'service'
        
        # Route files
        if name.endswith('routes.ts') or 'routes' in str(file_path):
            return 'route'
        
        # Schema files
        if 'schema' in name:
            return 'schema'
        
        # Utility files
        if 'utils' in name or 'lib' in str(file_path):
            return 'utility'
        
        # Style files
        if ext in ['.css', '.scss']:
            return 'style'
        
        # Documentation
        if ext == '.md':
            return 'documentation'
        
        # Default based on extension
        return {
            '.ts': 'typescript',
            '.tsx': 'react_component',
            '.js': 'javascript',
            '.jsx': 'react_component',
            '.py': 'python_script',
            '.json': 'configuration',
            '.yaml': 'configuration',
            '.yml': 'configuration',
            '.toml': 'configuration'
        }.get(ext, 'source_file')

    def analyze_file_content(self, file_path: Path) -> Dict[str, Any]:
        """Analyze file content to extract metadata."""
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        except:
            content = ""
        
        analysis = {
            'size': len(content),
            'lines': len(content.splitlines()),
            'imports': [],
            'exports': [],
            'functions': [],
            'classes': [],
            'components': [],
            'hooks': [],
            'dependencies': []
        }
        
        # Analyze imports
        import_patterns = [
            r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]",
            r"import\s+['\"]([^'\"]+)['\"]",
            r"from\s+([^\s]+)\s+import",
            r"require\(['\"]([^'\"]+)['\"]\)"
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            analysis['imports'].extend(matches)
        
        # Analyze exports
        export_patterns = [
            r"export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)",
            r"export\s+\{\s*([^}]+)\s*\}",
            r"module\.exports\s*=\s*(\w+)"
        ]
        
        for pattern in export_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            for match in matches:
                if isinstance(match, str):
                    analysis['exports'].append(match)
                else:
                    analysis['exports'].extend([m.strip() for m in match.split(',')])
        
        # Analyze functions
        function_patterns = [
            r"function\s+(\w+)",
            r"const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>",
            r"(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>",
            r"def\s+(\w+)\s*\("
        ]
        
        for pattern in function_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            analysis['functions'].extend(matches)
        
        # Analyze classes
        class_patterns = [
            r"class\s+(\w+)",
            r"interface\s+(\w+)",
            r"type\s+(\w+)\s*="
        ]
        
        for pattern in class_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            analysis['classes'].extend(matches)
        
        # Analyze React components
        if file_path.suffix in ['.tsx', '.jsx']:
            component_patterns = [
                r"(?:export\s+)?(?:default\s+)?(?:const|function)\s+(\w+).*?(?:React\.FC|JSX\.Element|\s*\(\s*\)\s*=>)",
                r"(?:export\s+)?(?:default\s+)?function\s+(\w+)\s*\([^)]*\).*?return"
            ]
            
            for pattern in component_patterns:
                matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
                analysis['components'].extend(matches)
        
        # Analyze React hooks
        hook_patterns = [
            r"const\s+(\w*use\w+)\s*=",
            r"function\s+(use\w+)\s*\(",
            r"export\s+(?:const|function)\s+(use\w+)"
        ]
        
        for pattern in hook_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            analysis['hooks'].extend(matches)
        
        return analysis

    def determine_dependencies(self, file_path: Path, analysis: Dict[str, Any]) -> List[str]:
        """Determine file dependencies based on imports and usage."""
        dependencies = []
        
        for imp in analysis['imports']:
            if imp.startswith('./') or imp.startswith('../'):
                # Relative import - resolve to actual file
                try:
                    resolved = (file_path.parent / imp).resolve()
                    if resolved.exists():
                        dependencies.append(str(resolved.relative_to(self.project_path)))
                except:
                    dependencies.append(imp)
            elif imp.startswith('@/'):
                # Alias import - project internal
                dependencies.append(imp)
            elif imp.startswith('@'):
                # Scoped package
                dependencies.append(imp)
            elif '/' not in imp or imp in ['react', 'express', 'fs', 'path']:
                # External package or built-in module
                dependencies.append(imp)
        
        return list(set(dependencies))

    def generate_metadata_content(self, file_path: Path) -> str:
        """Generate comprehensive metadata content for a file."""
        relative_path = file_path.relative_to(self.project_path)
        file_type = self.detect_file_type(file_path)
        analysis = self.analyze_file_content(file_path)
        dependencies = self.determine_dependencies(file_path, analysis)
        
        # Generate metadata content
        content = f"""# {file_path.name} Metadata

## Purpose
{self.generate_purpose_description(file_path, file_type, analysis)}

## Dependencies

### Imports
{self.format_list(analysis['imports'][:10])}  # Limited to top 10

### Exports
{self.format_list(analysis['exports'])}

### File Dependencies
{self.format_list(dependencies[:15])}  # Limited to top 15

## Object Intent

{self.generate_object_intent(file_path, file_type, analysis)}

## Architecture Context

### Position in System
- **Layer**: {self.determine_layer(file_path)}
- **Role**: {self.determine_role(file_path, file_type)}
- **File Type**: {file_type}
- **Size**: {analysis['lines']} lines, {analysis['size']} bytes

### Integration Points
{self.generate_integration_points(file_path, file_type, dependencies)}

## Common Issues

{self.generate_common_issues(file_path, file_type)}

## AI Debugging Guide

### For AI Systems
1. **File Type**: {file_type.replace('_', ' ').title()}
2. **Primary Function**: {self.get_primary_function(file_path, file_type)}
3. **Dependencies**: {len(dependencies)} dependencies detected
4. **Complexity**: {len(analysis['functions'])} functions, {len(analysis['classes'])} classes/interfaces

### Key Debugging Points
{self.generate_debugging_points(file_path, file_type, analysis)}

### Dependencies to Monitor
{self.format_list(dependencies[:5], "- ")}

### Performance Considerations
{self.generate_performance_notes(file_path, file_type, analysis)}

### Common Debug Scenarios
{self.generate_debug_scenarios(file_path, file_type)}

### Integration Points to Verify
{self.generate_integration_verification(file_path, file_type)}

Generated by LeviatanCode Metadata Generator
"""
        return content

    def format_list(self, items: List[str], prefix: str = "- ") -> str:
        """Format a list of items for markdown."""
        if not items:
            return "- None detected"
        return "\n".join([f"{prefix}{item}" for item in items[:10]])

    def generate_purpose_description(self, file_path: Path, file_type: str, analysis: Dict[str, Any]) -> str:
        """Generate purpose description based on file type and analysis."""
        descriptions = {
            'component': f"React component providing UI functionality. Contains {len(analysis['components'])} component(s) with {analysis['lines']} lines of JSX/TSX code.",
            'hook': f"Custom React hook providing reusable state logic. Implements {len(analysis['hooks'])} hook(s) for component state management.",
            'service': f"Service layer providing business logic and data operations. Contains {len(analysis['functions'])} function(s) for application services.",
            'route': f"API route handler defining HTTP endpoints and request processing. Implements {len(analysis['functions'])} route handler(s).",
            'schema': f"Data schema definition providing type safety and validation. Defines {len(analysis['classes'])} schema(s) and type(s).",
            'utility': f"Utility functions providing common functionality across the application. Contains {len(analysis['functions'])} utility function(s).",
            'configuration': f"Configuration file defining application settings and build parameters. Contains project configuration and dependencies.",
            'style': f"Stylesheet defining visual appearance and layout. Contains CSS rules for component styling.",
            'documentation': f"Documentation file providing project information and guidance. Contains {analysis['lines']} lines of documentation."
        }
        
        return descriptions.get(file_type, f"Source file containing {analysis['lines']} lines of code with {len(analysis['functions'])} functions.")

    def determine_layer(self, file_path: Path) -> str:
        """Determine which architectural layer the file belongs to."""
        path_str = str(file_path).lower()
        
        if 'components' in path_str or 'pages' in path_str:
            return "Presentation Layer"
        elif 'hooks' in path_str:
            return "State Management Layer"
        elif 'services' in path_str:
            return "Service Layer"
        elif 'routes' in path_str:
            return "API Layer"
        elif 'lib' in path_str or 'utils' in path_str:
            return "Utility Layer"
        elif 'shared' in path_str or 'schema' in path_str:
            return "Data Layer"
        else:
            return "Application Layer"

    def determine_role(self, file_path: Path, file_type: str) -> str:
        """Determine the role of the file in the system."""
        roles = {
            'component': "UI Component",
            'hook': "State Manager",
            'service': "Business Logic",
            'route': "API Handler",
            'schema': "Data Definition",
            'utility': "Helper Functions",
            'configuration': "System Configuration",
            'style': "Visual Styling",
            'documentation': "Information Provider"
        }
        
        return roles.get(file_type, "Source Code")

    def get_primary_function(self, file_path: Path, file_type: str) -> str:
        """Get the primary function of the file."""
        functions = {
            'component': "Render user interface elements",
            'hook': "Manage component state and effects",
            'service': "Handle business logic and data operations",
            'route': "Process HTTP requests and responses",
            'schema': "Define data structure and validation",
            'utility': "Provide common functionality",
            'configuration': "Configure application behavior",
            'style': "Define visual appearance",
            'documentation': "Provide project information"
        }
        
        return functions.get(file_type, "Process application logic")

    def generate_object_intent(self, file_path: Path, file_type: str, analysis: Dict[str, Any]) -> str:
        """Generate object intent section."""
        if analysis['components']:
            intent = "### React Components\n"
            for comp in analysis['components'][:3]:
                intent += f"- **{comp}**: UI component providing specific functionality\n"
        elif analysis['functions']:
            intent = "### Functions\n"
            for func in analysis['functions'][:3]:
                intent += f"- **{func}**: Handles specific application logic\n"
        elif analysis['classes']:
            intent = "### Classes/Interfaces\n"
            for cls in analysis['classes'][:3]:
                intent += f"- **{cls}**: Defines data structure or behavior\n"
        else:
            intent = "### General Purpose\nProvides functionality as part of the application architecture."
        
        return intent

    def generate_integration_points(self, file_path: Path, file_type: str, dependencies: List[str]) -> str:
        """Generate integration points section."""
        points = []
        
        # Check for common integration patterns
        if any('react' in dep.lower() for dep in dependencies):
            points.append("- **React**: Integrates with React component system")
        
        if any('api' in dep.lower() or 'axios' in dep.lower() for dep in dependencies):
            points.append("- **API**: Makes HTTP requests to backend services")
        
        if any('db' in dep.lower() or 'database' in dep.lower() for dep in dependencies):
            points.append("- **Database**: Interacts with data storage layer")
        
        if any('socket' in dep.lower() or 'ws' in dep.lower() for dep in dependencies):
            points.append("- **WebSocket**: Real-time communication integration")
        
        if not points:
            points.append("- **Internal**: Integrates with other application modules")
        
        return "\n".join(points)

    def generate_common_issues(self, file_path: Path, file_type: str) -> str:
        """Generate common issues section."""
        issues = {
            'component': """### Rendering Issues
- **Issue**: Component not updating when props change
- **Solution**: Check prop dependencies and React re-render triggers
- **Debug**: Use React DevTools to monitor prop changes

### State Management
- **Issue**: State not persisting or updating correctly
- **Solution**: Verify useState and useEffect dependencies
- **Debug**: Add logging to state update functions""",
            
            'hook': """### Hook Rules Violations
- **Issue**: Hooks called conditionally or in wrong order
- **Solution**: Follow React hooks rules and call hooks at top level
- **Debug**: Check ESLint warnings and React error messages

### Dependency Issues
- **Issue**: useEffect running too frequently or not at all
- **Solution**: Verify dependency array and memoization
- **Debug**: Monitor effect execution with logging""",
            
            'service': """### API Communication
- **Issue**: Service calls failing or timing out
- **Solution**: Check network connectivity and API endpoints
- **Debug**: Monitor network requests and response codes

### Error Handling
- **Issue**: Unhandled errors causing application crashes
- **Solution**: Implement proper try-catch blocks and error boundaries
- **Debug**: Check error logs and stack traces""",
            
            'route': """### Request Processing
- **Issue**: Routes not responding or returning errors
- **Solution**: Check route definitions and middleware configuration
- **Debug**: Monitor server logs and request/response cycle

### Authentication Issues
- **Issue**: Authentication middleware not working
- **Solution**: Verify token validation and user session management
- **Debug**: Check authentication headers and session state"""
        }
        
        return issues.get(file_type, """### General Issues
- **Issue**: File not loading or executing properly
- **Solution**: Check syntax and dependency imports
- **Debug**: Review error messages and stack traces""")

    def generate_debugging_points(self, file_path: Path, file_type: str, analysis: Dict[str, Any]) -> str:
        """Generate debugging points."""
        points = [
            f"- Verify all {len(analysis['imports'])} imports are properly resolved",
            f"- Check {len(analysis['functions'])} functions for proper error handling",
            f"- Monitor performance with {analysis['lines']} lines of code"
        ]
        
        if analysis['components']:
            points.append(f"- Ensure {len(analysis['components'])} components render correctly")
        
        if analysis['hooks']:
            points.append(f"- Verify {len(analysis['hooks'])} hooks follow React rules")
        
        return "\n".join(points)

    def generate_performance_notes(self, file_path: Path, file_type: str, analysis: Dict[str, Any]) -> str:
        """Generate performance considerations."""
        notes = []
        
        if analysis['lines'] > 500:
            notes.append("- Large file size may impact bundle size and load time")
        
        if len(analysis['functions']) > 20:
            notes.append("- Many functions may indicate need for code splitting")
        
        if file_type == 'component':
            notes.append("- Component rendering performance depends on prop changes")
        elif file_type == 'service':
            notes.append("- Service call performance affects overall application responsiveness")
        
        if not notes:
            notes.append("- Standard performance considerations apply")
        
        return "\n".join(notes)

    def generate_debug_scenarios(self, file_path: Path, file_type: str) -> str:
        """Generate common debug scenarios."""
        scenarios = {
            'component': """1. **Rendering Issues**: Check props, state, and render conditions
2. **Event Handling**: Verify event handlers and state updates
3. **Styling Problems**: Check CSS classes and styling logic
4. **Performance**: Monitor re-renders and optimization""",
            
            'hook': """1. **Hook Violations**: Ensure hooks are called at component top level
2. **Dependency Issues**: Check useEffect and useMemo dependencies
3. **State Updates**: Verify state is updating correctly
4. **Memory Leaks**: Check cleanup in useEffect""",
            
            'service': """1. **API Failures**: Check network requests and responses
2. **Data Processing**: Verify data transformation and validation
3. **Error Handling**: Ensure proper error catching and reporting
4. **Performance**: Monitor service call latency""",
            
            'route': """1. **Route Matching**: Verify route paths and parameters
2. **Middleware**: Check middleware execution order and configuration
3. **Request Processing**: Debug request parsing and validation
4. **Response Issues**: Check response formatting and status codes"""
        }
        
        return scenarios.get(file_type, """1. **Import Issues**: Check module imports and dependencies
2. **Syntax Errors**: Verify code syntax and TypeScript types
3. **Runtime Errors**: Check for null/undefined value handling
4. **Logic Errors**: Verify business logic and control flow""")

    def generate_integration_verification(self, file_path: Path, file_type: str) -> str:
        """Generate integration verification points."""
        points = [
            "- All imported modules are available and compatible",
            "- Exported functions/components are used correctly by consumers",
            "- Configuration matches expected format and values"
        ]
        
        if file_type == 'component':
            points.append("- Component props match expected interface")
            points.append("- Event handlers are properly connected")
        elif file_type == 'service':
            points.append("- API endpoints are accessible and responding")
            points.append("- Database connections are established")
        
        return "\n".join(points)

    def run_generation(self):
        """Run the complete metadata generation process."""
        print(f"🚀 Starting metadata generation for: {self.project_path}")
        print(f"📁 Metadata will be created in: {self.metadata_path}")
        
        # Ensure metadata directory exists
        self.metadata_path.mkdir(exist_ok=True)
        
        # Find all source files
        source_files = []
        for root, dirs, files in os.walk(self.project_path):
            # Filter out ignored directories
            dirs[:] = [d for d in dirs if d not in self.ignore_dirs]
            
            for file in files:
                file_path = Path(root) / file
                if self.should_analyze_file(file_path):
                    source_files.append(file_path)
        
        print(f"📊 Found {len(source_files)} files to analyze")
        
        # Generate metadata for each file
        generated_count = 0
        for file_path in source_files:
            try:
                # Create corresponding metadata file path
                relative_path = file_path.relative_to(self.project_path)
                metadata_file_path = self.metadata_path / f"{relative_path}.md"
                
                # Create directory structure in metadata folder
                metadata_file_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Generate metadata content
                metadata_content = self.generate_metadata_content(file_path)
                
                # Write metadata file
                metadata_file_path.write_text(metadata_content, encoding='utf-8')
                
                generated_count += 1
                print(f"✅ Generated metadata for: {relative_path}")
                
            except Exception as e:
                print(f"❌ Failed to generate metadata for {file_path}: {e}")
        
        print(f"\n🎉 Metadata generation complete!")
        print(f"📊 Generated {generated_count} metadata files")
        print(f"📁 All metadata files available in: {self.metadata_path}")

def main():
    """Main function to run metadata generation."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate comprehensive metadata for all project files')
    parser.add_argument('path', nargs='?', default='.', help='Project path to analyze')
    
    args = parser.parse_args()
    
    generator = MetadataGenerator(args.path)
    generator.run_generation()

if __name__ == "__main__":
    main()