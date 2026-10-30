import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Renders a dynamic, repeated diagonal semi-transparent watermark
/// across sensitive screens.
///
/// Wrapped in [IgnorePointer] to ensure zero interference with touches,
/// scrolling, and interaction.
class SecurityWatermark extends StatelessWidget {
  final String text;
  final double opacity;
  final double fontSize;
  final Color textColor;
  final double angle;
  final double spacingX;
  final double spacingY;

  const SecurityWatermark({
    super.key,
    required this.text,
    this.opacity = 0.12,
    this.fontSize = 11.5,
    this.textColor = Colors.black,
    this.angle = -0.42, // ~ -24 degrees
    this.spacingX = 230.0,
    this.spacingY = 160.0,
  });

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      ignoring: true,
      child: CustomPaint(
        painter: _SecurityWatermarkPainter(
          text: text,
          opacity: opacity,
          fontSize: fontSize,
          textColor: textColor,
          angle: angle,
          spacingX: spacingX,
          spacingY: spacingY,
        ),
        size: Size.infinite,
      ),
    );
  }
}

class _SecurityWatermarkPainter extends CustomPainter {
  final String text;
  final double opacity;
  final double fontSize;
  final Color textColor;
  final double angle;
  final double spacingX;
  final double spacingY;

  late final TextPainter _textPainter;

  _SecurityWatermarkPainter({
    required this.text,
    required this.opacity,
    required this.fontSize,
    required this.textColor,
    required this.angle,
    required this.spacingX,
    required this.spacingY,
  }) {
    _textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: textColor.withValues(alpha: opacity),
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 0 || text.isEmpty) return;

    final diagonal = math.sqrt(size.width * size.width + size.height * size.height);
    final countX = (diagonal / spacingX).ceil() + 2;
    final countY = (diagonal / spacingY).ceil() + 2;

    canvas.save();
    canvas.translate(size.width / 2, size.height / 2);
    canvas.rotate(angle);
    canvas.translate(-diagonal / 2, -diagonal / 2);

    for (int y = 0; y < countY; y++) {
      final double offsetX = (y % 2 == 1) ? (spacingX / 2) : 0.0;
      for (int x = 0; x < countX; x++) {
        _textPainter.paint(
          canvas,
          Offset((x * spacingX) + offsetX, y * spacingY),
        );
      }
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _SecurityWatermarkPainter oldDelegate) {
    return oldDelegate.text != text ||
        oldDelegate.opacity != opacity ||
        oldDelegate.textColor != textColor;
  }
}
