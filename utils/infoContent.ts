export type InfoPageType = 'about' | 'terms' | 'privacy' | 'contact' | 'safety' | 'return';
export type InfoLanguage = 'bn' | 'en';

export interface InfoContentItem {
    slug: string;
    title: string;
    content: string;
    titleBn: string;
    titleEn: string;
    contentBn: string;
    contentEn: string;
}

interface InfoContentInput {
    slug: string;
    titleBn: string;
    titleEn: string;
    contentBn: string;
    contentEn: string;
}

const makeInfoItem = (item: InfoContentInput): InfoContentItem => ({
    ...item,
    title: item.titleBn,
    content: item.contentBn
});

export const INFO_CONTENT: Record<InfoPageType, InfoContentItem> = {
    about: makeInfoItem({
        slug: 'about-us',
        titleBn: 'Shadamon.com সম্পর্কে',
        titleEn: 'About Shadamon.com',
        contentEn: `Shadamon.com is a modern online marketplace where you can easily and safely buy and sell various types of products. You can find products from your nearby area or anywhere across Bangladesh.

Do you want to sell something?
Creating an account on Shadamon.com is completely free and very easy. Within just a few minutes, you can post your product advertisements and reach interested buyers.
To sell faster, make sure your advertisement is clear, informative, and attractive. If you have multiple products or sell professionally, you can use Shadamon.com's premium features to reach even more people.

Do you want to buy something?
Shadamon.com offers a wide range of products from all over Bangladesh across different categories. From electronics, vehicles, and home essentials to everyday items-you can find everything in one place.
Easy search and filter options help you quickly find exactly what you need.

Quality Assurance
Every advertisement on Shadamon.com is reviewed before publication to maintain quality and trustworthiness.`,
        contentBn: `Shadamon.com একটি আধুনিক অনলাইন মার্কেটপ্লেস যেখানে আপনি খুব সহজে এবং নিরাপদে বিভিন্ন ধরনের পণ্য কেনা-বেচা করতে পারেন। আপনি আপনার নিকটস্থ এলাকা কিংবা বাংলাদেশের যেকোনো প্রান্তের পণ্য এখানে খুঁজে পেতে পারেন।

আপনি কি কিছু বিক্রি করতে চান?
Shadamon.com-এ অ্যাকাউন্ট খোলা সম্পূর্ণ ফ্রি এবং অত্যন্ত সহজ। মাত্র কয়েক মিনিটের মধ্যেই আপনি আপনার পণ্যের বিজ্ঞাপন পোস্ট করতে পারেন এবং আগ্রহী ক্রেতাদের কাছে পৌঁছে যেতে পারেন।
দ্রুত বিক্রির জন্য নিশ্চিত করুন যে আপনার বিজ্ঞাপনটি স্পষ্ট, তথ্যবহুল এবং আকর্ষণীয়। আপনার যদি অনেকগুলো পণ্য থাকে বা আপনি পেশাদারভাবে বিক্রি করতে চান, তবে আরও বেশি মানুষের কাছে পৌঁছাতে আপনি Shadamon.com-এর প্রিমিয়াম ফিচারগুলো ব্যবহার করতে পারেন।

আপনি কি কিছু কিনতে চান?
Shadamon.com বিভিন্ন ক্যাটাগরিতে সারা বাংলাদেশের পণ্যের এক বিশাল সমাহার অফার করে। ইলেকট্রনিক্স, যানবাহন, ঘরের প্রয়োজনীয় সরঞ্জাম থেকে শুরু করে নিত্যদিনের পণ্য-সবকিছুই পাবেন এক জায়গায়।
সহজ সার্চ এবং ফিল্টার অপশন আপনাকে আপনার প্রয়োজনীয় পণ্যটি দ্রুত খুঁজে পেতে সাহায্য করবে।

মান নিশ্চিতকরণ (Quality Assurance)
মানসম্মত সেবা এবং বিশ্বস্ততা বজায় রাখতে Shadamon.com-এ প্রতিটি বিজ্ঞাপন প্রকাশের আগে গুরুত্বের সাথে পর্যালোচনা করা হয়।`
    }),
    terms: makeInfoItem({
        slug: 'terms-and-conditions',
        titleBn: 'SHADAMON.COM – ব্যবহারের শর্তাবলি',
        titleEn: 'SHADAMON.COM – TERMS OF USE',
        contentEn: `1. Acceptance of Terms
1.1 These Terms of Use ("Terms") form a legally binding agreement between you and Shadamon.com.
1.2 By accessing or using Shadamon.com (website, mobile application, or services), you agree to be bound by these Terms and our Privacy Policy.
1.3 If you do not agree to any part of these Terms, you must not use the platform.
1.4 We reserve the right to modify or update these Terms at any time. Continued use of the platform means acceptance of updated Terms.

2. Nature of the Platform
2.1 Shadamon.com is an online marketplace that allows users to post advertisements, view listings, and communicate with each other.
2.2 The platform is not a buyer, seller, agent, broker, or intermediary in any transaction.
2.3 All transactions are conducted directly between users at their own risk.
2.4 We do not guarantee the quality, safety, legality, or accuracy of any listing.

3. Account Registration
3.1 Some features require account registration.
3.2 Users must provide accurate and complete information.
3.3 Only one account per user is allowed unless otherwise permitted.
3.4 Users are responsible for maintaining the confidentiality of their account.
3.5 Users must be at least 18 years old or use the platform under parental or guardian supervision.

4. User Responsibilities
4.1 Users must use the platform only for lawful purposes.
4.2 Users must not engage in fraud, misleading activity, or illegal conduct.
4.3 Users must not collect or misuse other users' personal data.
4.4 Users are responsible for verifying all information before transactions.
4.5 Users are advised to meet in safe and public places for transactions.

5. Content and Listings
5.1 Users are solely responsible for all content they post.
5.2 The following content is strictly prohibited:
5.2.1 Illegal goods or services
5.2.2 Fraudulent or misleading content
5.2.3 Adult or pornographic material
5.2.4 Weapons, drugs, or restricted items
5.2.5 Copyright-infringing content
5.2.6 Hate speech or harmful content
5.3 We may remove or restrict any content without prior notice if it violates policies or law.
5.4 We are not responsible for the accuracy of user-generated content.

6. Free and Paid Services
6.1 Some services are free and some are paid.
6.2 We may limit free listings or features.
6.3 Paid promotions only increase visibility and do not guarantee results.
6.4 Fees may change at any time without prior notice.
6.5 Paid services are generally non-refundable unless required by law.

7. Safety and Risk
7.1 Users are solely responsible for verifying products and other users before transactions.
7.2 All interactions between users are at their own risk.
7.3 We do not guarantee safety, outcome, or legality of any transaction.
7.4 Shadamon.com is not responsible for fraud, scams, or disputes between users.

8. Intellectual Property
8.1 Users retain ownership of their content.
8.2 By posting content, users grant Shadamon.com a non-exclusive license to use it for platform operation and promotion.
8.3 All platform branding, design, and software remain the property of Shadamon.com.

9. Limitation of Liability
9.1 To the maximum extent permitted by law, Shadamon.com is not liable for any indirect, incidental, or financial loss.
9.2 The platform is provided on an "as is" and "as available" basis.
9.3 We are not responsible for technical errors, downtime, or system failures.
9.4 Any loss due to unintended errors, system issues, or platform malfunction is not the responsibility of Shadamon.com unless required by law.

10. Indemnification
10.1 Users agree to indemnify and hold harmless Shadamon.com from any claims, damages, or legal actions arising from:
10.1.1 Use of the platform
10.1.2 User content or listings
10.1.3 Violation of these Terms
10.1.4 Any user-to-user transaction

11. Service Changes
11.1 We may modify, suspend, or discontinue any part of the platform at any time.
11.2 We are not required to provide prior notice for such changes.
11.3 We are not liable for any resulting loss.

12. Governing Law
12.1 These Terms are governed by the laws of Bangladesh.
12.2 Any disputes shall be resolved under applicable laws of Bangladesh.

13. Contact
13.1 Email: shadamon.com@gmail.com
13.2 Messenger: m.me/shadamondotcom`,
        contentBn: `১. শর্তাবলি গ্রহণ
১.১ এই ব্যবহারের শর্তাবলি ("শর্তাবলি") আপনার এবং Shadamon.com-এর মধ্যে একটি আইনত বাধ্যতামূলক চুক্তি গঠন করে।
১.২ Shadamon.com (ওয়েবসাইট, মোবাইল অ্যাপ্লিকেশন বা পরিষেবা) অ্যাক্সেস বা ব্যবহারের মাধ্যমে আপনি এই শর্তাবলি এবং আমাদের গোপনীয়তা নীতি মেনে চলতে সম্মত হচ্ছেন।
১.৩ আপনি যদি এই শর্তাবলির কোনো অংশের সাথে একমত না হন, তবে আপনাকে অবশ্যই এই প্ল্যাটফর্মটি ব্যবহার করা থেকে বিরত থাকতে হবে।
১.৪ আমরা যেকোনো সময় এই শর্তাবলি পরিবর্তন বা আপডেট করার অধিকার সংরক্ষণ করি। প্ল্যাটফর্মটির ক্রমাগত ব্যবহার মানে হলো আপনি আপডেট করা শর্তাবলি গ্রহণ করেছেন।

২. প্ল্যাটফর্মের ধরণ
২.১ Shadamon.com একটি অনলাইন মার্কেটপ্লেস যা ব্যবহারকারীদের বিজ্ঞাপন পোস্ট করতে, লিস্টিং দেখতে এবং একে অপরের সাথে যোগাযোগ করতে সাহায্য করে।
২.২ এই প্ল্যাটফর্মটি কোনো লেনদেনের ক্ষেত্রে ক্রেতা, বিক্রেতা, এজেন্ট, ব্রোকার বা মধ্যস্থতাকারী হিসেবে কাজ করে না।
২.৩ সকল লেনদেন ব্যবহারকারীদের মধ্যে সরাসরি এবং তাদের নিজস্ব ঝুঁকিতে সম্পন্ন হয়।
২.৪ আমরা কোনো লিস্টিংয়ের গুণমান, নিরাপত্তা, বৈধতা বা নির্ভুলতার গ্যারান্টি দিই না।

৩. অ্যাকাউন্ট নিবন্ধন
৩.১ কিছু ফিচার ব্যবহারের জন্য অ্যাকাউন্ট নিবন্ধনের প্রয়োজন হতে পারে।
৩.২ ব্যবহারকারীদের অবশ্যই সঠিক এবং সম্পূর্ণ তথ্য প্রদান করতে হবে।
৩.৩ অনুমতি ব্যতিরেকে একজন ব্যবহারকারীর জন্য কেবল একটি অ্যাকাউন্ট অনুমোদিত।
৩.৪ ব্যবহারকারীরা তাদের অ্যাকাউন্টের গোপনীয়তা বজায় রাখার জন্য দায়ী।
৩.৫ ব্যবহারকারীর বয়স কমপক্ষে ১৮ বছর হতে হবে অথবা পিতামাতা বা অভিভাবকের তত্ত্বাবধানে প্ল্যাটফর্মটি ব্যবহার করতে হবে।

৪. ব্যবহারকারীর দায়িত্ব
৪.১ ব্যবহারকারীদের অবশ্যই প্ল্যাটফর্মটি কেবল বৈধ উদ্দেশ্যে ব্যবহার করতে হবে।
৪.২ ব্যবহারকারীরা কোনো প্রতারণা, বিভ্রান্তিকর কার্যকলাপ বা অবৈধ আচরণে লিপ্ত হতে পারবেন না।
৪.৩ ব্যবহারকারীরা অন্য ব্যবহারকারীদের ব্যক্তিগত তথ্য সংগ্রহ বা অপব্যবহার করতে পারবেন না।
৪.৪ লেনদেনের আগে সমস্ত তথ্য যাচাই করার দায়িত্ব ব্যবহারকারীর।
৪.৫ লেনদেনের জন্য ব্যবহারকারীদের নিরাপদ এবং জনাকীর্ণ স্থানে দেখা করার পরামর্শ দেওয়া হয়।

৫. কন্টেন্ট এবং লিস্টিং
৫.১ ব্যবহারকারীরা তাদের পোস্ট করা সমস্ত কন্টেন্টের জন্য এককভাবে দায়ী।
৫.২ নিম্নলিখিত কন্টেন্টগুলো কঠোরভাবে নিষিদ্ধ:
৫.২.১ অবৈধ পণ্য বা পরিষেবা
৫.২.২ প্রতারণামূলক বা বিভ্রান্তিকর কন্টেন্ট
৫.২.৩ প্রাপ্তবয়স্কদের বা পর্নোগ্রাফিক উপাদান
৫.২.৪ অস্ত্র, মাদক বা নিষিদ্ধ আইটেম
৫.২.৫ কপিরাইট লঙ্ঘনকারী কন্টেন্ট
৫.২.৬ ঘৃণা প্রচারকারী (Hate speech) বা ক্ষতিকারক কন্টেন্ট
৫.৩ নীতি বা আইন লঙ্ঘন করলে আমরা আগাম নোটিশ ছাড়াই যেকোনো কন্টেন্ট অপসারণ বা সীমাবদ্ধ করতে পারি।
৫.৪ ব্যবহারকারীর তৈরি কন্টেন্টের নির্ভুলতার জন্য আমরা দায়ী নই।

৬. ফ্রি এবং পেইড পরিষেবা
৬.১ কিছু পরিষেবা বিনামূল্যে এবং কিছু পেইড (পেমেন্ট সাপেক্ষে)।
৬.২ আমরা ফ্রি লিস্টিং বা ফিচারের সংখ্যা সীমিত করতে পারি।
৬.৩ পেইড প্রমোশন শুধুমাত্র দৃশ্যমানতা বৃদ্ধি করে এবং কোনো ফলাফলের গ্যারান্টি দেয় না।
৬.৪ ফি যেকোনো সময় আগাম নোটিশ ছাড়াই পরিবর্তিত হতে পারে।
৬.৫ আইনগত বাধ্যবাধকতা না থাকলে পেইড পরিষেবাগুলো সাধারণত অফেরতযোগ্য (non-refundable)।

৭. নিরাপত্তা এবং ঝুঁকি
৭.১ লেনদেনের আগে পণ্য এবং অন্যান্য ব্যবহারকারীদের যাচাই করার দায়িত্ব সম্পূর্ণভাবে ব্যবহারকারীর।
৭.২ ব্যবহারকারীদের মধ্যে সমস্ত মিথস্ক্রিয়া তাদের নিজস্ব ঝুঁকিতে হয়।
৭.৩ আমরা কোনো লেনদেনের নিরাপত্তা, ফলাফল বা বৈধতার গ্যারান্টি দিই না।
৭.৪ Shadamon.com কোনো প্রতারণা, জালিয়াতি বা ব্যবহারকারীদের মধ্যকার বিরোধের জন্য দায়ী নয়।

৮. মেধা সম্পত্তি (Intellectual Property)
৮.১ ব্যবহারকারীরা তাদের কন্টেন্টের মালিকানা ধরে রাখেন।
৮.২ কন্টেন্ট পোস্ট করার মাধ্যমে, ব্যবহারকারীরা Shadamon.com-কে প্ল্যাটফর্ম পরিচালনা এবং প্রচারের জন্য এটি ব্যবহার করার একটি অ-একচেটিয়া লাইসেন্স প্রদান করেন।
৮.৩ প্ল্যাটফর্মের সমস্ত ব্র্যান্ডিং, ডিজাইন এবং সফটওয়্যার Shadamon.com-এর সম্পত্তি হিসেবে থাকবে।

৯. দায়ের সীমাবদ্ধতা (Limitation of Liability)
৯.১ আইনের সর্বোচ্চ সীমা অনুযায়ী, Shadamon.com কোনো পরোক্ষ, আনুষঙ্গিক বা আর্থিক ক্ষতির জন্য দায়ী নয়।
৯.২ প্ল্যাটফর্মটি "যেমন আছে" (as is) এবং "যেমন পাওয়া যায়" (as available) ভিত্তিতে প্রদান করা হয়।
৯.৩ আমরা প্রযুক্তিগত ত্রুটি, ডাউনটাইম বা সিস্টেমের ব্যর্থতার জন্য দায়ী নই।
৯.৪ অনিচ্ছাকৃত ত্রুটি, সিস্টেম সমস্যা বা প্ল্যাটফর্মের ত্রুটির কারণে কোনো ক্ষতি হলে Shadamon.com দায়ী থাকবে না (যদি না আইনত প্রয়োজন হয়)।

১০. ক্ষতিপূরণ (Indemnification)
১০.১ ব্যবহারকারীরা Shadamon.com-কে যেকোনো দাবি, ক্ষতি বা আইনি পদক্ষেপ থেকে মুক্ত রাখতে এবং ক্ষতিপূরণ দিতে সম্মত হন যা নিম্নলিখিত কারণে উদ্ভূত হতে পারে:
১০.১.১ প্ল্যাটফর্মের ব্যবহার
১০.১.২ ব্যবহারকারীর কন্টেন্ট বা লিস্টিং
১০.১.৩ এই শর্তাবলির লঙ্ঘন
১০.১.৪ যেকোনো ব্যবহারকারী-থেকে-ব্যবহারকারী লেনদেন

১১. পরিষেবা পরিবর্তন
১১.১ আমরা যেকোনো সময় প্ল্যাটফর্মের যেকোনো অংশ পরিবর্তন, স্থগিত বা বন্ধ করতে পারি।
১১.২ এই ধরনের পরিবর্তনের জন্য আমাদের আগাম নোটিশ দেওয়ার প্রয়োজন নেই।
১১.৩ এর ফলে হওয়া কোনো ক্ষতির জন্য আমরা দায়ী নই।

১২. প্রযোজ্য আইন
১২.১ এই শর্তাবলি বাংলাদেশের আইন দ্বারা পরিচালিত।
১২.২ যেকোনো বিরোধ বাংলাদেশের প্রচলিত আইনের অধীনে সমাধান করা হবে।

১৩. যোগাযোগ
১৩.১ ইমেইল: shadamon.com@gmail.com
১৩.২ মেসেঞ্জার: m.me/shadamondotcom`
    }),
    privacy: makeInfoItem({
        slug: 'privacy-policy',
        titleBn: 'SHADAMON.COM – গোপনীয়তা নীতি',
        titleEn: 'SHADAMON.COM – PRIVACY POLICY',
        contentEn: `1. Introduction
1.1 This Privacy Policy explains how Shadamon.com collects, uses, and protects user data.
1.2 By using the platform, you agree to this Privacy Policy.

2. Information We Collect
2.1 Information you provide:
2.1.1 Name
2.1.2 Phone number
2.1.3 Email address
2.1.4 Profile and account details
2.1.5 Address or location
2.1.6 Content and listings
2.2 Automatically collected information:
2.2.1 IP address
2.2.2 Device and browser data
2.2.3 Usage activity logs
2.2.4 Cookies and tracking data
2.2.5 Location data (if enabled)

3. Use of Information
3.1 Provide and maintain services
3.2 Manage user accounts
3.3 Enable communication between users
3.4 Prevent fraud and abuse
3.5 Improve platform performance
3.6 Provide customer support
3.7 Deliver relevant content and advertisements

4. Cookies
4.1 Cookies are used to improve user experience.
4.2 Types include:
4.2.1 Session cookies
4.2.2 Preference cookies
4.2.3 Security cookies
4.3 Users may disable cookies, but some features may not work properly.

5. Data Sharing
5.1 We do not sell personal data.
5.2 We may share data with:
5.2.1 Service providers
5.2.2 Legal authorities when required by law
5.2.3 Business partners for operational purposes

6. Data Security
6.1 We use reasonable security measures to protect data.
6.2 However, no system is fully secure.

7. Data Retention
7.1 Data is retained only as long as necessary for service, legal, or operational requirements.

8. User Rights
8.1 Users may request:
8.1.1 Access to data
8.1.2 Correction of data
8.1.3 Deletion of data
8.1.4 Restriction of processing

9. Age Restriction
9.1 Users must be at least 18 years old or use the platform under guardian supervision.

10. Changes to Policy
10.1 We may update this Privacy Policy at any time.
10.2 Continued use of the platform means acceptance of changes.

11. Contact
11.1 Email: shadamon.com@gmail.com
11.2 Messenger: m.me/shadamonDotCom
Effective Date: 1 May 2026`,
        contentBn: `১. ভূমিকা
১.১ এই গোপনীয়তা নীতি ব্যাখ্যা করে যে Shadamon.com কীভাবে ব্যবহারকারীর তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষা প্রদান করে।
১.২ প্ল্যাটফর্মটি ব্যবহারের মাধ্যমে আপনি এই গোপনীয়তা নীতির সাথে একমত পোষণ করছেন।

২. আমরা যে তথ্য সংগ্রহ করি
২.১ আপনার প্রদান করা তথ্য:
২.১.১ নাম
২.১.২ ফোন নম্বর
২.১.৩ ইমেইল ঠিকানা
২.১.৪ প্রোফাইল এবং অ্যাকাউন্টের বিবরণ
২.১.৫ ঠিকানা বা অবস্থান
২.১.৬ কন্টেন্ট এবং লিস্টিং
২.২ স্বয়ংক্রিয়ভাবে সংগৃহীত তথ্য:
২.২.১ আইপি (IP) ঠিকানা
২.২.২ ডিভাইস এবং ব্রাউজার সংক্রান্ত তথ্য
২.২.৩ ব্যবহারের অ্যাক্টিভিটি লগ
২.২.৪ কুকিজ (Cookies) এবং ট্র্যাকিং ডেটা
২.২.৫ লোকেশন ডেটা বা অবস্থান সংক্রান্ত তথ্য (যদি চালু থাকে)

৩. তথ্যের ব্যবহার
৩.১ পরিষেবা প্রদান এবং রক্ষণাবেক্ষণ করা
৩.২ ব্যবহারকারীর অ্যাকাউন্ট পরিচালনা করা
৩.৩ ব্যবহারকারীদের মধ্যে যোগাযোগের সুবিধা দেওয়া
৩.৪ প্রতারণা এবং অপব্যবহার রোধ করা
৩.৫ প্ল্যাটফর্মের কার্যক্ষমতা উন্নত করা
৩.৬ কাস্টমার সাপোর্ট প্রদান করা
৩.৭ প্রাসঙ্গিক কন্টেন্ট এবং বিজ্ঞাপন পৌঁছে দেওয়া

৪. কুকিজ (Cookies)
৪.১ ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে কুকিজ ব্যবহার করা হয়।
৪.২ এর প্রকারভেদগুলোর মধ্যে রয়েছে:
৪.২.১ সেশন কুকিজ
৪.২.২ প্রেফারেন্স কুকিজ
৪.২.৩ সিকিউরিটি কুকিজ
৪.৩ ব্যবহারকারীরা কুকিজ বন্ধ করে দিতে পারেন, তবে সেক্ষেত্রে কিছু ফিচার সঠিকভাবে কাজ নাও করতে পারে।

৫. তথ্য শেয়ার করা
৫.১ আমরা ব্যক্তিগত তথ্য বিক্রি করি না।
৫.২ আমরা তথ্য শেয়ার করতে পারি:
৫.২.১ পরিষেবা প্রদানকারীদের (Service providers) সাথে
৫.২.২ আইনগত প্রয়োজনে আইনি কর্তৃপক্ষের সাথে
৫.২.৩ ব্যবসায়িক কার্যক্রমের প্রয়োজনে অংশীদারদের সাথে

৬. তথ্যের নিরাপত্তা
৬.১ তথ্য সুরক্ষায় আমরা যথাযথ নিরাপত্তা ব্যবস্থা গ্রহণ করি।
৬.২ তবে, কোনো সিস্টেমই সম্পূর্ণ সুরক্ষিত নয়।

৭. তথ্য সংরক্ষণ
৭.১ পরিষেবা, আইনি বা কার্যক্রমের প্রয়োজনীয়তা অনুযায়ী যতক্ষণ প্রয়োজন ঠিক ততক্ষণই তথ্য সংরক্ষণ করা হয়।

৮. ব্যবহারকারীর অধিকার
৮.১ ব্যবহারকারীরা অনুরোধ করতে পারেন:
৮.১.১ তথ্যের অ্যাক্সেস বা দেখার জন্য
৮.১.২ তথ্য সংশোধনের জন্য
৮.১.৩ তথ্য মুছে ফেলার জন্য
৮.১.৪ তথ্য প্রক্রিয়াকরণ সীমিত করার জন্য

৯. বয়স সীমা
৯.১ ব্যবহারকারীর বয়স কমপক্ষে ১৮ বছর হতে হবে অথবা অভিভাবকের তত্ত্বাবধানে প্ল্যাটফর্মটি ব্যবহার করতে হবে।

১০. নীতির পরিবর্তন
১০.১ আমরা যেকোনো সময় এই গোপনীয়তা নীতি আপডেট করতে পারি।
১০.২ প্ল্যাটফর্মটির ক্রমাগত ব্যবহার মানে হলো আপনি এই পরিবর্তনগুলো গ্রহণ করেছেন।

১১. যোগাযোগ
১১.১ ইমেইল: shadamon.com@gmail.com
১১.২ মেসেঞ্জার: m.me/shadamonDotCom
কার্যকর হওয়ার তারিখ: ১ মে ২০২৬`
    }),
    safety: makeInfoItem({
        slug: 'safety-tips',
        titleBn: 'SHADAMON.COM – নিরাপত্তা টিপস',
        titleEn: 'SHADAMON.COM – SAFETY TIPS',
        contentEn: `1. General Safety Guidelines
1.1 Your safety is our top priority at Shadamon.com.
1.2 Always use caution when interacting with other users on the platform.
1.3 Avoid sharing unnecessary personal or financial information with unknown parties.
1.4 Use common sense when evaluating offers that seem unusually cheap or unrealistic.

2. Transaction Safety
2.1 Always meet the seller or buyer in person before making any payment whenever possible.
2.2 Inspect the product carefully before completing any transaction.
2.3 Buyers should not make payment before receiving and verifying the product.
2.4 Sellers should avoid shipping or handing over products before receiving confirmed payment.
2.5 Avoid remote or unsafe locations for meetings. Prefer public and secure places.

3. Job and Recruitment Safety
3.1 Always verify the employer and job offer before sharing any personal information.
3.2 Do not share sensitive documents unless you trust the source.
3.3 Avoid interviews or meetings in unknown or unsafe locations.
3.4 Be cautious of job offers that require upfront payment or promise unrealistic income.

4. Payment and Financial Safety
4.1 Never share bank account details, PINs, OTPs, or sensitive financial information.
4.2 Avoid advance payments without proper verification.
4.3 Shadamon.com does not guarantee or process payments between users.
4.4 Users are fully responsible for verifying payment authenticity.

5. Fraud and Scam Awareness
5.1 Be cautious of fake payment requests or fake payment confirmations.
5.2 Shadamon.com never asks for personal data via email, SMS, or unofficial messages.
5.3 Avoid suspicious links, messages, or requests from unknown users.
5.4 Do not use untrusted money transfer services with unknown individuals.
5.5 Be aware that Shadamon.com does not provide delivery services. Any such claim should be considered suspicious.

6. Platform Safety Measures
6.1 User contact details may be hidden to protect privacy.
6.2 We use technical systems to detect and prevent suspicious activity.
6.3 Repeated offenders or fraudulent users may be restricted or blocked.
6.4 We continuously improve security systems to reduce abuse and fraud.

7. Reporting Safety Issues
7.1 If you suspect fraud or scam activity, report it immediately through the platform.
7.2 In serious cases, users are advised to contact local law enforcement authorities.
7.3 Early reporting helps protect you and other users.

8. Important Disclaimer
8.1 Shadamon.com provides a platform for user interaction only and does not guarantee the safety of any transaction between users.
8.2 Users are solely responsible for verifying all information before engaging in any transaction.
8.3 While we take reasonable steps to improve safety, we are not liable for any loss, fraud, or damages resulting from user interactions.
8.4 In cases of suspected illegal activity, we may cooperate with law enforcement authorities as required by law.`,
        contentBn: `১. সাধারণ নিরাপত্তা নির্দেশিকা
১.১ Shadamon.com-এ আপনার নিরাপত্তাই আমাদের সর্বোচ্চ অগ্রাধিকার।
১.২ প্ল্যাটফর্মে অন্য ব্যবহারকারীদের সাথে যোগাযোগের সময় সর্বদা সতর্ক থাকুন।
১.৩ অপরিচিত ব্যক্তিদের সাথে অপ্রয়োজনীয় ব্যক্তিগত বা আর্থিক তথ্য শেয়ার করা থেকে বিরত থাকুন।
১.৪ অস্বাভাবিক সস্তা বা অবাস্তব মনে হয় এমন অফারগুলো মূল্যায়নের ক্ষেত্রে সাধারণ জ্ঞান বা বুদ্ধি ব্যবহার করুন।

২. লেনদেনের নিরাপত্তা
২.১ সম্ভব হলে যেকোনো পেমেন্ট করার আগে সর্বদা বিক্রেতা বা ক্রেতার সাথে সরাসরি দেখা করুন।
২.২ লেনদেন সম্পন্ন করার আগে পণ্যটি যত্নসহকারে পরীক্ষা করে নিন।
২.৩ ক্রেতাদের উচিত পণ্য গ্রহণ এবং যাচাই করার আগে কোনো পেমেন্ট না করা।
২.৪ বিক্রেতাদের উচিত পেমেন্ট নিশ্চিত করার আগে পণ্য পাঠানো বা হস্তান্তর করা থেকে বিরত থাকা।
২.৫ দেখা করার জন্য দুর্গম বা অনিরাপদ স্থান পরিহার করুন। জনাকীর্ণ এবং নিরাপদ স্থানকে প্রাধান্য দিন।

৩. চাকরি এবং নিয়োগ সংক্রান্ত নিরাপত্তা
৩.১ যেকোনো ব্যক্তিগত তথ্য শেয়ার করার আগে সর্বদা নিয়োগকর্তা এবং চাকরির অফারটি যাচাই করুন।
৩.২ উৎসটি বিশ্বস্ত না হওয়া পর্যন্ত সংবেদনশীল কোনো নথিপত্র শেয়ার করবেন না।
৩.৩ অপরিচিত বা অনিরাপদ স্থানে ইন্টারভিউ বা মিটিং এড়িয়ে চলুন।
৩.৪ যেসব চাকরির অফারে অগ্রিম টাকা চাওয়া হয় বা অবাস্তব আয়ের প্রতিশ্রুতি দেওয়া হয়, সেগুলোর ব্যাপারে সতর্ক থাকুন।

৪. পেমেন্ট এবং আর্থিক নিরাপত্তা
৪.১ কখনো ব্যাংক অ্যাকাউন্টের বিবরণ, পিন (PIN), ওটিপি (OTP) বা সংবেদনশীল আর্থিক তথ্য শেয়ার করবেন না।
৪.২ সঠিক যাচাইকরণ ছাড়া অগ্রিম পেমেন্ট এড়িয়ে চলুন।
৪.৩ Shadamon.com ব্যবহারকারীদের মধ্যে কোনো পেমেন্টের গ্যারান্টি দেয় না বা প্রসেস করে না।
৪.৪ পেমেন্টের সত্যতা যাচাই করার জন্য ব্যবহারকারীরা সম্পূর্ণ দায়ী।

৫. প্রতারণা এবং স্ক্যাম সচেতনতা
৫.১ ভুয়া পেমেন্ট রিকোয়েস্ট বা ভুয়া পেমেন্ট কনফার্মেশনের ব্যাপারে সতর্ক থাকুন।
৫.২ Shadamon.com কখনো ইমেইল, এসএমএস বা অনানুষ্ঠানিক মেসেজের মাধ্যমে ব্যক্তিগত তথ্য চায় না।
৫.৩ অপরিচিত ব্যবহারকারীদের পাঠানো সন্দেহজনক লিঙ্ক, মেসেজ বা অনুরোধ এড়িয়ে চলুন।
৫.৪ অপরিচিত ব্যক্তিদের সাথে লেনদেনের ক্ষেত্রে অবিশ্বস্ত মানি ট্রান্সফার সার্ভিস ব্যবহার করবেন না।
৫.৫ মনে রাখবেন, Shadamon.com কোনো ডেলিভারি সার্ভিস প্রদান করে না। এই ধরনের যেকোনো দাবিকে সন্দেহজনক হিসেবে বিবেচনা করা উচিত।

৬. প্ল্যাটফর্মের নিরাপত্তা ব্যবস্থা
৬.১ গোপনীয়তা রক্ষার জন্য ব্যবহারকারীর যোগাযোগের বিস্তারিত তথ্য লুকানো থাকতে পারে।
৬.২ আমরা সন্দেহজনক কার্যকলাপ শনাক্ত এবং প্রতিরোধের জন্য প্রযুক্তিগত ব্যবস্থা ব্যবহার করি।
৬.৩ বারবার নিয়ম লঙ্ঘনকারী বা প্রতারক ব্যবহারকারীদের সীমাবদ্ধ বা ব্লক করা হতে পারে।
৬.৪ অপব্যবহার এবং প্রতারণা কমাতে আমরা ক্রমাগত নিরাপত্তা ব্যবস্থার উন্নতি করি।

৭. নিরাপত্তা ইস্যু রিপোর্ট করা
৭.১ আপনি যদি কোনো প্রতারণা বা স্ক্যামের সন্দেহ করেন, তবে তাৎক্ষণিকভাবে প্ল্যাটফর্মের মাধ্যমে রিপোর্ট করুন।
৭.২ গুরুতর ক্ষেত্রে ব্যবহারকারীদের স্থানীয় আইন প্রয়োগকারী সংস্থার সাথে যোগাযোগ করার পরামর্শ দেওয়া হচ্ছে।
৭.৩ দ্রুত রিপোর্ট করা আপনাকে এবং অন্যান্য ব্যবহারকারীদের সুরক্ষিত রাখতে সাহায্য করে।

৮. গুরুত্বপূর্ণ সতর্কবার্তা (Disclaimer)
৮.১ Shadamon.com শুধুমাত্র ব্যবহারকারীদের মিথস্ক্রিয়ার জন্য একটি প্ল্যাটফর্ম প্রদান করে এবং ব্যবহারকারীদের মধ্যকার কোনো লেনদেনের নিরাপত্তার গ্যারান্টি দেয় না।
৮.২ যেকোনো লেনদেনে জড়িত হওয়ার আগে সমস্ত তথ্য যাচাই করার জন্য ব্যবহারকারীরা এককভাবে দায়ী।
৮.৩ নিরাপত্তা উন্নত করার জন্য আমরা যথাযথ পদক্ষেপ নিলেও, ব্যবহারকারীদের পারস্পরিক যোগাযোগের ফলে কোনো ক্ষতি, প্রতারণা বা লোকসানের জন্য আমরা দায়ী নই।
৮.৪ সন্দেহজনক অবৈধ কার্যকলাপের ক্ষেত্রে, আমরা আইন অনুযায়ী আইন প্রয়োগকারী সংস্থাকে সহযোগিতা করতে পারি।`
    }),
    contact: makeInfoItem({
        slug: 'contact-us',
        titleBn: 'আমাদের সাথে যোগাযোগ',
        titleEn: 'Contact Us',
        contentEn: `If you have any questions, please first check our Safety Tips section. If you do not find your answer there, feel free to contact us. We will respond as quickly as possible.

Contact Methods:
Message or Chat: m.me/ShadamonDotCom
Call: 01752 84 20 84
Business Hours: Every day from 10:00 AM to 8:00 PM
Address: Rampura, Dhaka, Bangladesh.`,
        contentBn: `আপনার যদি কোনো প্রশ্ন থাকে, তবে অনুগ্রহ করে প্রথমে আমাদের নিরাপত্তা টিপস (Safety Tips) বিভাগটি দেখে নিন। সেখানে আপনার উত্তর না পেলে নির্দ্বিধায় আমাদের সাথে যোগাযোগ করুন। আমরা যত দ্রুত সম্ভব আপনাকে সহায়তা করব।

যোগাযোগের মাধ্যম:
মেসেজ বা চ্যাট: m.me/ShadamonDotCom
কল করুন: ০১৭৫২ ৮৪ ২০ ৮৪
অফিস সময়: প্রতিদিন সকাল ১০:০০ টা থেকে রাত ৮:০০ টা পর্যন্ত
ঠিকানা: রামপুরা, ঢাকা, বাংলাদেশ।`
    }),
    return: makeInfoItem({
        slug: 'return-refund-policy',
        titleBn: 'রিটার্ন & রিফান্ড পলিসি',
        titleEn: 'Return & Refund Policy',
        contentEn: `Shadamon.com aims to ensure that users have a simple, secure, and effective experience. In the case of promotional activities, certain important aspects regarding payments and the nature of promotional results should be considered.

Performance & Nature of Results:
Promotional results are estimate-based. Our automated system will make its best effort to deliver your post to relevant audiences. However, audience reach, interest, or outcomes are not guaranteed at a 100% level. This is a probability-based process that depends on the status of the promotional activity, timing, and audience response.

User Responsibility:
Before promoting, ensure that the information provided in your post is accurate, effective, and up to date. Shadamon.com shall not be responsible for any loss or refund due to incorrect or incomplete information affecting promotional results. If a live promotion is stopped due to incorrect or incomplete information, the payment will not be refundable.

Result Tracking & Transparency:
Once promoted, you can directly see how many viewers or customers have shown interest in your post. This information can help you improve future promotional planning more effectively.

Automated and Simple Usage:
Shadamon.com's promotional system operates automatically. No complex setup or additional feature selection is required. Once the promote button is clicked, the process begins immediately and results are displayed automatically.

Use of Promotional Payment:
Once processing begins, the payment is automatically activated. The amount is processed and moved into the system scheduling workflow, and is used to deliver the post or advertisement to targeted audiences based on different promotional stages. Therefore, once processing has started, the amount is generally non-refundable.

In Summary:
Shadamon.com's promotional system is simple, secure, and effective. Once the payment is processed, it automatically goes into the delivery system, and the system makes its best effort to show the post to maximum relevant visitors, allowing users to see direct results.`,
        contentBn: `Shadamon.com ব্যবহারকারীদের জন্য একটি সহজ, নিরাপদ এবং কার্যকর অভিজ্ঞতা নিশ্চিত করার লক্ষ্য রাখে। প্রমোশনাল বা প্রচারমূলক কার্যক্রমের ক্ষেত্রে, পেমেন্ট এবং ফলাফলের ধরণ সংক্রান্ত কিছু গুরুত্বপূর্ণ বিষয় বিবেচনা করা প্রয়োজন।

ফলাফলের ধরণ ও কার্যকারিতা:
প্রমোশনের ফলাফলগুলো অনুমানের (estimate) ওপর ভিত্তি করে তৈরি করা হয়। আমাদের স্বয়ংক্রিয় সিস্টেম আপনার পোস্টটি প্রাসঙ্গিক দর্শকদের কাছে পৌঁছে দেওয়ার সর্বোচ্চ চেষ্টা করবে। তবে, অডিয়েন্স রিচ (কতজন দেখল), মানুষের আগ্রহ বা নির্দিষ্ট ফলাফলের ১০০% গ্যারান্টি দেওয়া সম্ভব নয়। এটি একটি সম্ভাবনা-ভিত্তিক প্রক্রিয়া যা প্রমোশনের ধরণ, সময় এবং দর্শকদের প্রতিক্রিয়ার ওপর নির্ভর করে।

ব্যবহারকারীর দায়িত্ব:
প্রমোট করার আগে নিশ্চিত করুন যে আপনার পোস্টে দেওয়া তথ্য সঠিক, কার্যকর এবং আপ-টু-ডেট। ভুল বা অসম্পূর্ণ তথ্যের কারণে প্রমোশনের ফলাফল আশানুরূপ না হলে তার জন্য কোনো ক্ষতিপূরণ বা রিফান্ড Shadamon.com প্রদান করবে না। যদি ভুল তথ্যের কারণে কোনো চলমান প্রমোশন বন্ধ করে দেওয়া হয়, তবে সেই পেমেন্ট অফেরতযোগ্য হবে।

ফলাফল ট্র্যাকিং এবং স্বচ্ছতা:
প্রমোট করার পর, কতজন দর্শক বা ক্রেতা আপনার পোস্টে আগ্রহ দেখিয়েছেন তা আপনি সরাসরি দেখতে পাবেন। এই তথ্যগুলো আপনাকে ভবিষ্যতে আরও কার্যকরভাবে প্রমোশন পরিকল্পনা করতে সাহায্য করবে।

স্বয়ংক্রিয় এবং সহজ ব্যবহার:
Shadamon.com-এর প্রমোশন সিস্টেমটি সম্পূর্ণ স্বয়ংক্রিয়ভাবে কাজ করে। এর জন্য কোনো জটিল সেটআপ বা অতিরিক্ত ফিচার নির্বাচনের প্রয়োজন নেই। একবার 'Promote' বাটনে ক্লিক করলে প্রক্রিয়াটি তাৎক্ষণিকভাবে শুরু হয় এবং ফলাফল স্বয়ংক্রিয়ভাবে প্রদর্শিত হয়।

প্রমোশন পেমেন্টের ব্যবহার:
একবার প্রসেসিং শুরু হয়ে গেলে পেমেন্টটি স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যায়। পেমেন্টের অর্থটি সিস্টেমের শিডিউলিং ওয়ার্কফ্লোতে চলে যায় এবং প্রমোশনের বিভিন্ন ধাপ অনুযায়ী টার্গেটেড অডিয়েন্সের কাছে বিজ্ঞাপনটি পৌঁছে দিতে ব্যবহৃত হয়। তাই, প্রসেসিং শুরু হওয়ার পর পেমেন্টকৃত অর্থ সাধারণত অফেরতযোগ্য।

সারসংক্ষেপ:
Shadamon.com-এর প্রমোশন সিস্টেম সহজ, নিরাপদ এবং কার্যকর। পেমেন্ট সম্পন্ন হওয়ার পর এটি স্বয়ংক্রিয়ভাবে ডেলিভারি সিস্টেমে চলে যায় এবং সিস্টেম আপনার পোস্টটি সর্বোচ্চ সংখ্যক প্রাসঙ্গিক ভিজিটরের কাছে পৌঁছে দেওয়ার চেষ্টা করে, যার ফলাফল ব্যবহারকারী সরাসরি দেখতে পান।`
    })
};

export const INFO_PAGE_ROUTES = {
    about: `/info/${INFO_CONTENT.about.slug}`,
    terms: `/info/${INFO_CONTENT.terms.slug}`,
    privacy: `/info/${INFO_CONTENT.privacy.slug}`,
    contact: `/info/${INFO_CONTENT.contact.slug}`,
    safety: `/info/${INFO_CONTENT.safety.slug}`,
    return: `/info/${INFO_CONTENT.return.slug}`
} as const;

const INFO_CONTENT_BY_SLUG = Object.values(INFO_CONTENT).reduce<Record<string, InfoContentItem>>((acc, item) => {
    acc[item.slug] = item;
    return acc;
}, {});

export function getInfoContentBySlug(slug: string): InfoContentItem | null {
    return INFO_CONTENT_BY_SLUG[slug] || null;
}

export function getInfoContentForLanguage(item: InfoContentItem, language: InfoLanguage) {
    if (language === 'en') {
        return {
            title: item.titleEn,
            content: item.contentEn
        };
    }

    return {
        title: item.titleBn,
        content: item.contentBn
    };
}