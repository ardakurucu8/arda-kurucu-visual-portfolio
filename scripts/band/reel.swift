import AVFoundation
import CoreVideo

// usage: reel <shots.txt> <video folder> <out.mp4> <width> <height> <bitrate>
// Cuts the hero showreel: short moments of several films, crossfaded, cropped to fill
// width×height, silent, with the black akv download band under the picture.
// shots.txt: one shot per line — "<file.mp4> <start seconds> [crop top/bottom px]".
let args = CommandLine.arguments
let lines = try! String(contentsOfFile: args[1], encoding: .utf8).split(separator: "\n").map { $0.split(separator: " ").map(String.init) }.filter { $0.count >= 2 && !$0[0].hasPrefix("#") }
let base = URL(fileURLWithPath: args[2])
let out = URL(fileURLWithPath: args[3])
let W = Int(args[4])!, H = Int(args[5])!, bitrate = Int(args[6])!
var bandH = Int((CGFloat(H) * BAND).rounded()); if (H + bandH) % 2 == 1 { bandH += 1 }
let outH = H + bandH

let D = CMTime(seconds: 3.0, preferredTimescale: 600)   // each shot on screen
let F = CMTime(seconds: 0.6, preferredTimescale: 600)   // crossfade
let step = D - F
let comp = AVMutableComposition()
let tracks = [comp.addMutableTrack(withMediaType: .video, preferredTrackID: 1)!, comp.addMutableTrack(withMediaType: .video, preferredTrackID: 2)!]
var placed: [(track: AVMutableCompositionTrack, at: CMTime, transform: CGAffineTransform)] = []

for (i, l) in lines.enumerated() {
  let asset = AVURLAsset(url: base.appendingPathComponent(l[0]))
  let src = asset.tracks(withMediaType: .video)[0]
  let start = CMTime(seconds: Double(l[1])!, preferredTimescale: 600)
  let at = CMTimeMultiply(step, multiplier: Int32(i))
  let track = tracks[i % 2]
  try! track.insertTimeRange(CMTimeRange(start: start, duration: D), of: src, at: at)
  // Upright picture, then crop letterbox bars, then scale to cover W×H and centre.
  let box = CGRect(origin: .zero, size: src.naturalSize).applying(src.preferredTransform)
  var t = src.preferredTransform.concatenating(CGAffineTransform(translationX: -box.minX, y: -box.minY))
  let bars = l.count > 2 ? CGFloat(Double(l[2])!) : 0
  let cw = abs(box.width), ch = abs(box.height) - bars * 2
  let s = max(CGFloat(W) / cw, CGFloat(H) / ch)
  t = t.concatenating(CGAffineTransform(translationX: 0, y: -bars))
    .concatenating(CGAffineTransform(scaleX: s, y: s))
    .concatenating(CGAffineTransform(translationX: (CGFloat(W) - cw * s) / 2, y: (CGFloat(H) - ch * s) / 2))
  placed.append((track, at, t))
}
let total = placed.last!.at + D

func layer(_ p: (track: AVMutableCompositionTrack, at: CMTime, transform: CGAffineTransform)) -> AVMutableVideoCompositionLayerInstruction {
  let l = AVMutableVideoCompositionLayerInstruction(assetTrack: p.track)
  l.setTransform(p.transform, at: .zero)
  return l
}
var instructions: [AVMutableVideoCompositionInstruction] = []
func add(_ from: CMTime, _ to: CMTime, _ layers: [AVMutableVideoCompositionLayerInstruction]) {
  let ins = AVMutableVideoCompositionInstruction()
  ins.timeRange = CMTimeRange(start: from, end: to)
  ins.backgroundColor = CGColor(gray: 0, alpha: 1)
  ins.layerInstructions = layers
  instructions.append(ins)
}
for (i, p) in placed.enumerated() {
  let soloFrom = i == 0 ? CMTime.zero : p.at + F
  let soloTo = i == placed.count - 1 ? total : p.at + D - F
  add(soloFrom, soloTo, [layer(p)])
  if i < placed.count - 1 {
    let next = placed[i + 1]
    let incoming = layer(next)
    incoming.setOpacityRamp(fromStartOpacity: 0, toEndOpacity: 1, timeRange: CMTimeRange(start: next.at, duration: F))
    add(next.at, next.at + F, [incoming, layer(p)])
  }
}
let video = AVMutableVideoComposition()
video.renderSize = CGSize(width: W, height: outH)
video.frameDuration = CMTime(value: 1, timescale: 25)
video.instructions = instructions

try? FileManager.default.removeItem(at: out)
let reader = try! AVAssetReader(asset: comp)
reader.timeRange = CMTimeRange(start: .zero, duration: total)
let vout = AVAssetReaderVideoCompositionOutput(videoTracks: tracks, videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
vout.videoComposition = video
reader.add(vout)
let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let vin = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: outH,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel, AVVideoMaxKeyFrameIntervalDurationKey: 2]])
vin.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vin, sourcePixelBufferAttributes: nil)
writer.add(vin)
reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)
let done = DispatchSemaphore(value: 0)
vin.requestMediaDataWhenReady(on: DispatchQueue(label: "v")) {
  while vin.isReadyForMoreMediaData {
    guard let sample = vout.copyNextSampleBuffer(), let pixels = CMSampleBufferGetImageBuffer(sample) else { vin.markAsFinished(); done.signal(); return }
    CVPixelBufferLockBaseAddress(pixels, [])
    if let ctx = CGContext(data: CVPixelBufferGetBaseAddress(pixels), width: CVPixelBufferGetWidth(pixels), height: CVPixelBufferGetHeight(pixels), bitsPerComponent: 8,
                           bytesPerRow: CVPixelBufferGetBytesPerRow(pixels), space: CGColorSpaceCreateDeviceRGB(),
                           bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue) {
      paintBand(ctx, width: W, bandHeight: bandH)
    }
    CVPixelBufferUnlockBaseAddress(pixels, [])
    adaptor.append(pixels, withPresentationTime: CMSampleBufferGetPresentationTimeStamp(sample))
  }
}
done.wait()
let finished = DispatchSemaphore(value: 0)
writer.finishWriting { finished.signal() }
finished.wait()
print(out.lastPathComponent, W, "x", outH, String(format: "%.1fs", CMTimeGetSeconds(total)), writer.status == .completed ? "ok" : "FAILED \(String(describing: writer.error ?? reader.error))")
