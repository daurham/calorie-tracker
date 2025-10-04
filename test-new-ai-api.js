#!/usr/bin/env node

// Test script for the converted APIs using the new AI API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api'; // Adjust if your server runs on a different port
const AI_API_KEY = '1212'; // Your API key from the test

async function testAnalyzeFood() {
  console.log('🍎 Testing analyze-food API...');
  
  try {
    const response = await fetch(`${API_BASE}/analyze-food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'grilled chicken breast with olive oil'
      })
    });
    
    const data = await response.json();
    console.log('✅ analyze-food response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ analyze-food error:', error.message);
  }
}

async function testAnalyzeIngredient() {
  console.log('🥕 Testing analyze-ingredient API...');
  
  try {
    const response = await fetch(`${API_BASE}/analyze-ingredient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'red bell pepper',
        servingType: 'serving'
      })
    });
    
    const data = await response.json();
    console.log('✅ analyze-ingredient response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ analyze-ingredient error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing converted APIs with new AI endpoint...\n');
  
  // Set the environment variable for the API key
  process.env.AI_API_KEY = AI_API_KEY;
  
  await testAnalyzeFood();
  console.log('');
  await testAnalyzeIngredient();
  
  console.log('\n✨ Test completed!');
}

runTests().catch(console.error);
