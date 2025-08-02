#!/usr/bin/env python3
"""
Test script for LeviatanCode Flask Analyzer API
"""

import json
import requests
import tempfile
import zipfile
from pathlib import Path

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get('http://localhost:5001/health')
        print(f"Health Check Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_analyze_current_directory():
    """Test analyzing the current directory"""
    try:
        data = {"project_path": "."}
        response = requests.post('http://localhost:5001/analyze', json=data)
        
        print(f"Analysis Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            analysis = result['analysis']
            
            print("\n=== Analysis Results ===")
            print(f"Project: {analysis['basic_info']['name']}")
            print(f"Primary Language: {analysis['technologies']['primary_language']}")
            print(f"Languages: {', '.join(analysis['technologies']['languages_detected'])}")
            print(f"File Count: {analysis['basic_info']['file_count']}")
            print(f"Project Type: {analysis['structure']['estimated_project_type']}")
            print(f"Quality Score: {analysis['quality_assessment']['quality_score']}/10")
            
            if analysis['insights']['summary']:
                print(f"\nAI Summary: {analysis['insights']['summary'][:200]}...")
            
            print(f"\nRecommendations:")
            for rec in analysis['recommendations'][:3]:
                print(f"  • {rec}")
                
        else:
            print(f"Error: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"Analysis test failed: {e}")
        return False

def test_zip_upload():
    """Test ZIP file upload functionality"""
    try:
        # Create a temporary ZIP file with sample project
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = Path(temp_dir) / "sample_project"
            project_dir.mkdir()
            
            # Create sample files
            (project_dir / "package.json").write_text(json.dumps({
                "name": "sample-project",
                "version": "1.0.0",
                "scripts": {"start": "node index.js"},
                "dependencies": {"express": "^4.18.0"}
            }))
            
            (project_dir / "index.js").write_text("""
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
            """)
            
            # Create ZIP file
            zip_path = Path(temp_dir) / "sample_project.zip"
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file_path in project_dir.rglob('*'):
                    if file_path.is_file():
                        zipf.write(file_path, file_path.relative_to(project_dir))
            
            # Upload ZIP file
            with open(zip_path, 'rb') as f:
                files = {'file': ('sample_project.zip', f, 'application/zip')}
                response = requests.post('http://localhost:5001/analyze', files=files)
            
            print(f"ZIP Upload Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                analysis = result['analysis']
                print(f"Analyzed project: {analysis['basic_info']['name']}")
                print(f"Detected: {analysis['technologies']['primary_language']}")
                print(f"Frameworks: {', '.join(analysis['frameworks'])}")
            else:
                print(f"Error: {response.text}")
                
            return response.status_code == 200
            
    except Exception as e:
        print(f"ZIP upload test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing LeviatanCode Flask Analyzer API\n")
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Directory Analysis", test_analyze_current_directory),
        ("ZIP Upload", test_zip_upload)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print('='*50)
        
        try:
            success = test_func()
            results.append((test_name, success))
            print(f"✅ {test_name}: {'PASSED' if success else 'FAILED'}")
        except Exception as e:
            results.append((test_name, False))
            print(f"❌ {test_name}: FAILED - {e}")
    
    print(f"\n{'='*50}")
    print("Test Summary")
    print('='*50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Flask Analyzer API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the Flask server is running on port 5001.")

if __name__ == "__main__":
    main()