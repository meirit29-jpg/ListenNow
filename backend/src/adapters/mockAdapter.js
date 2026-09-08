/**
 * The one active adapter in this phase.
 * Returns the exact same 25 demo items already seeded in listennow.html
 * (CONTENT_SEED), stripped down to source-only fields — no status,
 * progress, userRating, or heardDaysAgo, since those are per-user
 * consumption state and don't belong to a content source.
 *
 * When a real adapter (youtubeAdapter, podcastRssAdapter, ...) is
 * implemented later, it plugs into contentSourcesService the same way
 * this one does — same fetchItems() -> Promise<ContentItem[]> contract.
 */

const { assertValidContentItem } = require("../models/contentItem.schema");

const HOUR_MS = 3600 * 1000;
const now = Date.now();
const hoursAgo = (h) => new Date(now - h * HOUR_MS).toISOString();

const RAW_ITEMS = [
  // ---- 10 "new" items (published in the last ~2 days) ----
  { id: 1, title: "GPT הדור הבא: מה השתנה השבוע", description: "סקירה של השדרוגים האחרונים ומה הם אומרים על כיוון התעשייה.", source: "YouTube", duration: 8, publishedAt: hoursAgo(3), category: "AI וטכנולוגיה", popularity: 0.82 },
  { id: 2, title: "בועת ה-AI? כלכלנים מתווכחים", description: "פרק פודקאסט עם שני כלכלנים בעד ונגד.", source: "Podcast", duration: 14, publishedAt: hoursAgo(9), category: "AI וטכנולוגיה", popularity: 0.7 },
  { id: 3, title: "כלי חדש שכותב קוד לבד — ניסינו אותו", description: "כתבה קצרה עם דוגמאות בפועל.", source: "News", duration: 5, publishedAt: hoursAgo(1), category: "AI וטכנולוגיה", popularity: 0.65 },
  { id: 4, title: "סיכום מחזור: הפתעות ושערים", description: "כל התוצאות והרגעים החשובים של הסופ״ש.", source: "YouTube", duration: 10, publishedAt: hoursAgo(14), category: "כדורגל", popularity: 0.88 },
  { id: 5, title: "המעבר שמטלטל את הליגה", description: "פרטים ראשונים על העסקה שכולם מדברים עליה.", source: "News", duration: 4, publishedAt: hoursAgo(5), category: "כדורגל", popularity: 0.75 },
  { id: 6, title: "פודקאסט טקטי: איך מנצחים פרסים", description: "ניתוח מעמיק של תבניות משחק מודרניות.", source: "Podcast", duration: 22, publishedAt: hoursAgo(30), category: "כדורגל", popularity: 0.6 },
  { id: 7, title: "מבחן דרכים: החשמלי החדש", description: "טסט דרייב מלא כולל טווח וזמן טעינה.", source: "YouTube", duration: 12, publishedAt: hoursAgo(20), category: "רכבים", popularity: 0.79 },
  { id: 8, title: "האם רכבי חשמל זולים יותר לתחזק?", description: "בדיקה מול מכונאים ובעלי רכב.", source: "News", duration: 6, publishedAt: hoursAgo(11), category: "רכבים", popularity: 0.58 },
  { id: 9, title: "הריבית עולה שוב — מה זה אומר בפועל?", description: "הסבר קצר וברור על ההשלכות.", source: "News", duration: 5, publishedAt: hoursAgo(2), category: "עסקים", popularity: 0.68 },
  { id: 10, title: "יזם ישראלי מכר את החברה שלו ב-200 מיליון", description: "ריאיון על הדרך, הטעויות וההחלטה למכור.", source: "Podcast", duration: 18, publishedAt: hoursAgo(40), category: "עסקים", popularity: 0.73 },

  // ---- 5 already-heard items (per-user status lives client-side; only source facts here) ----
  { id: 11, title: "מבוא לבינה מלאכותית ל-2026", description: "פרק יסודות למי שרוצה להבין את הבסיס.", source: "YouTube", duration: 15, publishedAt: hoursAgo(200), category: "AI וטכנולוגיה", popularity: 0.6 },
  { id: 12, title: "5 טעויות של יזמים מתחילים", description: "פרק עם דוגמאות אמיתיות מהשטח.", source: "Podcast", duration: 20, publishedAt: hoursAgo(260), category: "עסקים", popularity: 0.55 },
  { id: 13, title: "ניתוח: למה הקבוצה הזו לא עוצרת", description: "פירוק טקטי של רצף הניצחונות.", source: "YouTube", duration: 9, publishedAt: hoursAgo(300), category: "כדורגל", popularity: 0.62 },
  { id: 14, title: "מבט שבועי על השוק", description: "סיכום שבועי קצר של האירועים הכלכליים.", source: "News", duration: 6, publishedAt: hoursAgo(320), category: "חדשות", popularity: 0.4 },
  { id: 15, title: "רכב חשמלי מול בנזין: ההשוואה המלאה", description: "עלויות, תחזוקה וביצועים זה מול זה.", source: "YouTube", duration: 11, publishedAt: hoursAgo(400), category: "רכבים", popularity: 0.5 },

  // ---- 3 "liked" items ----
  { id: 16, title: "איך בונים Startup סביב AI ב-2026", description: "פרק אורח עם מייסדת שגייסה סיד השנה.", source: "Podcast", duration: 25, publishedAt: hoursAgo(150), category: "AI וטכנולוגיה", popularity: 0.77 },
  { id: 17, title: "הרגעים הכי דרמטיים העונה", description: "קומפילציה של הרגעים שריגשו את כולם.", source: "YouTube", duration: 7, publishedAt: hoursAgo(180), category: "כדורגל", popularity: 0.85 },
  { id: 18, title: "פודקאסט יזמות: מלידיה למוצר", description: "תהליך הפיתוח המלא, שלב אחרי שלב.", source: "Podcast", duration: 30, publishedAt: hoursAgo(210), category: "עסקים", popularity: 0.66 },

  // ---- 2 "disliked" items ----
  { id: 19, title: "מהדורת חדשות כללית", description: "סיכום כללי של אירועי היום.", source: "News", duration: 10, publishedAt: hoursAgo(90), category: "חדשות", popularity: 0.3 },
  { id: 20, title: "רכילות מהעולם הגדול", description: "מה קרה השבוע בעולם הסלבריטאים.", source: "YouTube", duration: 8, publishedAt: hoursAgo(70), category: "בידור", popularity: 0.35 },

  // ---- 5 not consumed, not "new" ----
  { id: 21, title: "תגלית חדשה בחלל", description: "טלסקופ חדש מגלה משהו שלא ציפו לו.", source: "News", duration: 5, publishedAt: hoursAgo(260), category: "מדע", popularity: 0.5 },
  { id: 22, title: "הסרט שכולם מדברים עליו", description: "ביקורת קצרה בלי ספוילרים.", source: "YouTube", duration: 13, publishedAt: hoursAgo(300), category: "בידור", popularity: 0.6 },
  { id: 23, title: "כושר וספורט: טיפים לאימון בוקר", description: "שגרה קצרה שאפשר לשלב בכל יום.", source: "Podcast", duration: 16, publishedAt: hoursAgo(340), category: "ספורט", popularity: 0.45 },
  { id: 24, title: "איך לנהל תזרים מזומנים בסטארטאפ", description: "כלים פרקטיים למנהלים צעירים.", source: "News", duration: 7, publishedAt: hoursAgo(500), category: "עסקים", popularity: 0.4 },
  { id: 25, title: "רכב אוטונומי — האם זה כבר כאן?", description: "מיפוי המצב הרגולטורי והטכנולוגי.", source: "YouTube", duration: 9, publishedAt: hoursAgo(600), category: "רכבים", popularity: 0.48 },
];

const ITEMS = RAW_ITEMS.map((item) => ({
  ...item,
  url: `https://listennow.demo/content/${item.id}`,
}));

ITEMS.forEach(assertValidContentItem);

module.exports = {
  name: "mock",
  async fetchItems() {
    // Real adapters would call an upstream API/RSS feed here.
    return ITEMS;
  },
};
