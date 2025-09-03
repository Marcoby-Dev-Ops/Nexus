#!/usr/bin/env node

/**
 * Test script to verify profile update functionality
 * This will help test if the skills field validation issue is fixed
 */

const puppeteer = require('puppeteer');

async function testProfileUpdate() {
  console.log('🧪 Starting profile update test...');
  
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
    
    // Wait for auth to initialize
    await page.waitForTimeout(3000);
    
    // Check if we need to login
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Need to login first...');
      
      // Click the login button
      await page.click('button:contains("Sign in with Marcoby")');
      
      // Wait for redirect to Authentik
      await page.waitForTimeout(5000);
      
      console.log('⚠️  Manual login required - please complete authentication in the browser');
      console.log('⚠️  After login, the test will continue automatically');
      
      // Wait for redirect back to dashboard
      await page.waitForFunction(() => {
        return window.location.href.includes('/dashboard') || window.location.href.includes('/auth/callback');
      }, { timeout: 60000 });
      
      console.log('✅ Login completed, now on:', page.url());
    }
    
    // Navigate to settings
    console.log('⚙️  Navigating to settings...');
    await page.goto('http://localhost:5173/admin/settings', { waitUntil: 'networkidle0' });
    
    // Wait for settings to load
    await page.waitForTimeout(2000);
    
    // Test profile update
    console.log('📝 Testing profile update...');
    
    // Find and fill the skills field
    const skillsInput = await page.$('input[name="skills"], textarea[name="skills"], input[placeholder*="skills"]');
    if (skillsInput) {
      await skillsInput.clear();
      await skillsInput.type('JavaScript, React, TypeScript');
      console.log('✅ Skills field filled');
    } else {
      console.log('⚠️  Skills field not found');
    }
    
    // Find and click save button
    const saveButton = await page.$('button:contains("Save"), button[type="submit"]');
    if (saveButton) {
      await saveButton.click();
      console.log('✅ Save button clicked');
      
      // Wait for save to complete
      await page.waitForTimeout(3000);
      
      // Check for success message
      const successMessage = await page.$('text="Profile updated successfully"');
      if (successMessage) {
        console.log('✅ Profile update successful!');
      } else {
        console.log('❌ Profile update failed or no success message');
      }
    } else {
      console.log('⚠️  Save button not found');
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
testProfileUpdate().catch(console.error);
