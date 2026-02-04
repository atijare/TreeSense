import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Info, BarChart3 } from "lucide-react";
import { PredictionResult } from "@/lib/tfmodel";

const Results = () => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preprocessedImageUrl, setPreprocessedImageUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    console.log('📄 [Results] Loading results page...');
    const storedImage = sessionStorage.getItem("imageUrl");
    const storedPreprocessed = sessionStorage.getItem("preprocessedImageUrl");
    const storedPrediction = sessionStorage.getItem("prediction");
    
    if (!storedImage || !storedPrediction) {
      console.warn('⚠️  [Results] Missing data in sessionStorage, redirecting to home');
      navigate("/");
      return;
    }
    
    console.log('✅ [Results] Data found in sessionStorage');
    setImageUrl(storedImage);
    if (storedPreprocessed) {
      setPreprocessedImageUrl(storedPreprocessed);
    }
    const parsedPrediction = JSON.parse(storedPrediction);
    setPrediction(parsedPrediction);
    console.log('✅ [Results] Results displayed:', parsedPrediction.className, `(${(parsedPrediction.confidence * 100).toFixed(2)}%)`);
  }, [navigate]);

  const handleNewUpload = () => {
    sessionStorage.removeItem("imageUrl");
    sessionStorage.removeItem("preprocessedImageUrl");
    sessionStorage.removeItem("prediction");
    navigate("/");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.70) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 0.85) return "bg-green-500";
    if (confidence >= 0.70) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.85) return CheckCircle2;
    if (confidence >= 0.70) return AlertCircle;
    return Info;
  };

  const formatClassName = (className: string) => {
    return className.replace(/_/g, " ").replace(/-/g, "-");
  };

  if (!imageUrl || !prediction) {
    return null;
  }

  const ConfidenceIcon = getConfidenceIcon(prediction.confidence);
  const confidencePercent = (prediction.confidence * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold text-foreground">TreeSense Results</h1>
          <Button
            variant="hero"
            onClick={handleNewUpload}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            New Upload
          </Button>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-6">
            {/* Original Image */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Original Image</h2>
              <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-border">
                <img
                  src={imageUrl}
                  alt="Original uploaded image"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Preprocessed Image */}
            {preprocessedImageUrl && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Preprocessed Image (224×224)
                </h2>
                <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-primary/50">
                  <img
                    src={preprocessedImageUrl}
                    alt="Preprocessed image for model input"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  This is the image as processed by the model (resized to 224×224 pixels)
                </p>
              </div>
            )}
          </div>

          {/* Model Output Statistics */}
          <div className="space-y-6">
            {/* Primary Prediction */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Identification Result
              </h2>
              
              <div className="rounded-2xl bg-card border-2 border-primary shadow-lg p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-bold text-foreground mb-2">
                      {formatClassName(prediction.className)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Top Prediction
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ConfidenceIcon className={`w-8 h-8 ${getConfidenceColor(prediction.confidence)}`} />
                    <span className={`text-3xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
                      {confidencePercent}%
                    </span>
                    <span className="text-xs text-muted-foreground">Confidence</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 Predictions */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Top 3 Predictions
              </h3>
              <div className="space-y-3">
                {prediction.top3.map((pred, index) => {
                  const predConfidence = (pred.confidence * 100).toFixed(2);
                  const PredIcon = getConfidenceIcon(pred.confidence);
                  return (
                    <div
                      key={index}
                      className="rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-primary' : index === 1 ? 'bg-secondary' : 'bg-muted'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {formatClassName(pred.className)}
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PredIcon className={`w-5 h-5 ${getConfidenceColor(pred.confidence)}`} />
                          <span className={`text-lg font-bold ${getConfidenceColor(pred.confidence)}`}>
                            {predConfidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full Probability Distribution */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-foreground" />
                <h3 className="text-lg font-semibold text-foreground">
                  Full Probability Distribution
                </h3>
              </div>
              <div className="rounded-xl bg-card border border-border p-4 space-y-3 max-h-96 overflow-y-auto">
                {prediction.allProbabilities
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((pred, index) => {
                    const predConfidence = (pred.confidence * 100).toFixed(2);
                    const isTop3 = index < 3;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${isTop3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {formatClassName(pred.className)}
                          </span>
                          <span className={`font-semibold ${getConfidenceColor(pred.confidence)}`}>
                            {predConfidence}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all ${getConfidenceBgColor(pred.confidence)}`}
                            style={{ width: `${pred.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
