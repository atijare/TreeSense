import * as tf from '@tensorflow/tfjs';

let model: tf.LayersModel | null = null;
let classMapping: Record<string, string> | null = null;
let backendInitialized = false;

// Initialize WebGL backend for GPU acceleration (much faster!)
async function initializeBackend() {
  if (backendInitialized) return;
  
  try {
    // Try to use WebGL backend (GPU) - much faster than CPU
    const backend = await tf.setBackend('webgl');
    await tf.ready();
    console.log('✅ [Backend] Using WebGL backend (GPU acceleration enabled)');
    backendInitialized = true;
  } catch (error) {
    // Fallback to CPU if WebGL not available
    console.warn('⚠️  [Backend] WebGL not available, using CPU (slower)');
    await tf.ready();
    backendInitialized = true;
  }
}

export interface PredictionResult {
  className: string;
  confidence: number;
  top3: Array<{ className: string; confidence: number }>;
  allProbabilities: Array<{ className: string; confidence: number }>;
  preprocessedImageUrl?: string;
}

export async function loadModel() {
  if (!model) {
    console.log('📦 [Model] Loading model...');
    const loadStartTime = performance.now();
    
    try {
      // Initialize WebGL backend first (GPU acceleration)
      await initializeBackend();
      
      // Load class mapping first (lightweight, won't block)
      console.log('📋 [Model] Loading class mapping...');
      const response = await fetch('/model_tfjs/class_mapping.json');
      if (!response.ok) {
        throw new Error(`Class mapping not found: ${response.status}`);
      }
      classMapping = await response.json();
      console.log('✅ [Model] Class mapping loaded:', Object.keys(classMapping).length, 'classes');
      
      // Load model with proper async handling to prevent blocking
      console.log('📥 [Model] Loading TensorFlow.js model...');
      console.log('⏱️  [Model] This may take 15-30 seconds...');
      
      // Yield to browser before loading
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Try loading with timeout and error handling
      // Use strict: false to be more lenient with model structure
      let lastProgress = 0;
      const loadPromise = tf.loadLayersModel('/model_tfjs/model.json', {
        strict: false, // Be more lenient with model structure
        onProgress: (fraction) => {
          const percent = Math.round(fraction * 100);
          const elapsed = ((performance.now() - loadStartTime) / 1000).toFixed(1);
          
          // Only log if progress actually changed (avoid spam)
          if (percent !== lastProgress) {
            console.log(`📊 [Model] Loading progress: ${percent}% (${elapsed}s elapsed)`);
            lastProgress = percent;
          }
        }
      });
      
      // Add a timeout - if it takes more than 2 minutes, something is wrong
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Model loading timeout after 2 minutes. The model may be corrupted or too large.'));
        }, 120000); // 2 minutes
      });
      
      model = await Promise.race([loadPromise, timeoutPromise]);
      
      const backend = tf.getBackend();
      console.log(`📦 [Model] Model weights downloaded, compiling model graph...`);
      console.log(`⏳ [Model] Using ${backend} backend - compilation may take:`);
      console.log(`   - WebGL (GPU): 5-10 seconds`);
      console.log(`   - CPU: 15-30 seconds`);
      
      // CRITICAL: Yield aggressively to prevent blocking during compilation
      // TensorFlow.js compiles the model graph after weights load, which is CPU-intensive
      // We need to yield frequently to keep the UI responsive
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 10));
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Verify model loaded correctly (but DON'T access properties yet - that triggers compilation)
      if (!model) {
        throw new Error('Model loaded but is null');
      }
      
      // DON'T access model.inputs or model.outputs here - that triggers synchronous compilation!
      // Model compilation will happen lazily on first prediction
      
      const loadTime = ((performance.now() - loadStartTime) / 1000).toFixed(2);
      console.log(`✅ [Model] Model structure loaded in ${loadTime}s`);
      console.log('✅ [Model] Model ready (compilation will happen on first prediction)');
      
    } catch (error: any) {
      console.error('❌ [Model] Error loading model:', error);
      console.error('❌ [Model] Error message:', error?.message);
      if (error?.stack) {
        console.error('❌ [Model] Stack trace:', error.stack);
      }
      model = null;
      classMapping = null;
      throw error;
    }
  }
  return model;
}

export async function predictImage(imageElement: HTMLImageElement): Promise<PredictionResult> {
  if (!model) await loadModel();

  // Yield before starting prediction (allows model compilation to happen gradually)
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  console.log('🖼️  [Prediction] Preprocessing image...');
  // Preprocess: resize to 224x224, normalize, add batch dimension
  const resized = tf.browser.fromPixels(imageElement).resizeNearestNeighbor([224, 224]);
  
  // Create preprocessed image for display
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 224;
  await tf.browser.toPixels(resized, canvas);
  const preprocessedImageUrl = canvas.toDataURL('image/jpeg', 0.95);
  
  // Create tensor for prediction
  const tensor = resized.toFloat().div(255.0).expandDims(0);
  resized.dispose();

  // CRITICAL: Model compilation is SYNCHRONOUS and WILL BLOCK the main thread
  // There's no way around this - TensorFlow.js compiles on first predict() call
  const backend = tf.getBackend();
  const isGPU = backend === 'webgl';
  const expectedTime = isGPU ? '5-10 seconds' : '15-30 seconds';
  
  console.log('🧠 [Prediction] Preparing model inference...');
  console.log(`   ⚠️  WARNING: First prediction compiles model (${expectedTime}, UI will freeze)`);
  console.log(`   Using ${backend} backend - ${isGPU ? 'GPU acceleration enabled!' : 'CPU (slower)'}`);
  console.log('   This is normal - TensorFlow.js compilation is synchronous');
  
  // Yield MANY times to allow UI to update BEFORE blocking
  // This gives the browser a chance to render the "compiling" message
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  
  // Give one final long yield to ensure UI updates
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('🔥 [Prediction] Starting model inference NOW...');
  console.log(`   ⚠️  UI will freeze for ${expectedTime} during compilation`);
  console.log('   This is expected - please wait...');
  console.log('   ⏳ Compilation in progress (this message confirms it started)...');
  
  // Log start time for debugging
  const compileStartTime = performance.now();
  
  // CRITICAL: Model compilation is synchronous and CANNOT be interrupted
  // If it takes more than 2 minutes, the model is likely too large for the browser
  // We can't actually timeout a synchronous operation, but we can log warnings
  console.log('⚠️  [Prediction] Starting synchronous compilation...');
  console.log('   This CANNOT be interrupted - if it hangs, the model is too large');
  console.log('   Expected: 5-30 seconds');
  console.log('   If > 2 minutes: Model may be incompatible with browser');
  
  // Unfortunately, we can't actually timeout a synchronous operation
  // The browser will show "Page Unresponsive" if it takes too long
  const predictions = model.predict(tensor) as tf.Tensor;
  
  const compileTime = ((performance.now() - compileStartTime) / 1000).toFixed(1);
  console.log(`✅ [Prediction] Model compiled in ${compileTime}s! Getting results...`);
  const probs = (await predictions.array()) as number[][];
  const probabilities = probs[0];

  // Map to class names
  const allPredictions = probabilities.map((prob, index) => ({
    className: classMapping![String(index)],
    confidence: prob
  }));

  // Sort and get results
  const sorted = [...allPredictions].sort((a, b) => b.confidence - a.confidence);

  // Cleanup
  tensor.dispose();
  predictions.dispose();

  return {
    className: sorted[0].className,
    confidence: sorted[0].confidence,
    top3: sorted.slice(0, 3),
    allProbabilities: allPredictions,
    preprocessedImageUrl
  };
}
