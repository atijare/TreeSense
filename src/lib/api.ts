/**
 * API client for server-side model predictions
 * This replaces TensorFlow.js with a server API call
 */

export interface PredictionResult {
  className: string;
  confidence: number;
  top3: Array<{ className: string; confidence: number }>;
  allProbabilities: Array<{ className: string; confidence: number }>;
  preprocessedImageUrl?: string;
}

// Use Render URL in production; allow override via VITE_API_URL.
// Keep /api for local dev with Vite proxy if desired.
const API_URL = import.meta.env.VITE_API_URL || 'https://treesense.onrender.com';

/**
 * Check if the API server is running
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      // Add cache control to avoid ad blocker issues
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error: any) {
    // Check if it's a blocked request (ad blocker)
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('⚠️  [API] Request blocked - this might be an ad blocker');
      console.warn('   Try disabling ad blockers for localhost or use a different port');
    }
    return false;
  }
}

/**
 * Predict tree species from an image using the server API
 */
export async function predictImage(imageFile: File): Promise<PredictionResult> {
  console.log('🌐 [API] Sending image to server for prediction...');
  console.log(`   Image: ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)} KB)`);
  
  // Create form data
  const formData = new FormData();
  formData.append('image', imageFile);
  
  // Create preprocessed image URL for display (client-side)
  const imageUrl = URL.createObjectURL(imageFile);
  const img = new Image();
  img.src = imageUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });
  
  // Resize to 160x160 for display (matches model input size)
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, 160, 160);
  }
  const preprocessedImageUrl = canvas.toDataURL('image/jpeg', 0.95);
  
  try {
    const startTime = performance.now();
    
    // Send to server
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ [API] Prediction received in ${elapsed}s`);
    console.log(`   Top prediction: ${result.className} (${(result.confidence * 100).toFixed(2)}%)`);
    
    // Add preprocessed image URL to result
    return {
      ...result,
      preprocessedImageUrl,
    };
  } catch (error: any) {
    console.error('❌ [API] Prediction failed:', error);
    
    // Check for blocked request
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Request blocked by browser/ad blocker. Try disabling ad blockers for 127.0.0.1:5000');
    }
    
    throw new Error(`API prediction failed: ${error.message}`);
  }
}
