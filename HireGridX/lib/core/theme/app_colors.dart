import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ===========================================================================
  // EXACT FOREST GREEN + CREAM PALETTE
  // ===========================================================================
  static const Color forestGreen = Color(0xFF14532D); // Primary #14532D
  static const Color warmCream = Color(0xFFFAF7F0); // Background #FAF7F0
  static const Color sandBeige = Color(0xFFD6C7A1); // Secondary / Supporting #D6C7A1
  static const Color slateCharcoal = Color(0xFF374151); // Primary text / Dark neutral #374151
  static const Color surfaceWhite = Color(0xFFFFFFFF); // Card / Dialog surface #FFFFFF
  static const Color mutedSlate = Color(0xFF6B7280); // Secondary text #6B7280
  static const Color softBeigeGrey = Color(0xFFE7E1D5); // Borders / Dividers #E7E1D5
  static const Color paleMint = Color(0xFFE8F3EC); // Light green surface #E8F3EC
  static const Color deepForestGreen = Color(0xFF0F4224); // Hover / Pressed primary #0F4224
  static const Color lightGrey = Color(0xFFE5E7EB); // Disabled background #E5E7EB
  static const Color greyDisabled = Color(0xFF9CA3AF); // Disabled text #9CA3AF
  static const Color success = Color(0xFF15803D); // Success #15803D
  static const Color warning = Color(0xFFB45309); // Warning #B45309
  static const Color error = Color(0xFFB91C1C); // Error #B91C1C

  // ===========================================================================
  // SEMANTIC ALIASES FOR COMPONENT COMPATIBILITY
  // ===========================================================================
  static const Color bgBase = warmCream;
  static const Color bgGradientStart = warmCream;
  static const Color bgGradientEnd = warmCream;

  // Surfaces
  static const Color surfaceCard = surfaceWhite;
  static const Color surfaceCardElevated = surfaceWhite;
  static const Color surfaceInput = surfaceWhite;
  static const Color borderSubtle = softBeigeGrey;

  // Primary Green Accents
  static const Color primaryGreen = forestGreen;
  static const Color primaryGreenDark = deepForestGreen;
  static const Color primaryGreenLight = paleMint;

  // Secondary Accents
  static const Color accentYellow = sandBeige;
  static const Color accentYellowDeep = sandBeige;

  // Blue / Dark Slate Mappings
  static const Color deepBlue = forestGreen;
  static const Color deepBlueSlate = forestGreen;

  // Typography Colors
  static const Color textPrimary = slateCharcoal;
  static const Color textSecondary = mutedSlate;
  static const Color textMuted = greyDisabled;

  // Functional Status Colors
  static const Color danger = error;
  static const Color info = forestGreen;

  // Custom Gradients
  static const LinearGradient greenGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [forestGreen, deepForestGreen],
  );

  static const LinearGradient heroBlueGreenGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [paleMint, warmCream],
  );

  static const LinearGradient premiumGoldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [sandBeige, warmCream],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [surfaceWhite, surfaceWhite],
  );

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [forestGreen, sandBeige],
  );
}
