import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UploadZone } from "@/components/UploadZone";
import { Leaf, Trees, Loader2 } from "lucide-react";
import { predictImage as predictImageAPI, checkApiHealth } from "../lib/api";
import { Progress } from "@/components/ui/progress";

const Upload = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log('🌳 [TreeSense] Application initialized');
    console.log('📱 [TreeSense] Ready to process tree leaf images');
    console.log('💡 [TreeSense] Open browser console to see processing details');
  }, []);

  const handleImageSelect = async (file: File) => {
    // Prevent multiple uploads
    if (isProcessing) {
      console.warn("⚠️  [TreeSense] Already processing an image. Please wait...");
      return;
    }

    console.log("🌳 [TreeSense] Image selected:", file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    setSelectedImage(file);
    setIsProcessing(true);
    setProgress(10);
    setProcessingStage("Loading image...");
  
    // Create an image element for prediction
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    img.src = imageUrl;
  
    img.onload = async () => {
      try {
        console.log("✅ [TreeSense] Image loaded successfully");
        setProgress(30);
        setProcessingStage("Connecting to API server...");
        
        // Check if API is available
        console.log("🔍 [TreeSense] Checking API server connection...");
        const apiAvailable = await checkApiHealth();
        if (!apiAvailable) {
          console.error("❌ [TreeSense] API server check failed");
          console.error("   Possible causes:");
          console.error("   1. Server not running - run: cd server && .\\start_server.ps1");
          console.error("   2. Ad blocker blocking localhost:5000 - disable for localhost");
          console.error("   3. Firewall blocking port 5000");
          throw new Error("Cannot connect to API server. Make sure the server is running (see SERVER_SETUP.md)");
        }
        
        console.log("✅ [TreeSense] API server is available");
        setProgress(40);
        setProcessingStage("Sending image to server for analysis...");
        console.log("🔍 [TreeSense] Running prediction via API...");
        console.log("   Image dimensions:", img.width, "x", img.height);
        
        // Update progress during API call
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 80) return prev + 2;
            return prev;
          });
        }, 200);
        
        const startTime = performance.now();
        let prediction;
        try {
          // Call API with the file
          prediction = await predictImageAPI(file);
          clearInterval(progressInterval);
          setProgress(85);
          setProcessingStage("Processing results...");
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
        const endTime = performance.now();
        const processingTime = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log("✅ [TreeSense] Prediction completed in", processingTime, "seconds");
        console.log("📊 [TreeSense] Top prediction:", prediction.className, `(${(prediction.confidence * 100).toFixed(2)}% confidence)`);
        console.log("📈 [TreeSense] Top 3 predictions:");
        prediction.top3.forEach((pred, idx) => {
          console.log(`   ${idx + 1}. ${pred.className}: ${(pred.confidence * 100).toFixed(2)}%`);
        });
  
        setProgress(90);
        setProcessingStage("Preparing results...");
        
        // Store prediction, original image URL, and preprocessed image URL in sessionStorage
        sessionStorage.setItem("prediction", JSON.stringify(prediction));
        sessionStorage.setItem("imageUrl", imageUrl);
        if (prediction.preprocessedImageUrl) {
          sessionStorage.setItem("preprocessedImageUrl", prediction.preprocessedImageUrl);
        }
        
        console.log("💾 [TreeSense] Results stored in sessionStorage");
        setProgress(100);
        setProcessingStage("Analysis complete!");
        
        // Small delay to show completion before navigating
        setTimeout(() => {
          console.log("🚀 [TreeSense] Navigating to results page...");
          navigate("/results");
        }, 500);
      } catch (error) {
        console.error("❌ [TreeSense] Error during processing:", error);
        setProcessingStage("Error occurred. Please try again.");
        setIsProcessing(false);
        setProgress(0);
      }
    };

    img.onerror = () => {
      console.error("❌ [TreeSense] Failed to load image");
      setProcessingStage("Failed to load image. Please try again.");
      setIsProcessing(false);
      setProgress(0);
    };
  };  

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section */}
      <div className="relative h-[600px] overflow-hidden bg-gradient-to-br from-[hsl(145,60%,25%)] via-[hsl(145,55%,30%)] to-[hsl(145,50%,35%)]">
        {/* Multi-Layer Pattern Background */}
        <div className="absolute inset-0">
          {/* Dot Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(145 70% 50% / 0.3) 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px'
            }}
          />
          
          {/* Larger Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(hsl(145 70% 50% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(145 70% 50% / 0.15) 1px, transparent 1px)',
              backgroundSize: '64px 64px'
            }}
          />
          
          {/* Diagonal Accent Lines */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, hsl(145 70% 50% / 0.3) 40px, hsl(145 70% 50% / 0.3) 80px)'
            }}
          />
          
          {/* Organic Blob Shapes */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,hsl(145,70%,40%,0.3)_0px,transparent_50%),radial-gradient(at_100%_100%,hsl(145,60%,50%,0.2)_0px,transparent_50%)]" />
        
        {/* Content Container */}
        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Glassmorphic Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 animate-fade-in-up">
                <Leaf className="w-4 h-4 text-[hsl(145,50%,85%)]" />
                <span className="text-sm text-white/90 font-mono tracking-wider">AI-Powered Tree Recognition</span>
              </div>
              
              {/* Main Heading */}
              <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
                    <Trees className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-6xl md:text-7xl font-bold text-gradient tracking-normal antialiased pr-2" style={{ textShadow: '0 2px 40px rgba(255,255,255,0.1)' }}>
                    TreeSense
                  </h1>
                </div>
                <p className="text-2xl md:text-3xl text-white/80 font-thin leading-[1.2] tracking-wide">
                  Identify UNCC Campus Trees with Computer Vision
                </p>
              </div>
              
              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-base font-semibold tracking-wider">
                  🌳 15+ Tree Species
                </div>
                <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-base font-semibold tracking-wider">
                  📸 Instant Recognition
                </div>
                <div className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-base font-semibold tracking-wider">
                  🎓 Campus-Specific
                </div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="mb-16 text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight pb-2">
            Start Identifying Trees
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Upload a clear photo of the tree's leaves, bark, or overall structure. 
            Our AI model recognizes 10-15 common species found on campus.
          </p>
        </div>

        <UploadZone onImageSelect={handleImageSelect} disabled={isProcessing} />

      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-2xl shadow-2xl border-2 border-primary p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-6">
              {/* Spinner */}
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              </div>
              
              {/* Status Text */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-foreground">
                  Processing Image
                </h3>
                <p className="text-muted-foreground">
                  {processingStage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              </div>

              {/* Info */}
              <p className="text-xs text-muted-foreground text-center">
                Please wait while we analyze your tree image...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
