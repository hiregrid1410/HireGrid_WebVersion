/**
 * Utility form validation functions.
 */

export function validateProfile(form) {
  if (!form.name || form.name.trim().length < 3) {
    return {
      isValid: false,
      error: "Full name must be at least 3 characters long.",
    };
  }

  if (form.semester) {
    const sem = parseInt(form.semester, 10);
    if (isNaN(sem) || sem < 1 || sem > 8) {
      return {
        isValid: false,
        error: "Semester must be a valid number between 1 and 8.",
      };
    }
  }

  if (form.graduationYear) {
    const year = parseInt(form.graduationYear, 10);
    if (isNaN(year) || year < 2024 || year > 2035) {
      return {
        isValid: false,
        error: "Graduation year must be a valid year between 2024 and 2035.",
      };
    }
  }

  return {
    isValid: true,
    error: null,
  };
}
