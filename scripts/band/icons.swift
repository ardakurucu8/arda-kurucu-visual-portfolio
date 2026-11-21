import AppKit

// usage: icons <publicDir> <heroPhoto> <cardPhoto>
// Writes the site icons (akv mark) and the link-preview images (Open Graph, 1200×630).
let a = CommandLine.arguments
let pub = a[1]
func save(_ ctx: CGContext, _ path: String, jpeg: Bool = false) {
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  let data = jpeg ? rep.representation(using: .jpeg, properties: [.compressionFactor: 0.86])! : rep.representation(using: .png, properties: [:])!
  try! data.write(to: URL(fileURLWithPath: path))
}
func mark(_ ctx: CGContext, x: CGFloat, y: CGFloat, height: CGFloat, dot: Bool) {
  let scale = height / akvBox.height
  ctx.saveGState()
  ctx.translateBy(x: x, y: y + height)
  ctx.scaleBy(x: scale, y: -scale)
  ctx.translateBy(x: -akvBox.minX, y: -akvBox.minY)
  ctx.addPath(akvPath()); ctx.setFillColor(CGColor(red: 0.945, green: 0.933, blue: 0.91, alpha: 1)); ctx.fillPath()
  if dot { ctx.setFillColor(CGColor(red: 0.43, green: 0, blue: 0, alpha: 1)); ctx.fillEllipse(in: CGRect(x: 869 - 39, y: 331 - 39, width: 78, height: 78)) }
  ctx.restoreGState()
}
func icon(_ size: Int, _ path: String) {
  let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.setFillColor(CGColor(red: 0.09, green: 0.094, blue: 0.09, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
  let h = CGFloat(size) * 0.44, w = h * akvBox.width / akvBox.height
  mark(ctx, x: (CGFloat(size) - w) / 2, y: (CGFloat(size) - h) / 2 - CGFloat(size) * 0.02, height: h, dot: true)
  save(ctx, path)
}
icon(180, "\(pub)/apple-touch-icon.png")
icon(192, "\(pub)/icon-192.png")
icon(512, "\(pub)/icon-512.png")
icon(32, "\(pub)/favicon-32.png")

func preview(_ photo: String, _ out: String) {
  let W = 1200, H = 630
  let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  let cg = NSImage(contentsOfFile: photo)!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
  let s = max(CGFloat(W) / CGFloat(cg.width), CGFloat(H) / CGFloat(cg.height))
  let dw = CGFloat(cg.width) * s, dh = CGFloat(cg.height) * s
  ctx.draw(cg, in: CGRect(x: (CGFloat(W) - dw) / 2, y: (CGFloat(H) - dh) / 2, width: dw, height: dh))
  // soft darkening at the bottom-left for the mark
  let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: [CGColor(gray: 0, alpha: 0.55), CGColor(gray: 0, alpha: 0)] as CFArray, locations: [0, 1])!
  ctx.drawLinearGradient(g, start: CGPoint(x: 0, y: 0), end: CGPoint(x: 0, y: 260), options: [])
  mark(ctx, x: 56, y: 52, height: 64, dot: true)
  save(ctx, out, jpeg: true)
}
preview(a[2], "\(pub)/og-image.jpg")
preview(a[3], "\(pub)/og-card.jpg")
print("icons and previews written")
