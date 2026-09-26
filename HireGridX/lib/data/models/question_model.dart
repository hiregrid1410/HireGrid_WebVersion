class QuestionOption {
  final String id;
  final String text;

  const QuestionOption({
    required this.id,
    required this.text,
  });
}

class QuestionModel {
  final String id;
  final int index;
  final String questionText;
  final List<QuestionOption> options;
  final String correctOptionId;
  final String explanation;

  const QuestionModel({
    required this.id,
    required this.index,
    required this.questionText,
    required this.options,
    required this.correctOptionId,
    required this.explanation,
  });

  factory QuestionModel.fromBackendJson(Map<String, dynamic> json, int idx, {String? correctKey}) {
    final opts = json['options'];
    List<QuestionOption> parsedOptions = [];

    if (opts is List) {
      final labels = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (int i = 0; i < opts.length; i++) {
        final optLabel = (i < labels.length) ? labels[i] : '$i';
        parsedOptions.add(QuestionOption(
          id: optLabel,
          text: opts[i]?.toString() ?? '',
        ));
      }
    } else if (opts is Map) {
      opts.forEach((k, v) {
        parsedOptions.add(QuestionOption(
          id: k.toString(),
          text: v.toString(),
        ));
      });
    }

    String correctId = correctKey ?? '';
    if (correctId.isEmpty && json['correctAnswerIndex'] != null) {
      final idxVal = json['correctAnswerIndex'];
      if (idxVal is int && idxVal >= 0 && idxVal < parsedOptions.length) {
        correctId = parsedOptions[idxVal].id;
      } else {
        correctId = idxVal.toString();
      }
    }

    return QuestionModel(
      id: json['id']?.toString() ?? 'q_$idx',
      index: idx,
      questionText: json['question']?.toString() ?? 'Question $idx',
      options: parsedOptions,
      correctOptionId: correctId,
      explanation: json['explanation']?.toString() ?? 'Official step-by-step solution.',
    );
  }
}

class AttemptModel {
  final String attemptId;
  final String testTitle;
  final String moduleTitle;
  final int totalQuestions;
  final int durationSeconds;
  final List<QuestionModel> questions;
  final Map<String, dynamic> savedAnswers;

  const AttemptModel({
    required this.attemptId,
    required this.testTitle,
    required this.moduleTitle,
    required this.totalQuestions,
    required this.durationSeconds,
    required this.questions,
    this.savedAnswers = const {},
  });
}

class ExamResultModel {
  final String attemptId;
  final String testTitle;
  final double scorePercentage;
  final int accuracyPercentage;
  final int correctCount;
  final int wrongCount;
  final int unattemptedCount;
  final int timeTakenSeconds;
  final int xpEarned;
  final bool isPassed;
  final Map<String, String?> userAnswers; // questionId -> optionId
  final List<QuestionModel> questions;

  const ExamResultModel({
    required this.attemptId,
    required this.testTitle,
    required this.scorePercentage,
    required this.accuracyPercentage,
    required this.correctCount,
    required this.wrongCount,
    required this.unattemptedCount,
    required this.timeTakenSeconds,
    required this.xpEarned,
    required this.isPassed,
    required this.userAnswers,
    required this.questions,
  });
}
