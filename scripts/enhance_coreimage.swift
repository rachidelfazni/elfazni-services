import Foundation
import CoreImage
import CoreGraphics
import ImageIO

guard CommandLine.arguments.count > 2 else {
    print("Usage: enhance <inputPath> <outputPath>")
    exit(1)
}

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]

let inputURL = URL(fileURLWithPath: inputPath)
guard let ciImage = CIImage(contentsOf: inputURL) else {
    print("Failed to load CIImage from \(inputPath)")
    exit(1)
}

let context = CIContext(options: [.useSoftwareRenderer: false])

var currentImage = ciImage

// 1. Unsharp Mask: boosts edge definition and removes fuzzy scaling softness
if let unsharpFilter = CIFilter(name: "CIUnsharpMask") {
    unsharpFilter.setValue(currentImage, forKey: kCIInputImageKey)
    unsharpFilter.setValue(2.2, forKey: kCIInputRadiusKey)
    unsharpFilter.setValue(0.85, forKey: kCIInputIntensityKey)
    if let output = unsharpFilter.outputImage {
        currentImage = output
    }
}

// 2. Sharpen Luminance: crisp micro-contrast on text, badges, reflections
if let sharpenFilter = CIFilter(name: "CISharpenLuminance") {
    sharpenFilter.setValue(currentImage, forKey: kCIInputImageKey)
    sharpenFilter.setValue(0.45, forKey: "inputSharpness")
    if let output = sharpenFilter.outputImage {
        currentImage = output
    }
}

// 3. Color Controls: enhance contrast and saturation slightly to bring out 24k gold & royal blue
if let colorFilter = CIFilter(name: "CIColorControls") {
    colorFilter.setValue(currentImage, forKey: kCIInputImageKey)
    colorFilter.setValue(1.07, forKey: kCIInputContrastKey)
    colorFilter.setValue(1.09, forKey: kCIInputSaturationKey)
    colorFilter.setValue(0.005, forKey: kCIInputBrightnessKey)
    if let output = colorFilter.outputImage {
        currentImage = output
    }
}

// 4. Vibrance: targeted enhancement for muted tones
if let vibranceFilter = CIFilter(name: "CIVibrance") {
    vibranceFilter.setValue(currentImage, forKey: kCIInputImageKey)
    vibranceFilter.setValue(0.18, forKey: "inputAmount")
    if let output = vibranceFilter.outputImage {
        currentImage = output
    }
}

guard let cgImage = context.createCGImage(currentImage, from: currentImage.extent) else {
    print("Failed to create CGImage")
    exit(1)
}

let destinationURL = URL(fileURLWithPath: outputPath) as CFURL
guard let destination = CGImageDestinationCreateWithURL(destinationURL, "public.jpeg" as CFString, 1, nil) else {
    print("Failed to create CGImageDestination")
    exit(1)
}

let options: [CFString: Any] = [
    kCGImageDestinationLossyCompressionQuality: 0.98,
    kCGImagePropertyDPIWidth: 300,
    kCGImagePropertyDPIHeight: 300
]
CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)

if CGImageDestinationFinalize(destination) {
    print("Successfully enhanced: \(outputPath)")
} else {
    print("Failed to finalize image destination")
    exit(1)
}
