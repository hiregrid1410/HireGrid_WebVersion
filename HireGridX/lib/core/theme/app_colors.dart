import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Backgrounds
  static const Color bgBase = Color(0xFF0A0E14);
  static const Color bgGradientStart = Color(0xFF0A0E14);
  static const Color bgGradientEnd = Color(0xFF0D1B2A);

  // Surfaces
  static const Color surfaceCard = Color(0xFF131A29);
  static const Color surfaceCardElevated = Color(0xFF1B2436);
  static const Color surfaceInput = Color(0xFF161F30);
  static const Color borderSubtle = Color(0xFF232C40);

  // Primary Green Accents
  static const Color primaryGreen = Color(0xFF22C55E);
  static const Color primaryGreenDark = Color(0xFF16A34A);
  static const Color primaryGreenLight = Color(0xFF4ADE80);

  // Yellow & Gold Accents
  static const Color accentYellow = Color(0xFFFACC15);
  static const Color accentYellowDeep = Color(0xFFEAB308);

  // Blue Accents
  static const Color deepBlue = Color(0xFF1E3A8A);
  static const Color deepBlueSlate = Color(0xFF1D2B53);

  // Typography Colors
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF5B6579);

  // Functional Status Colors
  static const Color danger = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF38BDF8);

  // Custom Gradients
  static const LinearGradient greenGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryGreenDark, primaryGreenLight],
  );

  static const LinearGradient heroBlueGreenGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0D1B2A), Color(0xFF14532D)],
  );

  static const LinearGradient premiumGoldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accentYellow, accentYellowDeep],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [surfaceCardElevated, surfaceCard],
  );

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryGreen, accentYellow],
  );
}
