import CoreGraphics
import Foundation

// Shared by the photo and video band tools. The band is a black strip added under every
// published photo and video (BAND × picture height) with the white akv mark at its right
// end. The site crops it away (CSS --band in src/styles.css), so it only shows in downloads.
let BAND: CGFloat = 0.07

let akv = "M301 719L408 499L509 705V374H554V597L646 499H731L792 624L851 499H899L791 721L691 516L610 602L707 719H649L554 603V719H468L408 597L349 719Z"
let akvBox = CGRect(x: 300, y: 290, width: 610, height: 433)

func akvPath() -> CGPath {
  let path = CGMutablePath()
  var x: CGFloat = 0, y: CGFloat = 0
  var tokens: [String] = []
  var current = ""
  for ch in akv {
    if "MLHVZ".contains(ch) { if !current.isEmpty { tokens.append(current) }; tokens.append(String(ch)); current = "" }
    else if ch == " " { if !current.isEmpty { tokens.append(current) }; current = "" }
    else { current.append(ch) }
  }
  if !current.isEmpty { tokens.append(current) }
  var i = 0
  func num() -> CGFloat { defer { i += 1 }; return CGFloat(Double(tokens[i]) ?? 0) }
  while i < tokens.count {
    let t = tokens[i]; i += 1
    switch t {
    case "M": x = num(); y = num(); path.move(to: CGPoint(x: x, y: y))
    case "L": x = num(); y = num(); path.addLine(to: CGPoint(x: x, y: y))
    case "H": x = num(); path.addLine(to: CGPoint(x: x, y: y))
    case "V": y = num(); path.addLine(to: CGPoint(x: x, y: y))
    case "Z": path.closeSubpath()
    default: break
    }
  }
  return path
}

/// Paints the black band (bottom `bandH` pixels of a `w`×`h` bitmap context, origin bottom-left) and the akv mark.
func paintBand(_ ctx: CGContext, width w: Int, bandHeight bandH: Int) {
  ctx.setFillColor(CGColor(gray: 0, alpha: 1))
  ctx.fill(CGRect(x: 0, y: 0, width: w, height: bandH))
  let markH = CGFloat(bandH) * 0.46
  let scale = markH / akvBox.height
  let markW = akvBox.width * scale
  let margin = CGFloat(bandH) * 0.55
  ctx.saveGState()
  ctx.translateBy(x: CGFloat(w) - margin - markW, y: (CGFloat(bandH) + markH) / 2)
  ctx.scaleBy(x: scale, y: -scale)
  ctx.translateBy(x: -akvBox.minX, y: -akvBox.minY)
  ctx.addPath(akvPath())
  ctx.setFillColor(CGColor(gray: 1, alpha: 1))
  ctx.fillPath()
  ctx.restoreGState()
}
