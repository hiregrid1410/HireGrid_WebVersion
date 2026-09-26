import 'package:flutter/material.dart';

class MountainSilhouettePainter extends CustomPainter {
  final Color primaryColor;
  final Color secondaryColor;
  final double opacity;

  MountainSilhouettePainter({
    this.primaryColor = const Color(0xFF14532D),
    this.secondaryColor = const Color(0xFF0D1B2A),
    this.opacity = 0.5,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paintBack = Paint()
      ..color = secondaryColor.withOpacity(opacity * 0.7)
      ..style = PaintingStyle.fill;

    final pathBack = Path();
    pathBack.moveTo(0, size.height);
    pathBack.lineTo(0, size.height * 0.55);
    pathBack.lineTo(size.width * 0.25, size.height * 0.40);
    pathBack.lineTo(size.width * 0.5, size.height * 0.60);
    pathBack.lineTo(size.width * 0.75, size.height * 0.35);
    pathBack.lineTo(size.width, size.height * 0.50);
    pathBack.lineTo(size.width, size.height);
    pathBack.close();
    canvas.drawPath(pathBack, paintBack);

    final paintFront = Paint()
      ..color = primaryColor.withOpacity(opacity)
      ..style = PaintingStyle.fill;

    final pathFront = Path();
    pathFront.moveTo(0, size.height);
    pathFront.lineTo(0, size.height * 0.75);
    pathFront.lineTo(size.width * 0.35, size.height * 0.55);
    pathFront.lineTo(size.width * 0.65, size.height * 0.70);
    pathFront.lineTo(size.width * 0.85, size.height * 0.48);
    pathFront.lineTo(size.width, size.height * 0.65);
    pathFront.lineTo(size.width, size.height);
    pathFront.close();
    canvas.drawPath(pathFront, paintFront);

    // Flagpole on highest peak
    final flagPaint = Paint()
      ..color = const Color(0xFFFACC15)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
      Offset(size.width * 0.85, size.height * 0.48),
      Offset(size.width * 0.85, size.height * 0.42),
      flagPaint,
    );

    final flagFill = Paint()
      ..color = const Color(0xFFFACC15)
      ..style = PaintingStyle.fill;
    final flagPath = Path();
    flagPath.moveTo(size.width * 0.85, size.height * 0.42);
    flagPath.lineTo(size.width * 0.85 + 10, size.height * 0.44);
    flagPath.lineTo(size.width * 0.85, size.height * 0.46);
    flagPath.close();
    canvas.drawPath(flagPath, flagFill);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
