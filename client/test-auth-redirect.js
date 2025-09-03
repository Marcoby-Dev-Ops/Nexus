#!/usr/bin/env node

/**
 * Test script to verify authentication redirect flow
 * Run this script to test if the authentication system is working properly
 */

const puppeteer = require('puppeteer');

async function testAuthRedirect() {
  console.log('🧪 Starting authentication redirect test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI/CD
    devtools: true 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('📱 Browser Console:', msg.text());
    });
    
    // Navigate to the app
    console.log('🌐 Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait a moment for auth to initialize
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Successfully redirected to login page');
      
      // Try to access a protected route
      console.log('🔒 Testing protected route access...');
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
      
      await page.waitForTimeout(2000);
      const dashboardUrl = page.url();
      console.log('📍 Dashboard URL:', dashboardUrl);
      
      if (dashboardUrl.includes('/login')) {
        console.log('✅ Protected route correctly redirects to login');
      } else {
        console.log('❌ Protected route should redirect to login but went to:', dashboardUrl);
      }
      
    } else if (currentUrl.includes('/dashboard')) {
      console.log('✅ User is already authenticated, accessing dashboard');
    } else {
      console.log('❌ Unexpected redirect to:', currentUrl);
    }
    
    // Wait a bit to see any console output
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthRedirect().catch(console.error);
