# ФінОблік

Веб-додаток для обліку надходжень і витрат (Next.js, TypeScript, Firebase).

## Можливості

- Надходження та витрати з прив’язкою до рахунків
- Категорії витрат (додавання нових на льоту)
- Огляд: суми, залишки по рахунках, витрати по категоріях
- Фільтри та таблиця всіх операцій з редагуванням і видаленням
- Firebase Auth (email/пароль)

## Структура Firestore (масштабування на кілька організацій)

```
users/{userId}                    — профіль, defaultOrgId
orgs/{orgId}                      — організація
orgs/{orgId}/members/{userId}     — учасники та ролі
orgs/{orgId}/accounts/{id}        — рахунки
orgs/{orgId}/categories/{id}      — категорії витрат
orgs/{orgId}/transactions/{id}    — надходження та витрати (поле type)
```

При реєстрації створюється організація за замовчуванням і запис учасника з роллю `owner`.

## Налаштування Firebase

1. Створіть проєкт у [Firebase Console](https://console.firebase.google.com/).
2. Увімкніть **Authentication** → Email/Password.
3. Створіть **Firestore** database.
4. Скопіюйте `.env.example` у `.env.local` і заповніть ключі з налаштувань веб-додатку.
5. У Firebase Console → Firestore → Rules опублікуйте вміст файлу `firestore.rules`.

### Індекси

Після першого запуску Firebase може запропонувати створити індекси для запитів `orderBy`. Перейдіть за посиланням у помилці в консолі браузера або створіть вручну:

- `accounts`: `name` (Ascending)
- `categories`: `name` (Ascending)
- `transactions`: `date` (Descending)

## Запуск

```bash
npm install
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000).

## Сторінки

| Шлях | Опис |
|------|------|
| `/dashboard` | Огляд |
| `/income` | Надходження |
| `/expenses` | Витрати |
| `/categories` | Категорії |
| `/accounts` | Рахунки |
| `/operations` | Всі операції |
| `/import` | Імпорт нотаток / JSON |
