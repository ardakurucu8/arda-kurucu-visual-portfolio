import AppKit

// usage: photos <srcDir> <dstDir>  — writes each JPEG with the band added underneath.
let a = CommandLine.arguments
let src = a[1], dst = a[2]
var done = 0
for name in (try FileManager.default.contentsOfDirectory(atPath: src)).sorted() where name.lowercased().hasSuffix(".jpg") {
  guard let image = NSImage(contentsOfFile: "\(src)/\(name)"), let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let w = cg.width, h = cg.height
  let bandH = max(24, Int((CGFloat(h) * BAND).rounded()))
  guard let ctx = CGContext(data: nil, width: w, height: h + bandH, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { continue }
  ctx.draw(cg, in: CGRect(x: 0, y: bandH, width: w, height: h))
  paintBand(ctx, width: w, bandHeight: bandH)
  guard let out = ctx.makeImage(), let data = NSBitmapImageRep(cgImage: out).representation(using: .jpeg, properties: [.compressionFactor: 0.86]) else { continue }
  try data.write(to: URL(fileURLWithPath: "\(dst)/\(name)"))
  done += 1
}
print("banded \(done) photos")
