export function mapFirebaseError(error: unknown): string {
  const e = error as { code?: string; message?: string };
  switch (e.code) {
    case "permission-denied":
      return "Немає доступу до Firestore. У Firebase Console → Firestore → Rules опублікуйте правила з файлу firestore.rules у проєкті.";
    case "unavailable":
      return "Firestore тимчасово недоступний. Перевірте інтернет і спробуйте знову.";
    case "failed-precondition":
      return "Помилка запиту до бази. Оновіть сторінку або зверніться до підтримки.";
    default:
      return e.message ?? "Невідома помилка Firebase";
  }
}
