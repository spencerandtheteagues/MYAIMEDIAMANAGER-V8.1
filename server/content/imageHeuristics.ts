import sharp from "sharp";

export interface ImageQualityMetrics {
  sharpness: number;
  isBlankish: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
}

export async function basicImageQualityScores(pngBytes: Buffer): Promise<ImageQualityMetrics> {
  try {
    // Heuristic: variance of Laplacian proxy via sharp (approx with edge magnitude)
    const img = sharp(pngBytes);
    const stats = await img.stats();
    
    // Use stddev as a cheap sharpness correlate (not perfect, but catches blanks/very blurry)
    const sharpness = stats.channels?.[0]?.stdev ?? 0;
    
    // Check if image is essentially blank
    const avgBrightness = stats.channels?.reduce((sum, ch) => sum + (ch.mean || 0), 0) / (stats.channels?.length || 1);
    const isBlankish = avgBrightness < 1 && sharpness < 1;
    
    // Additional metrics
    const brightness = avgBrightness;
    const contrast = Math.max(...(stats.channels?.map(ch => ch.stdev) || [0]));
    
    // Rough saturation estimate (difference between channels)
    let saturation = 0;
    if (stats.channels && stats.channels.length >= 3) {
      const channelMeans = stats.channels.slice(0, 3).map(ch => ch.mean);
      const maxMean = Math.max(...channelMeans);
      const minMean = Math.min(...channelMeans);
      saturation = maxMean - minMean;
    }
    
    return {
      sharpness,
      isBlankish,
      brightness,
      contrast,
      saturation
    };
  } catch (error) {
    console.error("Error analyzing image quality:", error);
    return {
      sharpness: 0,
      isBlankish: true,
      brightness: 0,
      contrast: 0,
      saturation: 0
    };
  }
}

export function isAcceptableImageQuality(metrics: ImageQualityMetrics): boolean {
  // Basic thresholds for acceptable image quality
  return (
    !metrics.isBlankish &&
    metrics.sharpness > 5 && // Not too blurry
    metrics.brightness > 10 && // Not too dark
    metrics.brightness < 245 && // Not overexposed
    metrics.contrast > 10 // Has some contrast
  );
}