import AVFoundation
import CoreVideo

// usage: videos <in.mp4> <out.mp4> — re-encodes with the black akv band under the picture.
let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let out = URL(fileURLWithPath: args[2])
let vtrack = asset.tracks(withMediaType: .video)[0]
let shown = vtrack.naturalSize.applying(vtrack.preferredTransform)
let w = Int(abs(shown.width).rounded()), h = Int(abs(shown.height).rounded())
var bandH = Int((CGFloat(h) * BAND).rounded()); if (h + bandH) % 2 == 1 { bandH += 1 }
let outH = h + bandH

let comp = AVMutableVideoComposition(propertiesOf: asset)
comp.renderSize = CGSize(width: w, height: outH)
let instruction = AVMutableVideoCompositionInstruction()
instruction.timeRange = CMTimeRange(start: .zero, duration: asset.duration)
instruction.backgroundColor = CGColor(gray: 0, alpha: 1)
let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: vtrack)
let box = CGRect(origin: .zero, size: vtrack.naturalSize).applying(vtrack.preferredTransform)
layer.setTransform(vtrack.preferredTransform.concatenating(CGAffineTransform(translationX: -box.minX, y: -box.minY)), at: .zero)
instruction.layerInstructions = [layer]
comp.instructions = [instruction]

try? FileManager.default.removeItem(at: out)
let reader = try AVAssetReader(asset: asset)
let vout = AVAssetReaderVideoCompositionOutput(videoTracks: [vtrack], videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
vout.videoComposition = comp
reader.add(vout)
var aout: AVAssetReaderTrackOutput? = nil
if let atrack = asset.tracks(withMediaType: .audio).first {
  let o = AVAssetReaderTrackOutput(track: atrack, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM])
  reader.add(o); aout = o
}
let bitrate = max(700_000, Int(Double(vtrack.estimatedDataRate) * 1.05))
let writer = try AVAssetWriter(outputURL: out, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let vin = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: w, AVVideoHeightKey: outH,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel, AVVideoMaxKeyFrameIntervalDurationKey: 2]])
vin.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vin, sourcePixelBufferAttributes: nil)
writer.add(vin)
var ain: AVAssetWriterInput? = nil
if aout != nil {
  let i = AVAssetWriterInput(mediaType: .audio, outputSettings: [AVFormatIDKey: kAudioFormatMPEG4AAC, AVNumberOfChannelsKey: 2, AVSampleRateKey: 48000, AVEncoderBitRateKey: 160000])
  writer.add(i); ain = i
}
reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)
let group = DispatchGroup()
group.enter()
vin.requestMediaDataWhenReady(on: DispatchQueue(label: "v")) {
  while vin.isReadyForMoreMediaData {
    guard let sample = vout.copyNextSampleBuffer(), let pixels = CMSampleBufferGetImageBuffer(sample) else { vin.markAsFinished(); group.leave(); return }
    CVPixelBufferLockBaseAddress(pixels, [])
    if let ctx = CGContext(data: CVPixelBufferGetBaseAddress(pixels), width: CVPixelBufferGetWidth(pixels), height: CVPixelBufferGetHeight(pixels), bitsPerComponent: 8,
                           bytesPerRow: CVPixelBufferGetBytesPerRow(pixels), space: CGColorSpaceCreateDeviceRGB(),
                           bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue) {
      paintBand(ctx, width: w, bandHeight: bandH)
    }
    CVPixelBufferUnlockBaseAddress(pixels, [])
    adaptor.append(pixels, withPresentationTime: CMSampleBufferGetPresentationTimeStamp(sample))
  }
}
if let ain = ain, let aout = aout {
  group.enter()
  ain.requestMediaDataWhenReady(on: DispatchQueue(label: "a")) {
    while ain.isReadyForMoreMediaData {
      if let b = aout.copyNextSampleBuffer() { ain.append(b) } else { ain.markAsFinished(); group.leave(); return }
    }
  }
}
group.wait()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
print(out.lastPathComponent, w, "x", outH, writer.status == .completed ? "ok" : "FAILED \(String(describing: writer.error))")
