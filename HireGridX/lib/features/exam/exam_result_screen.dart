import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:confetti/confetti.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/app_providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/question_model.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/exam_widgets.dart';
import '../../data/mock/mock_data.dart';

class ExamResultScreen extends ConsumerStatefulWidget {
  final String attemptId;

  const ExamResultScreen({super.key, required this.attemptId});

  @override
  ConsumerState<ExamResultScreen> createState() => _ExamResultScreenState();
}

class _ExamResultScreenState extends ConsumerState<ExamResultScreen> {
  late ConfettiController _confettiController;
  bool _showDetailedReport = false;
  ExamResultModel? _result;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _confettiController.play();
    _loadResult();
  }

  void _loadResult() async {
    final result = await ref.read(examRepositoryProvider).getExamResult(widget.attemptId);
    if (mounted && result != null) {
      setState(() {
        _result = result;
      });
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  // Trophy Icon & Completion Banner
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.accentYellow.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Icon(Icons.emoji_events_rounded, color: AppColors.accentYellow, size: 40),
                    ),
                  ).animate().scale(curve: Curves.easeOutBack),
                  const SizedBox(height: 16),

                  Text(
                    _result?.testTitle ?? 'Exam Completed!',
                    style: AppTextStyles.h1,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Consumer(
                    builder: (context, ref, _) {
                      final user = ref.watch(currentUserProvider).valueOrNull;
                      final userName = user?.name.split(' ').first ?? 'Student';
                      return Text(
                        'Great job, $userName! Here\'s your performance breakdown.',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // Score Summary Grid
                  Row(
                    children: [
                      Expanded(
                        child: _buildScoreStatCard(
                          label: 'Score',
                          value: _result != null ? _result!.scorePercentage.toStringAsFixed(1) : '85.5',
                          subvalue: '/ 100',
                          valueColor: AppColors.primaryGreen,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildScoreStatCard(
                          label: 'Accuracy',
                          value: _result != null ? '${_result!.accuracyPercentage}%' : '90%',
                          subvalue: '',
                          valueColor: AppColors.info,
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 100.ms),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: _buildScoreStatCard(
                          label: 'Correct',
                          value: _result != null ? '${_result!.correctCount}' : '18',
                          subvalue: '',
                          valueColor: AppColors.primaryGreen,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildScoreStatCard(
                          label: 'Wrong',
                          value: _result != null ? '${_result!.wrongCount}' : '2',
                          subvalue: '',
                          valueColor: AppColors.danger,
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 150.ms),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: _buildScoreStatCard(
                          label: 'Unattempted',
                          value: _result != null ? '${_result!.unattemptedCount}' : '0',
                          subvalue: '',
                          valueColor: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildScoreStatCard(
                          label: 'Time Taken',
                          value: _result != null
                              ? '${_result!.timeTakenSeconds ~/ 60}m ${_result!.timeTakenSeconds % 60}s'
                              : '22m 30s',
                          subvalue: '',
                          valueColor: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 18),

                  // XP Earned Banner
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    decoration: BoxDecoration(
                      color: AppColors.accentYellow.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.accentYellow.withOpacity(0.4)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.star_rounded, color: AppColors.accentYellow, size: 24),
                        const SizedBox(width: 8),
                        Text('XP Earned: ', style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                        Text(
                          _result != null ? '+${_result!.xpEarned} XP' : '+150 XP',
                          style: AppTextStyles.h3.copyWith(
                            color: AppColors.accentYellow,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 250.ms),
                  const SizedBox(height: 24),

                  // Action Buttons
                  SecondaryButton(
                    text: _showDetailedReport ? 'Hide Detailed Report' : 'View Detailed Report',
                    icon: Icon(
                      _showDetailedReport ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                      color: AppColors.primaryGreen,
                    ),
                    onPressed: () {
                      setState(() {
                        _showDetailedReport = !_showDetailedReport;
                      });
                    },
                  ),
                  const SizedBox(height: 12),

                  PrimaryButton(
                    text: 'Back to Dashboard',
                    onPressed: () => context.go('/home'),
                  ),
                  const SizedBox(height: 20),

                  // Expandable Detailed Report View
                  if (_showDetailedReport) ...[
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Questions Review', style: AppTextStyles.h2),
                    ),
                    const SizedBox(height: 12),
                    ...MockData.sampleQuestions.map((q) {
                      final isCorrect = q.id != 'q2'; // Mock: q2 marked wrong
                      final userAns = isCorrect ? q.correctOptionId : 'A';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isCorrect ? AppColors.primaryGreen.withOpacity(0.4) : AppColors.danger.withOpacity(0.4),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text('Q.${q.index}', style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700)),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isCorrect ? AppColors.primaryGreen.withOpacity(0.15) : AppColors.danger.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isCorrect ? 'Correct (+5)' : 'Incorrect (0)',
                                    style: AppTextStyles.label.copyWith(
                                      color: isCorrect ? AppColors.primaryGreen : AppColors.danger,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(q.questionText, style: AppTextStyles.bodyMd),
                            const SizedBox(height: 12),
                            ...q.options.map((opt) {
                              MCQState state = MCQState.defaultState;
                              if (opt.id == q.correctOptionId) {
                                state = MCQState.correct;
                              } else if (opt.id == userAns && !isCorrect) {
                                state = MCQState.incorrect;
                              }

                              return MCQOptionTile(
                                optionLabel: opt.id,
                                text: opt.text,
                                state: state,
                                onTap: () {},
                              );
                            }),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceInput,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.info_outline_rounded, color: AppColors.textMuted, size: 16),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Explanation: ${q.explanation}',
                                      style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ),

          // Confetti Overlay
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              shouldLoop: false,
              colors: const [
                AppColors.primaryGreen,
                AppColors.accentYellow,
                Colors.blue,
                Colors.orange,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreStatCard({
    required String label,
    required String value,
    required String subvalue,
    required Color valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: AppTextStyles.label.copyWith(fontSize: 10)),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: AppTextStyles.numeric.copyWith(color: valueColor, fontSize: 20),
              ),
              if (subvalue.isNotEmpty)
                Text(
                  subvalue,
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
