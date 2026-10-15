# KITA — रिपोर्ट ऑडिट और सुधार

## इस संशोधित ZIP में किए गए वास्तविक बदलाव

- नकली demo notification cards हटाए; notification panel अब वास्तविक account notifications API से लोड करता है और खाली होने पर स्पष्ट empty state दिखाता है।
- hard-coded curated company cards हटाए। Company directory में अब केवल database में पंजीकृत वास्तविक employer profiles दिखाई देते हैं; किसी कंपनी को बिना जाँच verified नहीं दिखाया जाता।
- नए इंस्टॉल पर नकली seeker/employer accounts, sample support ticket और sample job-alert seed नहीं बनाए जाते। पुराने ज्ञात demo records की सफाई की जाती है; बाकी users के records को नहीं छुआ जाता।
- Job application अब expired, closed, draft या अन्य non-published listing पर स्वीकार नहीं होती; expired listings public job search से बाहर रखी गई हैं।
- Fake “uploaded CV” URL हटाया। Apply form अब वास्तविक PDF file चुनने, अधिकतम 5 MB जाँचने और server पर निजी upload करने के बाद ही application भेजता है।
- CV upload में PDF MIME/type और `%PDF-` signature की जाँच होती है; files public static folder से serve नहीं होतीं। CV केवल उसके मालिक, उस listing के employer या admin के लिए खुल सकती है।
- Application validation अब नकली `CV_Profile_KITA.pdf` fallback नहीं बनाती और portfolio link के लिए HTTPS आवश्यक है।
- Email status अब SMTP environment variables मौजूद होने पर भी गलत तरीके से “LIVE SMTP” नहीं बताता। फिलहाल lamaran database में दर्ज होती है, email वास्तव में नहीं भेजी जाती।
- Sync log अब खाली feed को `NO_FEED_CONFIGURED` बताता है; यह live jobs sync होने का झूठा दावा नहीं करता।
- External job listings के company profile को import करते समय `is_verified=1` hard-code करने वाला bug ठीक किया गया।

## जॉब डेटा की सच्चाई

KITA में अभी external job portals के official API/feed credentials configured नहीं हैं। इसलिए Jobstreet, LinkedIn Jobs, Indeed, Glints, Pasker ID, KitaLulus, Kalibrr और HiredToday के लिए keyword/location search links दिए जाते हैं। इससे portal पर current results खोजे जा सकते हैं, लेकिन वे KITA database में live imported jobs नहीं हैं। बिना अनुमति scraping या fake vacancies से यह gap नहीं भरा गया।

## चलाने का तरीका

1. ZIP extract करें।
2. `.env.example` को `.env` में copy करें।
3. `JWT_SECRET` को कम-से-कम 32 characters के random secret से भरें। Production में `KITA_BOOTSTRAP_ADMIN_EMAIL` और `KITA_BOOTSTRAP_ADMIN_PASSWORD` का सुरक्षित उपयोग करें।
4. `npm install`
5. `npm run lint`
6. `npm test`
7. `npm run build`
8. `npm run dev` से local development शुरू करें।

## Production से पहले जरूरी काम

- Email verification और password reset के लिए वास्तविक mail provider और token expiry/one-time-use flow बनाना।
- अधिकृत job API/feed integration और real individual listing URLs/status/date के साथ source-specific importer जोड़ना।
- Production database/files के लिए persistent encrypted storage, backups, retention policy और malware scanning लगाना।
- Build, unit tests, authentication, upload permission, mobile browser और deployed URL पर smoke tests चलाना।

## जाँच की स्थिति

इस environment में `npm install` timeout हुआ, इसलिए complete dependency-based build और automated test suite यहाँ pass होने की पुष्टि नहीं की जा सकी। सभी TypeScript/TSX source files का syntax transpile check किया गया; उसमें syntax errors नहीं मिले। Deployment से पहले ऊपर दिए गए commands चलाना अनिवार्य है।
