#!/usr/bin/env python3
"""
TATVGYA Backend API Testing Suite
Tests all API endpoints for the educational platform
"""
import requests
import sys
import json
from datetime import datetime

class TATVGYAAPITester:
    def __init__(self, base_url="https://learn-hub-447.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def test_api_endpoint(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Generic API test method"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                self.log_test(name, False, error_msg)
                return None

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return None

    def test_health_endpoints(self):
        """Test basic health and status endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        self.test_api_endpoint("API Root", "GET", "", 200)
        
        # Test health check
        self.test_api_endpoint("Health Check", "GET", "health", 200)

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test stats endpoint
        stats = self.test_api_endpoint("Public Stats", "GET", "stats", 200)
        if stats:
            required_fields = ['total_articles', 'total_educators', 'total_views']
            for field in required_fields:
                if field in stats:
                    self.log_test(f"Stats - {field} field", True)
                else:
                    self.log_test(f"Stats - {field} field", False, f"Missing field: {field}")

        # Test subjects endpoint
        subjects = self.test_api_endpoint("Get Subjects", "GET", "subjects", 200)
        if subjects and isinstance(subjects, list):
            self.log_test("Subjects - Valid Array", True)
            if len(subjects) > 0:
                subject = subjects[0]
                required_fields = ['subject_id', 'name', 'slug']
                for field in required_fields:
                    if field in subject:
                        self.log_test(f"Subject - {field} field", True)
                    else:
                        self.log_test(f"Subject - {field} field", False, f"Missing field: {field}")
        
        # Test articles endpoint
        articles = self.test_api_endpoint("Get Articles", "GET", "articles", 200)
        if articles and isinstance(articles, list):
            self.log_test("Articles - Valid Array", True)
            if len(articles) > 0:
                article = articles[0]
                required_fields = ['article_id', 'title', 'author_name']
                for field in required_fields:
                    if field in article:
                        self.log_test(f"Article - {field} field", True)
                    else:
                        self.log_test(f"Article - {field} field", False, f"Missing field: {field}")

        # Test articles with filters
        self.test_api_endpoint("Articles - Recent Filter", "GET", "articles?sort=recent&limit=5", 200)
        self.test_api_endpoint("Articles - Trending Filter", "GET", "articles?sort=trending&limit=5", 200)
        self.test_api_endpoint("Articles - Views Filter", "GET", "articles?sort=views&limit=5", 200)
        self.test_api_endpoint("Articles - Likes Filter", "GET", "articles?sort=likes&limit=5", 200)

    def test_admin_authentication(self):
        """Test admin login functionality"""
        print("\n🔍 Testing Admin Authentication...")
        
        # Test admin login with correct credentials
        login_data = {
            "email": "aakash10@tatvgya.com",
            "password": "Astatvgyafifa-10"
        }
        
        response = self.test_api_endpoint("Admin Login", "POST", "auth/login", 200, login_data)
        if response and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Admin Login - Token Received", True)
        else:
            self.log_test("Admin Login - Token Received", False, "No access token in response")

        # Test login with wrong credentials
        wrong_login = {
            "email": "aakash10@tatvgya.com",
            "password": "wrongpassword"
        }
        self.test_api_endpoint("Admin Login - Wrong Password", "POST", "auth/login", 401, wrong_login)

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.token:
            print("\n⚠️  Skipping admin endpoints - no auth token")
            return
            
        print("\n🔍 Testing Admin Endpoints...")
        
        # Test admin dashboard
        dashboard = self.test_api_endpoint("Admin Dashboard", "GET", "admin/dashboard", 200)
        if dashboard:
            if 'stats' in dashboard:
                self.log_test("Dashboard - Stats Section", True)
            else:
                self.log_test("Dashboard - Stats Section", False, "Missing stats section")

        # Test admin educators list
        self.test_api_endpoint("Admin - Get Educators", "GET", "admin/educators", 200)
        
        # Test admin articles list
        self.test_api_endpoint("Admin - Get Articles", "GET", "admin/articles", 200)

    def test_educator_endpoints(self):
        """Test educator-related endpoints"""
        print("\n🔍 Testing Educator Endpoints...")
        
        # Test getting educators list (public)
        educators = self.test_api_endpoint("Get Educators", "GET", "educators", 200)
        if educators and isinstance(educators, list):
            self.log_test("Educators - Valid Array", True)

    def test_student_endpoints(self):
        """Test student-related endpoints"""
        print("\n🔍 Testing Student Endpoints...")
        
        # Test student registration (should work without auth)
        student_data = {
            "name": f"Test Student {datetime.now().strftime('%H%M%S')}",
            "email": f"test_student_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!"
        }
        
        self.test_api_endpoint("Student Registration", "POST", "auth/register", 201, student_data)

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting TATVGYA API Testing Suite")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Run test suites in order
        self.test_health_endpoints()
        self.test_public_endpoints()
        self.test_admin_authentication()
        self.test_admin_endpoints()
        self.test_educator_endpoints()
        self.test_student_endpoints()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")

        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['error']}")

        return len(self.failed_tests) == 0

def main():
    """Main test runner"""
    tester = TATVGYAAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())