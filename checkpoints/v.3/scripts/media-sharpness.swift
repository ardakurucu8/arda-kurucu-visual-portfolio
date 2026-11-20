// Scores how sharp each portfolio JPEG is (variance of a Laplacian filter on a
// 640px grey copy) and writes src/data/mediaSharpness.json. Album layouts use it
// to show crisp, photographic moments large and soft video stills small.
// macOS only. Run from the project root after adding photos:
//   swift scripts/media-sharpness.swift
import AppKit

let folder = "public/media/portfolio"
let output = "src/data/mediaSharpness.json"
let side = 640

func sharpness(_ path: String) -> Double? {
  guard let image = NSImage(contentsOfFile: path),
        let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }
  let scale = Double(side) / Double(max(cg.width, cg.height))
  let w = max(8, Int(Double(cg.width) * scale)), h = max(8, Int(Double(cg.height) * scale))
  var pixels = [UInt8](repeating: 0, count: w * h)
  guard let context = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return nil }
  context.interpolationQuality = .high
  context.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
  var sum = 0.0, sumSq = 0.0, n = 0.0
  for y in 1..<(h - 1) {
    for x in 1..<(w - 1) {
      let c = Double(pixels[y * w + x]) * 4
      let l = c - Double(pixels[y * w + x - 1]) - Double(pixels[y * w + x + 1]) - Double(pixels[(y - 1) * w + x]) - Double(pixels[(y + 1) * w + x])
      sum += l; sumSq += l * l; n += 1
    }
  }
  let mean = sum / n
  return sumSq / n - mean * mean
}

var scores: [String: Int] = [:]
let names = (try? FileManager.default.contentsOfDirectory(atPath: folder)) ?? []
for name in names.sorted() where name.lowercased().hasSuffix(".jpg") {
  if let score = sharpness("\(folder)/\(name)") { scores["/media/portfolio/\(name)"] = Int(score.rounded()) }
}
let data = try JSONSerialization.data(withJSONObject: scores, options: [.prettyPrinted, .sortedKeys])
try data.write(to: URL(fileURLWithPath: output))
print("media-sharpness: \(scores.count) images")
