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
}

class AttemptModel {
  final String attemptId;
  final String testTitle;
  final String moduleTitle;
  final int totalQuestions;
  final int durationSeconds;
  final List<QuestionModel> questions;

  const AttemptModel({
    required this.attemptId,
    required this.testTitle,
    required this.moduleTitle,
    required this.totalQuestions,
    required this.durationSeconds,
    required this.questions,
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
