import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/app_providers.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/question_model.dart';
import '../../shared/widgets/exam_widgets.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../data/mock/mock_data.dart';

class ExamScreen extends ConsumerStatefulWidget {
  final String attemptId;

  const ExamScreen({super.key, required this.attemptId});

  @override
  ConsumerState<ExamScreen> createState() => _ExamScreenState();
}

class _ExamScreenState extends ConsumerState<ExamScreen> with WidgetsBindingObserver {
  List<QuestionModel> _questions = [];
  int _currentIndex = 0;
  final Map<String, String?> _selectedAnswers = {};
  final Set<String> _markedForReview = {};
  int _remainingSeconds = 1800; // 30 minutes default
  int _initialDurationSeconds = 1800;
  int _violationCount = 0;
  String _activeAttemptId = '';
  String _testTitle = 'Assessment Test';
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  Timer? _timer;
  Timer? _syncTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _activeAttemptId = widget.attemptId;
    _initializeExam();
  }

  Future<void> _initializeExam() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final examRepo = ref.read(examRepositoryProvider);
      final attempt = await examRepo.startExam(widget.attemptId);

      _activeAttemptId = attempt.attemptId;
      _questions = attempt.questions.isNotEmpty ? attempt.questions : MockData.sampleQuestions;
      _remainingSeconds = attempt.durationSeconds > 0 ? attempt.durationSeconds : 1800;
      _initialDurationSeconds = _remainingSeconds;
      _testTitle = attempt.testTitle;

      // Restore previously saved answers if resuming
      if (attempt.savedAnswers != null && attempt.savedAnswers!.isNotEmpty) {
        attempt.savedAnswers!.forEach((key, val) {
          if (val != null) {
            _selectedAnswers[key] = val.toString();
          }
        });
      }

      if (mounted) {
        setState(() => _isLoading = false);
        _startTimer();
        _startSyncTimer();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          // Fallback to sample questions on error for resilience
          _questions = MockData.sampleQuestions;
          _remainingSeconds = 1800;
          _initialDurationSeconds = 1800;
        });
        _startTimer();
        _startSyncTimer();
      }
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _violationCount++;
      _triggerSync();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        _timer?.cancel();
        _submitExam(autoSubmitted: true);
      }
    });
  }

  void _startSyncTimer() {
    _syncTimer?.cancel();
    // Periodic background sync every 30 seconds
    _syncTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _triggerSync();
    });
  }

  void _triggerSync() {
    if (_activeAttemptId.isNotEmpty && _selectedAnswers.isNotEmpty) {
      ref.read(examRepositoryProvider).syncExam(
        attemptId: _activeAttemptId,
        answers: Map<String, dynamic>.from(_selectedAnswers),
        violationCount: _violationCount,
      );
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _syncTimer?.cancel();
    super.dispose();
  }

  void _selectOption(String questionId, String optionId) {
    setState(() {
      _selectedAnswers[questionId] = optionId;
    });
    // Silent auto-sync on option selection
    _triggerSync();
  }

  void _toggleMarkForReview(String questionId) {
    setState(() {
      if (_markedForReview.contains(questionId)) {
        _markedForReview.remove(questionId);
      } else {
        _markedForReview.add(questionId);
      }
    });
  }

  void _onQuestionPaletteTap(int index) {
    setState(() {
      _currentIndex = index;
    });
    Navigator.pop(context);
  }

  void _showQuestionPaletteBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceCardElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Question Palette', style: AppTextStyles.h2),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Legend
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  _buildLegendItem(AppColors.primaryGreen, 'Answered'),
                  _buildLegendItem(AppColors.accentYellow, 'Marked'),
                  _buildLegendItem(AppColors.surfaceInput, 'Unanswered'),
                ],
              ),
              const SizedBox(height: 18),
              // Grid
              GridView.builder(
                shrinkWrap: true,
                itemCount: _questions.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.2,
                ),
                itemBuilder: (context, index) {
                  final q = _questions[index];
                  final isAnswered = _selectedAnswers[q.id] != null;
                  final isMarked = _markedForReview.contains(q.id);
                  final isCurrent = index == _currentIndex;

                  Color bg = AppColors.surfaceInput;
                  Color textCol = AppColors.textSecondary;
                  if (isMarked) {
                    bg = AppColors.accentYellow.withOpacity(0.2);
                    textCol = AppColors.accentYellow;
                  } else if (isAnswered) {
                    bg = AppColors.primaryGreen.withOpacity(0.2);
                    textCol = AppColors.primaryGreen;
                  }

                  return InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () => _onQuestionPaletteTap(index),
                    child: Container(
                      decoration: BoxDecoration(
                        color: bg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isCurrent ? AppColors.primaryGreen : AppColors.borderSubtle,
                          width: isCurrent ? 2 : 1,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: AppTextStyles.h3.copyWith(
                            color: isCurrent ? AppColors.primaryGreen : textCol,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
      ],
    );
  }

  void _showSubmitConfirmationDialog() {
    final answeredCount = _selectedAnswers.values.where((v) => v != null).length;
    final unansweredCount = _questions.length - answeredCount;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.surfaceCardElevated,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: Text('Submit Exam?', style: AppTextStyles.h2),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Are you sure you want to submit your assessment?', style: AppTextStyles.bodyMd),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceInput,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        Text('$answeredCount', style: AppTextStyles.h3.copyWith(color: AppColors.primaryGreen)),
                        Text('Answered', style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted)),
                      ],
                    ),
                    Column(
                      children: [
                        Text('$unansweredCount', style: AppTextStyles.h3.copyWith(color: AppColors.warning)),
                        Text('Remaining', style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: AppTextStyles.bodyMd.copyWith(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _submitExam();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('Submit Now', style: AppTextStyles.button.copyWith(color: Colors.black)),
            ),
          ],
        );
      },
    );
  }

  void _submitExam({bool autoSubmitted = false}) async {
    _timer?.cancel();
    _syncTimer?.cancel();

    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);

    final timeTaken = _initialDurationSeconds - _remainingSeconds;

    try {
      await ref.read(examRepositoryProvider).submitExam(
        attemptId: _activeAttemptId.isNotEmpty ? _activeAttemptId : widget.attemptId,
        answers: _selectedAnswers,
        timeTakenSeconds: timeTaken > 0 ? timeTaken : 1,
        violationCount: _violationCount,
      );
    } catch (_) {
      // Continue to result screen even if network submit encountered issue (result cached/offline resilient)
    }

    if (mounted) {
      context.go('/exam/${_activeAttemptId.isNotEmpty ? _activeAttemptId : widget.attemptId}/result');
    }
  }

  Future<bool> _onWillPop() async {
    final shouldExit = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surfaceCardElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text('Exit Exam?', style: AppTextStyles.h2),
        content: Text(
          'Your progress in this test will not be saved if you leave now.',
          style: AppTextStyles.bodyMd,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Keep Practicing', style: AppTextStyles.bodyMd.copyWith(color: AppColors.primaryGreen)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Exit', style: AppTextStyles.button.copyWith(color: Colors.white)),
          ),
        ],
      ),
    );
    return shouldExit ?? false;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_testTitle, style: AppTextStyles.h3),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      );
    }

    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_testTitle, style: AppTextStyles.h3),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('No questions found for this test.', style: AppTextStyles.bodyLg),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.pop(),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
                child: const Text('Go Back', style: TextStyle(color: Colors.black)),
              ),
            ],
          ),
        ),
      );
    }

    final currentQ = _questions[_currentIndex];
    final selectedOption = _selectedAnswers[currentQ.id];
    final isMarked = _markedForReview.contains(currentQ.id);

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        final shouldPop = await _onWillPop();
        if (shouldPop && context.mounted) {
          context.pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                onPressed: () async {
                  final shouldPop = await _onWillPop();
                  if (shouldPop && context.mounted) context.pop();
                },
              ),
              Expanded(
                child: Text(
                  _testTitle,
                  style: AppTextStyles.h3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              CountdownTimerPill(remainingSeconds: _remainingSeconds),
            ],
          ),
        ),
        body: SafeArea(
          child: Column(
            children: [
              // Question Counter & Palette Opener
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Q. ${_currentIndex + 1} / ${_questions.length}',
                      style: AppTextStyles.bodyMd.copyWith(
                        color: AppColors.primaryGreen,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: _showQuestionPaletteBottomSheet,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.grid_view_rounded, size: 16, color: AppColors.textSecondary),
                            const SizedBox(width: 6),
                            Text('Palette', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(),

              // Question Text & Options
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        currentQ.questionText,
                        style: AppTextStyles.bodyLg.copyWith(
                          fontWeight: FontWeight.w600,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ...currentQ.options.map((opt) {
                        final isSelected = selectedOption == opt.id;
                        return MCQOptionTile(
                          optionLabel: opt.id,
                          text: opt.text,
                          state: isSelected ? MCQState.selected : MCQState.defaultState,
                          onTap: () => _selectOption(currentQ.id, opt.id),
                        );
                      }),
                      const SizedBox(height: 16),

                      // Mark for Review Checkbox
                      Row(
                        children: [
                          Checkbox(
                            value: isMarked,
                            activeColor: AppColors.accentYellow,
                            checkColor: Colors.black,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                            onChanged: (_) => _toggleMarkForReview(currentQ.id),
                          ),
                          Text(
                            'Mark for Review',
                            style: AppTextStyles.bodyMd.copyWith(
                              color: isMarked ? AppColors.accentYellow : AppColors.textSecondary,
                              fontWeight: isMarked ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom Navigation Actions: Prev, Next / Submit
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppColors.surfaceCardElevated,
                  border: Border(top: BorderSide(color: AppColors.borderSubtle)),
                ),
                child: Row(
                  children: [
                    if (_currentIndex > 0) ...[
                      Expanded(
                        child: SecondaryButton(
                          text: 'Previous',
                          onPressed: () {
                            setState(() {
                              _currentIndex--;
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: _currentIndex == _questions.length - 1
                          ? PrimaryButton(
                              text: 'Submit Test',
                              onPressed: _showSubmitConfirmationDialog,
                            )
                          : PrimaryButton(
                              text: 'Next',
                              onPressed: () {
                                setState(() {
                                  _currentIndex++;
                                });
                              },
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
