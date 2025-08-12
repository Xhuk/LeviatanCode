#!/usr/bin/env python3
"""
Test script for chunked analysis functionality.
This script validates that the Flask analyzer can handle large projects in chunks.
"""

import os
import sys
import json
import requests
import time
from pathlib import Path

def test_chunked_analysis():
    """Test the chunked analysis functionality."""
    print("🧪 Testing chunked analysis functionality...")
    
    # Test parameters
    flask_url = "http://localhost:5001"
    test_project_path = "."  # Current LeviatanCode project
    chunk_size = 500  # Small chunks for testing
    
    # Test 1: Check Flask health
    print(f"🔍 Testing Flask analyzer health at {flask_url}")
    try:
        response = requests.get(f"{flask_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Flask analyzer is running")
        else:
            print(f"❌ Flask analyzer health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Flask analyzer not accessible: {e}")
        return False
    
    # Test 2: Run chunked analysis
    print(f"\n🔄 Testing chunked analysis on {test_project_path}")
    print(f"📦 Chunk size: {chunk_size} files")
    
    chunk_index = 0
    total_chunks_processed = 0
    has_more_chunks = True
    
    while has_more_chunks and total_chunks_processed < 5:  # Limit to 5 chunks for testing
        print(f"\n📊 Processing chunk {chunk_index + 1}...")
        
        try:
            # Make chunked analysis request
            payload = {
                "project_path": test_project_path,
                "chunk_mode": True,
                "chunk_size": chunk_size,
                "chunk_index": chunk_index
            }
            
            response = requests.post(
                f"{flask_url}/analyze",
                json=payload,
                timeout=120  # 2 minute timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success") and "chunk_metadata" in result.get("analysis", {}):
                    chunk_meta = result["analysis"]["chunk_metadata"]
                    
                    print(f"✅ Chunk {chunk_index + 1} completed:")
                    print(f"   📁 Files processed: {chunk_meta['files_in_chunk']}")
                    print(f"   📊 Progress: {chunk_meta['completion_percentage']}%")
                    print(f"   🔢 Total files found: {chunk_meta['total_files_found']}")
                    print(f"   ➡️  Has more chunks: {chunk_meta['has_more_chunks']}")
                    
                    # Update for next iteration
                    has_more_chunks = chunk_meta["has_more_chunks"]
                    chunk_index += 1
                    total_chunks_processed += 1
                    
                    # Small delay between chunks
                    time.sleep(1)
                    
                else:
                    print(f"⚠️  Chunk {chunk_index + 1} analysis returned unexpected format")
                    break
                    
            else:
                print(f"❌ Chunk {chunk_index + 1} analysis failed: {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                break
                
        except Exception as e:
            print(f"❌ Error processing chunk {chunk_index + 1}: {e}")
            break
    
    print(f"\n📈 Chunked analysis test completed!")
    print(f"   🔢 Total chunks processed: {total_chunks_processed}")
    print(f"   ✅ Test result: {'PASS' if total_chunks_processed > 0 else 'FAIL'}")
    
    return total_chunks_processed > 0

def test_standard_analysis():
    """Test standard (non-chunked) analysis for comparison."""
    print("\n🔍 Testing standard analysis for comparison...")
    
    flask_url = "http://localhost:5001"
    test_project_path = "."
    
    try:
        payload = {
            "project_path": test_project_path,
            "chunk_mode": False
        }
        
        print("⏳ Running standard analysis (this may take longer)...")
        response = requests.post(
            f"{flask_url}/analyze",
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Standard analysis completed successfully")
                analysis = result.get("analysis", {})
                if "basic_info" in analysis:
                    basic_info = analysis["basic_info"]
                    print(f"   📁 Total files: {basic_info.get('file_count', 'N/A')}")
                    print(f"   📊 Project size: {basic_info.get('size_bytes', 0) / 1024 / 1024:.1f} MB")
                return True
            else:
                print("⚠️  Standard analysis completed but returned no results")
                return False
        else:
            print(f"❌ Standard analysis failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Standard analysis error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 LeviatanCode Chunked Analysis Test Suite")
    print("=" * 60)
    
    # Run tests
    chunked_test_passed = test_chunked_analysis()
    standard_test_passed = test_standard_analysis()
    
    print("\n" + "=" * 60)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"✅ Chunked Analysis: {'PASS' if chunked_test_passed else 'FAIL'}")
    print(f"✅ Standard Analysis: {'PASS' if standard_test_passed else 'FAIL'}")
    
    if chunked_test_passed:
        print("\n🎉 Chunked analysis is working correctly!")
        print("💡 Large projects can now be analyzed in manageable chunks")
        print("🚀 This prevents timeouts and enables progressive analysis")
    else:
        print("\n❌ Chunked analysis needs attention")
        print("🔧 Check Flask analyzer configuration and dependencies")
    
    print("=" * 60)