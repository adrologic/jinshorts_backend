import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import {
  Admin,
  User,
  Category,
  Article,
  Advertisement,
  AdSettings,
  QuestionBank,
  Quiz,
} from './models';
import { hashPassword } from '../utils/hash';

// Helper to get a random integer between min and max (inclusive)
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to get a date spread across the last 30 days
function randomDateInLast30Days(index: number, total: number): Date {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const offset = (index / total) * thirtyDays;
  // Add a small random jitter of up to 12 hours
  const jitter = Math.random() * 12 * 60 * 60 * 1000;
  return new Date(now - offset - jitter);
}

const categoriesData = [
  { slug: 'temple-news', name: 'Temple News', nameHi: 'मंदिर समाचार', icon: '🛕', color: '#FF6B35', sortOrder: 0 },
  { slug: 'festivals', name: 'Festivals & Events', nameHi: 'त्यौहार और कार्यक्रम', icon: '🪔', color: '#F59E0B', sortOrder: 1 },
  { slug: 'spiritual', name: 'Spiritual & Teachings', nameHi: 'आध्यात्मिक शिक्षा', icon: '🙏', color: '#8B5CF6', sortOrder: 2 },
  { slug: 'community', name: 'Community News', nameHi: 'समुदाय समाचार', icon: '👥', color: '#3B82F6', sortOrder: 3 },
  { slug: 'saints', name: 'Saints & Acharyas', nameHi: 'संत एवं आचार्य', icon: '✨', color: '#EC4899', sortOrder: 4 },
  { slug: 'education', name: 'Education', nameHi: 'शिक्षा', icon: '📚', color: '#10B981', sortOrder: 5 },
  { slug: 'health', name: 'Health & Wellness', nameHi: 'स्वास्थ्य', icon: '💚', color: '#14B8A6', sortOrder: 6 },
  { slug: 'business', name: 'Business & Economy', nameHi: 'व्यापार', icon: '💼', color: '#6366F1', sortOrder: 7 },
  { slug: 'youth', name: 'Youth & Initiatives', nameHi: 'युवा पीढ़ी', icon: '🌟', color: '#F97316', sortOrder: 8 },
  { slug: 'national', name: 'National News', nameHi: 'राष्ट्रीय', icon: '🇮🇳', color: '#EF4444', sortOrder: 9 },
  { slug: 'international', name: 'International', nameHi: 'अंतर्राष्ट्रीय', icon: '🌍', color: '#06B6D4', sortOrder: 10 },
  { slug: 'lifestyle', name: 'Jain Lifestyle', nameHi: 'जैन जीवनशैली', icon: '🌿', color: '#84CC16', sortOrder: 11 },
];

const articlesData = [
  // ── temple-news (0): 5 articles ──
  {
    title: 'Grand Inauguration of New Jain Temple in Udaipur Draws Thousands',
    titleHi: 'उदयपुर में नवीन जैन मंदिर का भव्य उद्घाटन, हजारों की भीड़',
    summary: 'A magnificent new Jain temple was inaugurated in Udaipur last weekend, attracting over ten thousand devotees from across Rajasthan and neighboring states. The white marble structure features intricate carvings depicting the lives of all twenty-four Tirthankaras. Senior Acharyas performed the elaborate Pratishtha ceremony spanning three days. Community leaders praised the architectural brilliance and spiritual significance of this landmark addition to the city.',
    summaryHi: 'उदयपुर में एक भव्य नए जैन मंदिर का उद्घाटन हुआ, जिसमें दस हजार से अधिक श्रद्धालु शामिल हुए।',
    fullContent: 'The city of Udaipur witnessed a historic moment as a grand new Jain temple was inaugurated in the heart of the old city. The temple, built entirely from white Makrana marble, features stunning carvings that depict the lives and teachings of all twenty-four Tirthankaras. The project, which took over seven years to complete, was funded by donations from the local Jain community.\n\nThe three-day Pratishtha ceremony was led by senior Acharyas who traveled from across India to bless the occasion. Devotees participated in elaborate rituals, bhajans, and a grand Shobha Yatra procession through the streets. The temple complex also includes a meditation hall, a library of Jain scriptures, and a community kitchen serving satvik meals.\n\nLocal leaders and government officials attended the event, praising the temple as a symbol of cultural heritage and communal harmony. The temple trust announced plans to offer free meditation workshops and spiritual education programs for the youth throughout the year.',
    categoryIndex: 0,
    authorName: 'Rajesh Jain',
    sourceName: 'JinShorts Correspondent',
    tags: ['temple', 'udaipur', 'inauguration'],
  },
  {
    title: 'Palitana Temple Complex Completes Major Restoration of Ancient Shrines',
    titleHi: 'पालीताना मंदिर परिसर में प्राचीन मंदिरों का प्रमुख जीर्णोद्धार पूरा',
    summary: 'The Palitana temple complex on Shatrunjaya hill has completed a five-year restoration project covering fourteen ancient shrines dating back to the eleventh century. Expert artisans carefully preserved original stone carvings while reinforcing weakened structures against monsoon damage. The Archaeological Survey collaborated with Jain trusts to ensure historical authenticity throughout the painstaking restoration work. Pilgrims can now safely access all restored areas.',
    summaryHi: 'पालीताना के शत्रुंजय पहाड़ी पर स्थित मंदिर परिसर में चौदह प्राचीन मंदिरों का पांच वर्षीय जीर्णोद्धार पूरा हुआ।',
    fullContent: 'The sacred Shatrunjaya hill in Palitana, home to one of the most important Jain pilgrimage sites in the world, has completed a massive restoration initiative. The project focused on fourteen shrines that had suffered significant structural damage over the centuries due to monsoon rains and natural wear.\n\nSkilled artisans from Rajasthan and Gujarat worked meticulously to restore the original carvings without altering their historical character. Modern engineering techniques were employed to strengthen foundations while maintaining the aesthetic integrity of these centuries-old structures.\n\nThe restoration was a collaborative effort between the Anandji Kalyanji Trust and the Archaeological Survey of India. Temple authorities have also improved the climbing pathway with better railings and rest stops for elderly pilgrims. The restored shrines are now fully accessible and have already seen a surge in visitor numbers.',
    categoryIndex: 0,
    authorName: 'Meera Shah',
    sourceName: 'Gujarat Samachar',
    tags: ['palitana', 'restoration', 'heritage'],
  },
  {
    title: 'New Jain Temple in Bangalore Embraces Eco-Friendly Green Architecture',
    titleHi: 'बेंगलुरु में नए जैन मंदिर में पर्यावरण अनुकूल हरित वास्तुकला अपनाई गई',
    summary: 'A newly constructed Jain temple in Bangalore has become the first Jain religious structure to receive a green building certification from the Indian Green Building Council. The temple uses solar panels for all electricity needs, rainwater harvesting systems, and natural ventilation designs inspired by ancient architectural principles. Community members celebrated the inauguration with a plantation drive and pledged ongoing environmental stewardship.',
    summaryHi: 'बेंगलुरु में नवनिर्मित जैन मंदिर को भारतीय हरित भवन परिषद से ग्रीन बिल्डिंग प्रमाणन प्राप्त हुआ।',
    fullContent: 'In a first for Jain religious architecture, a newly built temple in Bangalore has earned the prestigious green building certification from the Indian Green Building Council. The temple integrates solar panels that generate enough electricity to power all its operations, eliminating dependence on the city grid entirely.\n\nRainwater harvesting tanks beneath the temple complex collect monsoon water that is used for the temple garden and cleaning. The building design incorporates natural ventilation corridors inspired by Rajasthani havelis, reducing the need for air conditioning even during Bangalore\'s warmest months.\n\nThe inauguration ceremony included a tree plantation drive where over five hundred saplings were planted in the surrounding area. The temple trust has committed to maintaining a zero-waste campus and encourages devotees to bring their own water bottles and avoid single-use plastics during visits.',
    categoryIndex: 0,
    authorName: 'Ankit Mehta',
    sourceName: 'Deccan Herald',
    tags: ['bangalore', 'green-temple', 'eco-friendly'],
  },
  {
    title: 'Historic Ranakpur Temple Introduces Digital Audio Guide for Visitors',
    titleHi: 'ऐतिहासिक रणकपुर मंदिर में आगंतुकों के लिए डिजिटल ऑडियो गाइड शुरू',
    summary: 'The famous Ranakpur Jain temple in Rajasthan has launched a multilingual digital audio guide system to enhance visitor experience and educate tourists about Jain philosophy and temple architecture. Available in eight languages including Hindi, English, and Gujarati, the guide explains the significance of the fourteen hundred intricately carved pillars. Temple authorities partnered with a technology startup to develop this accessible and informative self-guided tour solution.',
    summaryHi: 'राजस्थान के प्रसिद्ध रणकपुर जैन मंदिर ने आगंतुकों के अनुभव को बेहतर बनाने के लिए बहुभाषी डिजिटल ऑडियो गाइड शुरू किया।',
    fullContent: 'The iconic Ranakpur Jain temple, renowned for its extraordinary marble architecture and 1,444 uniquely carved pillars, has embraced technology to improve the pilgrim and tourist experience. The new digital audio guide system is accessible through a simple QR code scan at the temple entrance.\n\nThe guide is available in eight languages and provides detailed explanations of the temple\'s history, architectural marvels, and the Jain philosophical principles embedded in its design. Each section of the temple has dedicated audio content that visitors can listen to at their own pace.\n\nDeveloped in partnership with a Jaipur-based technology startup, the system also includes accessibility features for visually impaired visitors. Temple authorities hope the guide will help international tourists gain a deeper appreciation of Jain heritage and encourage respectful engagement with this sacred space.',
    categoryIndex: 0,
    authorName: 'Priya Sanghvi',
    sourceName: 'Rajasthan Patrika',
    tags: ['ranakpur', 'digital', 'heritage'],
  },
  {
    title: 'Mumbai Jain Community Raises Funds for Temple Complex in Suburban Area',
    titleHi: 'मुंबई जैन समुदाय ने उपनगरीय क्षेत्र में मंदिर परिसर के लिए धन एकत्र किया',
    summary: 'The Jain community in Mumbai has successfully raised over fifty crore rupees for a new temple complex planned in the western suburbs of Borivali. The project will include a main temple hall, a meditation center, a Pathshala for children, and a community gathering space. Fundraising events featured cultural performances and donations from prominent business families. Construction is expected to begin next quarter and finish within three years.',
    summaryHi: 'मुंबई के जैन समुदाय ने बोरीवली में नए मंदिर परिसर के लिए पचास करोड़ रुपये से अधिक एकत्र किए।',
    fullContent: 'The vibrant Jain community in Mumbai has rallied together to raise an impressive fifty crore rupees for a comprehensive temple complex in Borivali. The fundraising campaign, which ran for six months, included gala dinners, cultural performances, and personal pledges from some of the city\'s most prominent Jain business families.\n\nThe planned complex will feature a grand temple hall with capacity for two thousand devotees, a meditation center designed for silent retreats, a Pathshala offering religious education to children on weekends, and a modern community hall for weddings and cultural events.\n\nArchitectural plans blend traditional Jain temple aesthetics with modern amenities including parking, elevators for elderly visitors, and fully accessible facilities. The trust overseeing the project expects construction to commence in the next quarter, with a projected completion timeline of three years.',
    categoryIndex: 0,
    authorName: 'Sunil Kothari',
    sourceName: 'Mumbai Mirror',
    tags: ['mumbai', 'fundraising', 'temple'],
  },

  // ── festivals (1): 4 articles ──
  {
    title: 'Paryushana Parva Celebrations Begin Across India with Great Fervor',
    titleHi: 'पर्युषण पर्व का उत्सव पूरे भारत में बड़े उत्साह के साथ शुरू',
    summary: 'The sacred Paryushana Parva festival has commenced across India with millions of Jains observing fasting, meditation, and spiritual discourses. Major cities including Mumbai, Ahmedabad, and Delhi are hosting elaborate community gatherings featuring pravachans by renowned monks. Devotees are participating in Pratikramana rituals seeking forgiveness and inner purification. Temples nationwide report a significant increase in attendance as families come together to observe this most important annual festival.',
    summaryHi: 'पवित्र पर्युषण पर्व पूरे भारत में शुरू हो गया है, लाखों जैन उपवास और ध्यान में लगे हैं।',
    fullContent: 'The most important festival in the Jain calendar, Paryushana Parva, has begun with great devotion and enthusiasm across India. For the next eight days (Shvetambara) and ten days (Digambara), Jain communities will observe strict fasting, engage in deep meditation, and attend spiritual discourses.\n\nIn Mumbai, the grand Paryushana celebration at the Godiji Jain Temple drew over five thousand devotees on the opening day. Ahmedabad\'s Jain societies have organized round-the-clock pravachans by some of the most respected monks and nuns in the community. Delhi\'s Jain community has set up large pandals in several neighborhoods to accommodate the surge in attendees.\n\nThe festival emphasizes self-discipline, forgiveness, and compassion. On the final day, known as Samvatsari, Jains will seek forgiveness from all living beings by sending the message "Michhami Dukkadam." Community kitchens across the country are preparing satvik meals for those breaking their fasts.',
    categoryIndex: 1,
    authorName: 'Kavita Jain',
    sourceName: 'Navbharat Times',
    tags: ['paryushana', 'festival', 'fasting'],
  },
  {
    title: 'Mahavir Jayanti Celebrations Feature Grand Processions Nationwide',
    titleHi: 'महावीर जयंती पर देशभर में भव्य शोभा यात्राओं का आयोजन',
    summary: 'Mahavir Jayanti was celebrated with immense devotثion and grandeur across India as communities organized elaborate Shobha Yatra processions through major cities. Decorated chariots carrying idols of Lord Mahavira were paraded through streets accompanied by traditional music and dance performances. Community leaders delivered speeches highlighting the timeless relevance of Mahavira\'s teachings on ahimsa and truth. Free medical camps and food distribution drives were organized as part of the celebrations.',
    summaryHi: 'महावीर जयंती पूरे भारत में अत्यंत भक्ति और भव्यता के साथ मनाई गई।',
    fullContent: 'Mahavir Jayanti, celebrating the birth of Lord Mahavira, the twenty-fourth and last Tirthankara, was observed with great pomp and reverence across India. In Ahmedabad, a massive Shobha Yatra procession stretched over three kilometers, featuring beautifully decorated chariots and thousands of devotees dressed in traditional white attire.\n\nMumbai\'s Jain community organized a grand procession through South Mumbai, passing through historic Jain neighborhoods. The procession included traditional Rajasthani folk musicians, classical dance performances depicting scenes from Mahavira\'s life, and groups of children singing devotional songs.\n\nAs part of the celebrations, numerous community organizations set up free medical camps, eye check-up facilities, and food distribution centers for the underprivileged. Leaders from various Jain sects came together to deliver a unified message of peace, non-violence, and compassion, emphasizing that Mahavira\'s teachings remain profoundly relevant in today\'s world.',
    categoryIndex: 1,
    authorName: 'Deepak Lodha',
    sourceName: 'Dainik Bhaskar',
    tags: ['mahavir-jayanti', 'procession', 'celebration'],
  },
  {
    title: 'Diwali Celebrations in Jain Community Honor Lord Mahavira\'s Nirvana',
    titleHi: 'जैन समुदाय में दीपावली उत्सव भगवान महावीर के निर्वाण को समर्पित',
    summary: 'Jain communities across the nation celebrated Diwali with special emphasis on commemorating Lord Mahavira\'s attainment of Nirvana at Pavapuri. Temples were illuminated with thousands of traditional oil lamps creating a spectacular visual display throughout the evening. Special prayers and recitations of the Uttaradhyayana Sutra were conducted in major temples. Community gatherings focused on reflecting upon Mahavira\'s final teachings about liberation and the path to spiritual freedom.',
    summaryHi: 'जैन समुदाय ने दीपावली भगवान महावीर के निर्वाण की स्मृति में विशेष रूप से मनाई।',
    fullContent: 'While Diwali is celebrated joyously across India, the Jain community observes this festival with a unique spiritual significance, marking the day Lord Mahavira attained Nirvana at Pavapuri in 527 BCE. This year, temples across the country were adorned with thousands of traditional clay oil lamps, symbolizing the light of knowledge that Mahavira brought to the world.\n\nIn Pavapuri, Bihar, the historic Jal Mandir temple witnessed an extraordinary gathering of devotees who traveled from across the globe to pay their respects at the very site of Mahavira\'s liberation. Special midnight prayers and recitations of the Uttaradhyayana Sutra, believed to contain Mahavira\'s final discourse, were conducted.\n\nJain families also celebrated the beginning of the new financial year, a tradition linked to the Jain calendar. Community gatherings featured discussions about Mahavira\'s teachings on non-attachment and the path to moksha, blending festive joy with deep spiritual contemplation.',
    categoryIndex: 1,
    authorName: 'Nisha Bafna',
    sourceName: 'JinShorts Correspondent',
    tags: ['diwali', 'nirvana', 'mahavira'],
  },
  {
    title: 'Annual Mahamastakabhisheka Festival Announced for Shravanabelagola',
    titleHi: 'श्रवणबेलगोला में वार्षिक महामस्तकाभिषेक उत्सव की घोषणा',
    summary: 'Authorities have announced the dates for the next grand Mahamastakabhisheka ceremony at Shravanabelagola, the iconic site housing the monolithic statue of Lord Bahubali in Karnataka. Preparations are underway for the elaborate ritual that involves anointing the fifty-seven-foot statue with milk, saffron, and sandalwood paste. Thousands of volunteers have registered to assist with the massive logistical arrangements required for accommodating the expected two million visiting pilgrims.',
    summaryHi: 'कर्नाटक के श्रवणबेलगोला में अगले भव्य महामस्तकाभिषेक समारोह की तिथियां घोषित की गई हैं।',
    fullContent: 'The Karnataka state government and the Shravanabelagola temple trust have jointly announced the dates for the next Mahamastakabhisheka, one of the most spectacular religious ceremonies in the Jain tradition. The festival, held once every twelve years, centers on the ritual anointing of the magnificent fifty-seven-foot monolithic statue of Lord Bahubali.\n\nPreparations have already begun on a massive scale. The ritual involves pouring thousands of liters of milk, saffron water, sandalwood paste, and other sacred substances over the statue from specially constructed scaffolding. The ceremony attracts Jains from every corner of the world and is considered one of the most sacred experiences in the Digambara tradition.\n\nLogistical arrangements include temporary accommodations for over two million expected visitors, medical facilities, traffic management plans, and a dedicated team of volunteers numbering in the thousands. The government has allocated special funds for infrastructure improvements around the site to ensure a smooth and safe experience for all attendees.',
    categoryIndex: 1,
    authorName: 'Vikram Shetty',
    sourceName: 'Karnataka Times',
    tags: ['mahamastakabhisheka', 'shravanabelagola', 'bahubali'],
  },

  // ── spiritual (2): 4 articles ──
  {
    title: 'Acharya Vidyasagar\'s Discourse Series on Tattvartha Sutra Draws Massive Crowds',
    titleHi: 'आचार्य विद्यासागर की तत्त्वार्थ सूत्र पर प्रवचन श्रृंखला में भारी भीड़',
    summary: 'Acharya Vidyasagar\'s ongoing discourse series on the Tattvartha Sutra has attracted unprecedented attendance in Indore with over fifteen thousand devotees gathering daily to hear the revered monk explain the foundational text of Jain philosophy. The month-long series covers all ten chapters of the Sutra including discussions on the nature of the soul, karma theory, and liberation. Live streaming has enabled millions worldwide to participate in these profound spiritual teachings.',
    summaryHi: 'आचार्य विद्यासागर की तत्त्वार्थ सूत्र पर प्रवचन श्रृंखला ने इंदौर में अभूतपूर्व उपस्थिति आकर्षित की।',
    fullContent: 'The city of Indore has become a spiritual epicenter as Acharya Vidyasagar, one of the most revered Digambara monks of our time, delivers a comprehensive month-long discourse series on the Tattvartha Sutra. Written by Acharya Umaswati, this text is considered the most authoritative and comprehensive summary of Jain philosophy.\n\nOver fifteen thousand devotees gather daily at the specially constructed pandal to hear the Acharya explain complex philosophical concepts in accessible language. The series methodically covers all ten chapters, from the nature of reality and the soul to the mechanics of karma and the path to liberation.\n\nRecognizing the global interest, organizers have set up professional live streaming in multiple languages, enabling Jains worldwide to participate. The recordings are also being archived and will be made available as a free educational resource. Scholars from various universities have attended sessions, praising the Acharya\'s ability to make ancient wisdom relevant to contemporary life.',
    categoryIndex: 2,
    authorName: 'Mahesh Jain',
    sourceName: 'Indore Samachar',
    tags: ['acharya-vidyasagar', 'tattvartha-sutra', 'discourse'],
  },
  {
    title: 'Ancient Jain Meditation Techniques Gain Popularity in Modern Wellness Centers',
    titleHi: 'प्राचीन जैन ध्यान तकनीकें आधुनिक वेलनेस केंद्रों में लोकप्रिय',
    summary: 'Preksha meditation and Kayotsarga, ancient Jain contemplative practices, are experiencing a remarkable resurgence as modern wellness centers across India and abroad incorporate them into their programs. Research studies from multiple universities have documented measurable benefits including reduced stress, improved focus, and enhanced emotional regulation among regular practitioners. Jain scholars are collaborating with wellness experts to develop standardized training programs that maintain authenticity while ensuring accessibility for beginners.',
    summaryHi: 'प्रेक्षा ध्यान और कायोत्सर्ग जैसी प्राचीन जैन ध्यान पद्धतियां आधुनिक वेलनेस केंद्रों में लोकप्रिय हो रही हैं।',
    fullContent: 'Ancient Jain meditation techniques, particularly Preksha meditation developed by Acharya Mahapragya and the practice of Kayotsarga (complete body relaxation), are finding new audiences in modern wellness and mindfulness centers. What was once practiced primarily within Jain communities is now being embraced by people of all backgrounds seeking deeper spiritual experiences.\n\nSeveral universities including IIT Delhi and AIIMS have conducted studies on the physiological and psychological benefits of these practices. Results consistently show significant reductions in cortisol levels, improved concentration, and better emotional resilience among regular practitioners. These scientific validations have contributed to the growing mainstream acceptance.\n\nJain scholars and meditation masters are now working with wellness professionals to create standardized curricula that preserve the spiritual depth of these practices while making them accessible to newcomers. Several mobile apps offering guided Jain meditation sessions have seen downloads surge past the one million mark this year.',
    categoryIndex: 2,
    authorName: 'Dr. Samani Pratibha',
    sourceName: 'Wellness India',
    tags: ['meditation', 'preksha', 'wellness'],
  },
  {
    title: 'International Conference on Jain Philosophy Explores Relevance of Anekantavada',
    titleHi: 'जैन दर्शन पर अंतर्राष्ट्रीय सम्मेलन में अनेकांतवाद की प्रासंगिकता पर चर्चा',
    summary: 'A three-day international conference on Jain philosophy held in New Delhi brought together over two hundred scholars from fifteen countries to discuss the modern relevance of Anekantavada, the Jain doctrine of many-sidedness. Presenters demonstrated how this ancient principle of considering multiple perspectives offers practical solutions for contemporary conflicts and polarized debates. The conference concluded with a published declaration calling for educational institutions worldwide to integrate Anekantavada into conflict resolution programs.',
    summaryHi: 'नई दिल्ली में जैन दर्शन पर तीन दिवसीय अंतर्राष्ट्रीय सम्मेलन में अनेकांतवाद पर चर्चा हुई।',
    fullContent: 'New Delhi hosted a landmark three-day international conference dedicated to exploring the contemporary applications of Jain philosophical principles. The event, organized jointly by the University of Delhi and the International School for Jain Studies, attracted over two hundred scholars, philosophers, and thought leaders from fifteen countries.\n\nThe central theme was Anekantavada, the Jain doctrine that truth and reality are perceived differently from diverse points of view and that no single perspective captures the complete truth. Presenters from Harvard, Oxford, and JNU demonstrated how this principle can be applied to modern challenges including political polarization, interfaith dialogue, and international diplomacy.\n\nThe conference produced a formal declaration calling on educational institutions worldwide to incorporate Anekantavada into their conflict resolution and critical thinking curricula. Several universities announced new research partnerships to study the practical applications of Jain philosophical concepts in fields ranging from environmental ethics to artificial intelligence governance.',
    categoryIndex: 2,
    authorName: 'Prof. Shugan Jain',
    sourceName: 'Academic India',
    tags: ['anekantavada', 'philosophy', 'conference'],
  },
  {
    title: 'Spiritual Retreat at Mount Abu Jain Center Sees Record Enrollment',
    titleHi: 'माउंट आबू जैन केंद्र में आध्यात्मिक शिविर में रिकॉर्ड नामांकन',
    summary: 'The annual spiritual retreat at the renowned Jain meditation center in Mount Abu has witnessed record enrollment this year with over eight hundred participants registering from twelve different countries. The ten-day intensive program includes silent meditation sessions, scriptural studies of the Samayasara text, and guided contemplation on the nature of the soul. Organizers attribute the surge in interest to growing global awareness of Jain spiritual practices and their practical benefits for mental wellbeing.',
    summaryHi: 'माउंट आबू के प्रसिद्ध जैन ध्यान केंद्र में वार्षिक आध्यात्मिक शिविर में रिकॉर्ड नामांकन हुआ।',
    fullContent: 'The serene Jain meditation center nestled in the Aravalli hills of Mount Abu has seen a remarkable surge in interest for its annual spiritual retreat. This year, over eight hundred participants from twelve countries enrolled in the ten-day intensive program, surpassing all previous records.\n\nThe retreat features a rigorous schedule beginning at 4 AM with silent meditation, followed by scholarly discussions on the Samayasara, one of the most profound texts in Jain mystic literature authored by Acharya Kundakunda. Afternoons are dedicated to Kayotsarga practice and guided contemplation on the nature of the soul and its liberation.\n\nOrganizers note that a significant portion of new participants come from non-Jain backgrounds, drawn by the universal appeal of the teachings. The center has expanded its facilities to accommodate the growing demand and plans to offer quarterly weekend retreats in addition to the flagship annual program.',
    categoryIndex: 2,
    authorName: 'Sadhvi Prabhavati',
    sourceName: 'Mount Abu Times',
    tags: ['retreat', 'mount-abu', 'meditation'],
  },

  // ── community (3): 4 articles ──
  {
    title: 'Jain Community Launches Massive Blood Donation Drive Across Fifty Cities',
    titleHi: 'जैन समुदाय ने पचास शहरों में विशाल रक्तदान अभियान शुरू किया',
    summary: 'Jain organizations across India have launched a coordinated blood donation drive spanning fifty cities simultaneously, aiming to collect over twenty-five thousand units of blood in a single week. The initiative organized under the banner of Ahimsa Seva demonstrates the community\'s commitment to humanitarian service. Young volunteers mobilized through social media campaigns and college outreach programs form the backbone of this unprecedented effort. Several hospitals have expressed gratitude for addressing critical blood shortages.',
    summaryHi: 'जैन संगठनों ने पचास शहरों में एक साथ समन्वित रक्तदान अभियान शुरू किया है।',
    fullContent: 'In what is being called the largest organized blood donation drive by any single community in India, Jain organizations have launched a massive week-long campaign spanning fifty cities. The initiative, branded as Ahimsa Seva, aims to collect over twenty-five thousand units of blood to address the chronic shortages faced by hospitals across the country.\n\nThe campaign was conceived by a group of young Jain professionals who leveraged social media to mobilize volunteers. College-level Jain associations played a crucial role in spreading awareness and recruiting first-time donors. Each participating city has designated collection centers equipped with modern blood banking facilities.\n\nSeveral leading hospital chains have expressed deep gratitude for the initiative, noting that blood shortages are a persistent challenge, especially during summer months. The organizers plan to make this an annual event and are already working on a mobile app that will allow community members to receive alerts when their blood type is urgently needed in nearby hospitals.',
    categoryIndex: 3,
    authorName: 'Amit Singhvi',
    sourceName: 'JinShorts Correspondent',
    tags: ['blood-donation', 'community-service', 'ahimsa'],
  },
  {
    title: 'Annual Jain Social Group Convention Addresses Community Unity and Growth',
    titleHi: 'वार्षिक जैन सामाजिक समूह सम्मेलन में सामुदायिक एकता और विकास पर चर्चा',
    summary: 'The annual convention of the All India Jain Social Group Federation concluded in Jaipur with representatives from over three hundred local chapters discussing strategies for community unity and progressive growth. Key resolutions included establishing a nationwide mentorship network for Jain entrepreneurs, creating scholarship funds for underprivileged students, and launching digital platforms to connect diaspora communities. The three-day event featured panel discussions with industry leaders, social workers, and religious figures.',
    summaryHi: 'अखिल भारतीय जैन सामाजिक समूह महासंघ का वार्षिक सम्मेलन जयपुर में संपन्न हुआ।',
    fullContent: 'Jaipur hosted the annual convention of the All India Jain Social Group Federation, bringing together representatives from over three hundred local chapters across the country. The three-day event focused on strategies for strengthening community bonds while adapting to the challenges and opportunities of the modern era.\n\nKey resolutions passed at the convention include the establishment of a nationwide mentorship network pairing experienced Jain entrepreneurs with aspiring business owners, the creation of a centralized scholarship fund targeting underprivileged Jain students, and the development of digital platforms to keep diaspora communities connected with their roots.\n\nThe convention featured inspiring panel discussions with successful industry leaders, dedicated social workers, and revered religious figures. A special session on women\'s empowerment within the community drew enthusiastic participation and resulted in concrete action plans for supporting women entrepreneurs and leaders.',
    categoryIndex: 3,
    authorName: 'Ruchi Doshi',
    sourceName: 'Jaipur Herald',
    tags: ['convention', 'community', 'unity'],
  },
  {
    title: 'Jain Charitable Trust Opens Free Hospital Wing for Underserved Communities',
    titleHi: 'जैन चैरिटेबल ट्रस्ट ने वंचित समुदायों के लिए मुफ्त अस्पताल विंग खोला',
    summary: 'A prominent Jain charitable trust in Ahmedabad has inaugurated a new fifty-bed hospital wing dedicated to providing completely free medical care to underserved communities regardless of their religious background. The facility includes modern diagnostic equipment, an operation theater, and a fully staffed pharmacy offering complimentary medicines to all patients. The trust plans to serve approximately ten thousand patients annually and has recruited twenty specialist doctors who will volunteer their time on rotating schedules.',
    summaryHi: 'अहमदाबाद में एक प्रमुख जैन चैरिटेबल ट्रस्ट ने वंचित समुदायों के लिए मुफ्त अस्पताल विंग का उद्घाटन किया।',
    fullContent: 'The Shri Jain Charitable Trust in Ahmedabad has opened a state-of-the-art fifty-bed hospital wing that will provide completely free medical care to underserved communities. The facility, built at a cost of thirty crore rupees, was inaugurated by the Governor of Gujarat and senior Jain community leaders.\n\nThe new wing is equipped with modern diagnostic equipment including a CT scanner, digital X-ray machines, and a fully functional pathology laboratory. An operation theater capable of handling major surgeries and a pharmacy stocked with essential medicines complete the comprehensive healthcare setup. All services, including surgeries and medications, are provided at absolutely no cost to patients.\n\nThe trust has recruited twenty specialist doctors who will volunteer their expertise on rotating schedules, ensuring that patients have access to quality healthcare around the clock. The initiative embodies the Jain principle of compassion towards all living beings and is expected to serve approximately ten thousand patients annually from the surrounding areas.',
    categoryIndex: 3,
    authorName: 'Dr. Hemant Gandhi',
    sourceName: 'Ahmedabad Express',
    tags: ['charity', 'hospital', 'healthcare'],
  },
  {
    title: 'Jain Diaspora in North America Establishes Cultural Heritage Foundation',
    titleHi: 'उत्तरी अमेरिका में जैन प्रवासी समुदाय ने सांस्कृतिक विरासत फाउंडेशन स्थापित किया',
    summary: 'The Jain community in North America has established a new cultural heritage foundation dedicated to preserving and promoting Jain traditions among younger generations growing up abroad. The foundation will fund cultural exchange programs, sponsor academic research on Jain studies at leading universities, and create digital archives of rare manuscripts and artifacts. Initial funding of five million dollars has been secured from community donations with pledges for ongoing annual contributions from prominent families.',
    summaryHi: 'उत्तरी अमेरिका में जैन समुदाय ने युवा पीढ़ियों के लिए सांस्कृतिक विरासत फाउंडेशन की स्थापना की।',
    fullContent: 'Jain communities across the United States and Canada have come together to establish the Jain Cultural Heritage Foundation, a new organization dedicated to ensuring that younger generations maintain a strong connection to their spiritual and cultural roots. The foundation was formally launched at a gala event in New York City attended by over a thousand community members.\n\nThe foundation\'s initiatives include funding cultural exchange programs that bring young diaspora Jains to India for immersive experiences at major pilgrimage sites, sponsoring chairs in Jain studies at universities including Columbia and the University of Toronto, and creating comprehensive digital archives of rare Jain manuscripts currently housed in various Indian libraries.\n\nInitial funding of five million dollars was raised at the launch event itself, with several prominent families pledging ongoing annual contributions. The foundation has also partnered with existing organizations like JAINA (Federation of Jain Associations in North America) to maximize its impact and avoid duplication of efforts.',
    categoryIndex: 3,
    authorName: 'Nitin Jain',
    sourceName: 'India Abroad',
    tags: ['diaspora', 'heritage', 'north-america'],
  },

  // ── saints (4): 4 articles ──
  {
    title: 'Revered Acharya Shri 108 Mahashraman Ji Completes Historic Padayatra',
    titleHi: 'पूज्य आचार्य श्री 108 महाश्रमण जी ने ऐतिहासिक पदयात्रा पूर्ण की',
    summary: 'Acharya Shri Mahashraman Ji, the spiritual head of the Jain Shvetambara Terapanth order, has completed a historic thousand-kilometer padayatra walking pilgrimage spanning four months across Rajasthan and Gujarat. Thousands of devotees joined various segments of the journey receiving spiritual blessings and guidance along the route. The Acharya delivered daily discourses emphasizing the principles of non-violence, self-restraint, and environmental consciousness to diverse audiences at each stopover throughout the remarkable journey.',
    summaryHi: 'आचार्य श्री महाश्रमण जी ने राजस्थान और गुजरात में एक हजार किलोमीटर की ऐतिहासिक पदयात्रा पूर्ण की।',
    fullContent: 'In a remarkable display of spiritual dedication, Acharya Shri Mahashraman Ji, the revered head of the Jain Shvetambara Terapanth order, has completed a thousand-kilometer padayatra that took him through the heartlands of Rajasthan and Gujarat over four months. Traveling entirely on foot as per the strict Jain monastic tradition, the Acharya visited over sixty towns and villages along the route.\n\nAt each stop, thousands gathered to receive darshan and attend the Acharya\'s discourses. His talks focused on the timeless Jain principles of ahimsa, aparigraha (non-possessiveness), and the urgent need for environmental consciousness. The padayatra also served as an opportunity to strengthen the bonds between scattered Terapanth communities.\n\nThe completion of the padayatra was marked by a grand ceremony in Ahmedabad attended by over twenty thousand devotees. Community leaders honored the Acharya and announced several charitable initiatives inspired by the themes of his journey, including a tree plantation campaign and a fund for rural education.',
    categoryIndex: 4,
    authorName: 'Lalit Bhandari',
    sourceName: 'Terapanth Times',
    tags: ['acharya-mahashraman', 'padayatra', 'terapanth'],
  },
  {
    title: 'Sadhvi Shri Chandanaji Inspires Thousands with Discourse on Women Empowerment',
    titleHi: 'साध्वी श्री चंदनाजी ने महिला सशक्तिकरण पर प्रवचन से हजारों को प्रेरित किया',
    summary: 'Sadhvi Shri Chandanaji, one of the most respected women saints in the Jain community, delivered a powerful discourse series in Patna focusing on women\'s empowerment through spiritual strength and education. Her talks drew over eight thousand attendees daily and emphasized how the Jain tradition has historically honored women\'s spiritual capabilities. She called upon families to invest equally in daughters\' education and encourage women to take leadership roles within community organizations and religious institutions.',
    summaryHi: 'साध्वी श्री चंदनाजी ने पटना में महिला सशक्तिकरण पर शक्तिशाली प्रवचन श्रृंखला दी।',
    fullContent: 'Patna witnessed extraordinary gatherings as Sadhvi Shri Chandanaji, the pioneering woman saint known for founding the Veerayatan organization, delivered a week-long discourse series on the theme of women\'s empowerment through spiritual growth and education. Each session attracted over eight thousand attendees, including many young women who found particular inspiration in her message.\n\nSadhvi Chandanaji drew upon rich Jain historical traditions to highlight the significant role women have always played in the faith. She referenced the story of Chandanbala, the first female disciple of Lord Mahavira, and numerous other women who achieved high spiritual attainment. Her message was clear: true empowerment comes from inner spiritual strength combined with modern education.\n\nHer call to action resonated deeply, with several prominent families publicly pledging to invest equally in their daughters\' education. Several Jain organizations announced new scholarship programs specifically for women pursuing higher education and professional careers, inspired by the discourse series.',
    categoryIndex: 4,
    authorName: 'Sarita Jain',
    sourceName: 'Bihar Times',
    tags: ['sadhvi-chandanaji', 'women-empowerment', 'discourse'],
  },
  {
    title: 'Young Monk Receives Prestigious Acharya Title in Grand Ceremony',
    titleHi: 'युवा मुनि को भव्य समारोह में प्रतिष्ठित आचार्य पद प्रदान',
    summary: 'A young Digambara monk aged thirty-five has been elevated to the prestigious rank of Acharya in an elaborate consecration ceremony held in Hastinapur attended by over fifty thousand devotees. The new Acharya, known for his deep scriptural knowledge and extraordinary spiritual discipline, received the title after completing fifteen years of rigorous monastic life. The ceremony included traditional rituals, scholarly examinations, and blessings from senior monks who attested to his spiritual readiness for this elevated responsibility.',
    summaryHi: 'पثतीस वर्षीय युवा दिगंबर मुनि को हस्तिनापुर में भव्य समारोह में आचार्य पद प्रदान किया गया।',
    fullContent: 'Hastinapur, one of the most sacred sites in Jain history, witnessed a momentous occasion as a young Digambara monk was elevated to the rank of Acharya, the highest leadership position in the monastic order. The thirty-five-year-old monk, who renounced worldly life at the age of twenty, has been recognized for his exceptional scriptural knowledge and unwavering spiritual discipline.\n\nThe consecration ceremony, known as Acharya Abhishek, spanned three days and followed centuries-old traditions. The candidate underwent rigorous scholarly examinations on all major Jain texts and demonstrated mastery of meditation and ascetic practices. Senior monks in the lineage formally attested to his spiritual readiness before the final consecration.\n\nOver fifty thousand devotees from across India gathered to witness this rare and auspicious event. The new Acharya delivered his first discourse in his elevated role, pledging to dedicate his life to the preservation of Jain teachings and the spiritual upliftment of the community. His appointment is seen as a positive sign for the future of the tradition, bringing youthful energy to the highest monastic office.',
    categoryIndex: 4,
    authorName: 'Vinod Kasliwal',
    sourceName: 'Hastinapur Gazette',
    tags: ['acharya', 'consecration', 'digambara'],
  },
  {
    title: 'Renowned Jain Scholar Muni Shri Pramanasagar Ji Releases New Commentary',
    titleHi: 'प्रसिद्ध जैन विद्वान मुनि श्री प्रमाणसागर जी ने नई टीका जारी की',
    summary: 'Muni Shri Pramanasagar Ji, a renowned Jain scholar and monk, has released a comprehensive new commentary on the ancient Samayasara text making its profound philosophical concepts accessible to modern readers. The commentary bridges classical Prakrit scholarship with contemporary philosophical language and includes detailed annotations explaining the text\'s relevance to current ethical dilemmas. Published simultaneously in Hindi and English, the work has received acclaim from academic scholars and spiritual leaders alike.',
    summaryHi: 'मुनि श्री प्रमाणसागर जी ने समयसार पर एक व्यापक नई टीका जारी की है।',
    fullContent: 'Muni Shri Pramanasagar Ji, widely regarded as one of the foremost living scholars of Jain philosophy, has released a groundbreaking new commentary on the Samayasara, the seminal work by Acharya Kundakunda. The commentary, which took eight years to complete, makes the profoundly deep philosophical concepts of this ancient text accessible to modern readers without diluting their intellectual rigor.\n\nThe work is notable for its unique approach of bridging classical Prakrit scholarship with contemporary philosophical vocabulary. Each verse of the Samayasara is presented with the original Prakrit text, a precise translation, and an extensive commentary that draws parallels with modern philosophical concepts and ethical frameworks.\n\nPublished simultaneously in Hindi and English by a leading academic publisher, the commentary has received enthusiastic reviews from both spiritual leaders and academic philosophers. Several universities have already announced plans to incorporate it into their Jain studies programs. The book launch event in Delhi featured a scholarly discussion with philosophers from multiple traditions, all of whom praised the work as a landmark contribution to Indian philosophy.',
    categoryIndex: 4,
    authorName: 'Prof. Anupam Jain',
    sourceName: 'Dharma Times',
    tags: ['samayasara', 'commentary', 'scholarship'],
  },

  // ── education (5): 4 articles ──
  {
    title: 'Jain University Launches India\'s First Dedicated Ahimsa Studies Program',
    titleHi: 'जैन विश्वविद्यालय ने भारत का पहला समर्पित अहिंसा अध्ययन कार्यक्रम शुरू किया',
    summary: 'A leading Jain university in Bangalore has announced the launch of India\'s first dedicated academic program in Ahimsa Studies offering both undergraduate and postgraduate degrees. The interdisciplinary curriculum covers Jain philosophy, peace studies, environmental ethics, animal rights, and conflict resolution drawing faculty from multiple departments. Initial enrollment has exceeded expectations with students from diverse religious backgrounds applying to explore the academic dimensions of non-violence in contemporary society.',
    summaryHi: 'बेंगलुरु के एक प्रमुख जैन विश्वविद्यालय ने अहिंसा अध्ययन में समर्पित शैक्षणिक कार्यक्रम शुरू किया।',
    fullContent: 'In a pioneering academic initiative, a prominent Jain university in Bangalore has launched India\'s first dedicated program in Ahimsa Studies, offering both BA and MA degrees. The program is designed to provide a rigorous academic framework for studying the principle of non-violence from multiple perspectives including philosophy, political science, environmental studies, and law.\n\nThe interdisciplinary curriculum has been developed with input from leading scholars in Jain studies, peace research, and environmental ethics. Courses include "Foundations of Ahimsa in Indian Philosophy," "Non-Violence in International Relations," "Animal Ethics and Jain Perspectives," and "Environmental Activism and Spiritual Ecology." Students will also undertake field research projects with partner organizations working on peace-building and animal welfare.\n\nThe response has been overwhelming, with the inaugural batch receiving three times more applications than available seats. Notably, students from diverse religious and cultural backgrounds have applied, indicating broad interest in the academic study of non-violence. The university plans to establish an associated research center that will publish a peer-reviewed journal on Ahimsa Studies.',
    categoryIndex: 5,
    authorName: 'Dr. Priyadarshana Jain',
    sourceName: 'Education Times',
    tags: ['ahimsa-studies', 'university', 'education'],
  },
  {
    title: 'National Jain Pathshala Network Reports Record Student Enrollment This Year',
    titleHi: 'राष्ट्रीय जैन पाठशाला नेटवर्क ने इस वर्ष रिकॉर्ड छात्र नामांकन की सूचना दी',
    summary: 'The National Jain Pathshala Network has reported a record enrollment of over seventy-five thousand students across its eight hundred affiliated weekend religious education schools nationwide. The network attributes the surge to a redesigned curriculum incorporating interactive multimedia content, gamified learning modules, and engaging storytelling approaches that make Jain scriptures and philosophy accessible and enjoyable for children. A new mobile application allows parents to track their children\'s spiritual education progress weekly.',
    summaryHi: 'राष्ट्रीय जैन पाठशाला नेटवर्क ने अपनी आठ सौ पाठशालाओं में पचहत्तर हजार छात्रों के रिकॉर्ड नामांकन की रिपोर्ट दी।',
    fullContent: 'The National Jain Pathshala Network, the largest coordinated religious education system within the Jain community, has announced that enrollment has reached an all-time high of seventy-five thousand students across eight hundred affiliated schools operating throughout India. The weekend Pathshala system is the primary vehicle for imparting Jain religious and moral education to children.\n\nThe dramatic increase in enrollment is attributed to a comprehensive overhaul of the curriculum completed last year. The new program replaces traditional rote-learning approaches with interactive multimedia content, gamified quizzes, and engaging storytelling methods. Children learn about Jain Tirthankaras, ethical principles, and philosophical concepts through animated videos, interactive games, and collaborative projects.\n\nA new mobile application launched alongside the curriculum allows parents to track their children\'s progress, review lesson content, and participate in parent-child activities at home. The network has also established a teacher training academy that has certified over two thousand volunteer instructors in the new pedagogical methods.',
    categoryIndex: 5,
    authorName: 'Sunita Luniya',
    sourceName: 'JinShorts Correspondent',
    tags: ['pathshala', 'enrollment', 'education'],
  },
  {
    title: 'Jain Scholarship Fund Awards Grants to Five Hundred Meritorious Students',
    titleHi: 'जैन छात्रवृत्ति कोष ने पांच सौ मेधावी छात्रों को अनुदान प्रदान किया',
    summary: 'The All India Jain Scholarship Fund has awarded educational grants totaling twelve crore rupees to five hundred meritorious students from economically disadvantaged backgrounds pursuing studies in engineering, medicine, law, and liberal arts programs across the country. Recipients were selected through a rigorous evaluation process that considered academic merit, financial need, and community engagement activities. The fund also provides mentorship support connecting scholarship recipients with successful professionals in their respective career fields.',
    summaryHi: 'अखिल भारतीय जैन छात्रवृत्ति कोष ने पांच सौ मेधावी छात्रों को बारह करोड़ रुपये के शैक्षिक अनुदान प्रदान किए।',
    fullContent: 'The All India Jain Scholarship Fund has announced its largest-ever disbursement, awarding twelve crore rupees in educational grants to five hundred students from economically disadvantaged backgrounds. The scholarships cover full tuition and living expenses for students pursuing degrees in engineering, medicine, law, and liberal arts at top institutions across India.\n\nThe selection process was highly competitive, with over ten thousand applications received for this cycle. An evaluation committee comprising academics and industry professionals assessed candidates on academic merit, financial need, leadership potential, and community engagement. Special consideration was given to first-generation college students and those from rural areas.\n\nBeyond financial support, the fund provides a comprehensive mentorship program that connects each scholarship recipient with a successful professional in their chosen field. Monthly check-ins, career guidance sessions, and networking events ensure that students receive holistic support throughout their academic journey. The fund has announced plans to expand its capacity by thirty percent next year through new corporate partnerships.',
    categoryIndex: 5,
    authorName: 'Ashok Patni',
    sourceName: 'Scholarship India',
    tags: ['scholarship', 'education', 'students'],
  },
  {
    title: 'Online Platform for Jain Agama Studies Reaches One Hundred Thousand Users',
    titleHi: 'जैन आगम अध्ययन के लिए ऑनलाइन मंच एक लाख उपयोगकर्ताओं तक पहुंचा',
    summary: 'A free online educational platform dedicated to the study of Jain Agama scriptures has crossed the milestone of one hundred thousand registered users within its first year of operation. The platform offers structured courses covering all forty-five canonical Agama texts with video lectures by eminent scholars, interactive quizzes, and downloadable study materials in multiple languages. University professors and independent learners worldwide have praised the platform for making previously inaccessible ancient Jain scriptural knowledge freely available.',
    summaryHi: 'जैन आगम अध्ययन के लिए समर्पित मुफ्त ऑनलाइन शैक्षिक मंच ने एक लाख पंजीकृत उपयोगकर्ताओं का मील का पत्थर पार किया।',
    fullContent: 'A groundbreaking free online platform dedicated to Jain Agama studies has reached a remarkable milestone, crossing one hundred thousand registered users in its first year. The platform, developed by a team of Jain scholars and technology professionals, offers comprehensive courses on all forty-five canonical texts of the Shvetambara tradition.\n\nEach course features professionally produced video lectures by eminent Jain scholars, interactive quizzes to test comprehension, downloadable study materials, and discussion forums where learners can engage with peers and experts. The content is available in Hindi, English, and Gujarati, with plans to add Kannada and Marathi translations.\n\nThe platform has been particularly praised for making ancient texts that were previously accessible only to advanced scholars available to anyone with an internet connection. University professors in India and abroad have begun integrating the platform\'s content into their Jain studies curricula. The development team has announced upcoming features including a mobile app, offline access capabilities, and an advanced certificate program validated by leading Jain academic institutions.',
    categoryIndex: 5,
    authorName: 'Manan Shah',
    sourceName: 'EdTech India',
    tags: ['agama', 'online-learning', 'platform'],
  },

  // ── health (6): 4 articles ──
  {
    title: 'Jain Doctors Association Organizes Free Multi-Specialty Health Camp',
    titleHi: 'जैन डॉक्टर्स एसोसिएशन ने मुफ्त बहु-विशेषता स्वास्थ्य शिविर का आयोजन किया',
    summary: 'The Jain Doctors Association organized a massive free multi-specialty health camp in rural Maharashtra that served over five thousand patients in just three days. A team of eighty specialist doctors including cardiologists, ophthalmologists, orthopedic surgeons, and pediatricians volunteered their time and expertise for the humanitarian initiative. Free medicines worth twenty lakh rupees were distributed and over two hundred patients were identified for follow-up surgeries that the association will fund completely.',
    summaryHi: 'जैन डॉक्टर्स एसोसिएशन ने ग्रामीण महाराष्ट्र में मुफ्त बहु-विशेषता स्वास्थ्य शिविर का आयोजन किया।',
    fullContent: 'The Jain Doctors Association, a professional body of over two thousand medical practitioners, organized its annual free health camp in a remote area of rural Maharashtra. Over three days, a team of eighty volunteer specialist doctors provided comprehensive medical care to more than five thousand patients, many of whom had never seen a specialist before.\n\nThe camp offered services across multiple specialties including cardiology, ophthalmology, orthopedics, pediatrics, gynecology, and dentistry. Advanced diagnostic equipment including portable ultrasound machines and ECG devices were brought to the camp site. Free medicines worth twenty lakh rupees were distributed to patients who required ongoing treatment.\n\nOver two hundred patients were identified as needing surgical interventions, including cataract operations, hernia repairs, and joint replacements. The association has committed to funding all these surgeries at partner hospitals in nearby cities. Post-camp follow-up will be conducted through a network of local health workers trained by the association during the camp.',
    categoryIndex: 6,
    authorName: 'Dr. Pankaj Jain',
    sourceName: 'Health India Today',
    tags: ['health-camp', 'free-medical', 'rural-health'],
  },
  {
    title: 'Research Study Highlights Health Benefits of Traditional Jain Fasting Practices',
    titleHi: 'शोध अध्ययन में पारंपरिक जैन उपवास प्रथाओं के स्वास्थ्य लाभ उजागर',
    summary: 'A comprehensive research study conducted by a team of nutritionists and medical researchers at a prestigious Indian medical institute has documented significant health benefits associated with traditional Jain fasting practices including Ekasana and Beasana. The study followed three hundred regular practitioners over two years and found notable improvements in metabolic markers, cardiovascular health indicators, and inflammatory biomarkers compared to control groups. Researchers emphasized that supervised traditional fasting offers a structured approach to intermittent caloric restriction.',
    summaryHi: 'एक व्यापक शोध अध्ययन ने पारंपरिक जैन उपवास प्रथाओं के महत्वपूर्ण स्वास्थ्य लाभ दर्शाए।',
    fullContent: 'A landmark research study published in a leading medical journal has provided scientific validation for the health benefits of traditional Jain fasting practices. The two-year study, conducted at one of India\'s most prestigious medical research institutes, followed three hundred practitioners of regular Jain fasting and compared their health outcomes with a matched control group.\n\nThe study focused on Ekasana (one meal per day) and Beasana (two meals per day) fasting practices commonly observed by Jain devotees. Results showed that regular practitioners had significantly lower fasting blood glucose levels, improved lipid profiles, reduced inflammatory markers, and better cardiovascular health indicators compared to non-practitioners.\n\nThe lead researcher noted that Jain fasting practices essentially represent a traditional form of intermittent fasting that modern science is now recognizing as beneficial. However, the study also emphasized the importance of proper nutrition during eating periods and recommended that individuals with existing health conditions consult doctors before adopting rigorous fasting regimens. The findings have generated significant interest from the global intermittent fasting research community.',
    categoryIndex: 6,
    authorName: 'Dr. Rashmi Sanghvi',
    sourceName: 'Medical Journal India',
    tags: ['fasting', 'research', 'health-benefits'],
  },
  {
    title: 'Satvik Diet Trend Sees Surge as Nutritionists Endorse Plant-Based Jain Cuisine',
    titleHi: 'सात्विक आहार प्रवृत्ति में उछाल, पोषण विशेषज्ञों ने जैन शाकाहारी भोजन का समर्थन किया',
    summary: 'The satvik diet, rooted in Jain principles of non-violence and purity, is experiencing a significant surge in popularity as leading nutritionists and wellness influencers endorse its health benefits across mainstream media platforms. Several celebrity chefs have launched dedicated satvik menu lines at their restaurants featuring traditional Jain recipes made with seasonal ingredients and without root vegetables. Nutritional analyses show that a well-planned satvik diet provides complete protein and essential nutrients while supporting sustainable food practices.',
    summaryHi: 'सात्विक आहार, जो जैन अहिंसा के सिद्धांतों पर आधारित है, में उल्लेखनीय लोकप्रियता की वृद्धि देखी जा रही है।',
    fullContent: 'The satvik diet, which has been a cornerstone of Jain lifestyle for millennia, is experiencing unprecedented mainstream popularity. Leading nutritionists across India and abroad are increasingly recommending plant-based eating patterns inspired by Jain culinary traditions, citing their benefits for both personal health and environmental sustainability.\n\nSeveral well-known celebrity chefs have launched dedicated satvik menu sections at their restaurants, featuring traditional Jain recipes that avoid root vegetables, use seasonal ingredients, and incorporate ancient cooking techniques. Food bloggers and social media influencers with millions of followers have been showcasing satvik meal preparations, driving interest among younger demographics.\n\nNutritional analyses conducted by food science departments at multiple universities confirm that a thoughtfully planned satvik diet provides complete protein through combinations of legumes, grains, and dairy, along with all essential vitamins and minerals. The diet\'s emphasis on fresh, seasonal, and minimally processed foods aligns perfectly with current nutritional science recommendations. Health food stores across metro cities report a sharp increase in demand for satvik-certified food products.',
    categoryIndex: 6,
    authorName: 'Chef Nirmala Jain',
    sourceName: 'Food India Magazine',
    tags: ['satvik-diet', 'nutrition', 'plant-based'],
  },
  {
    title: 'Jain Community Yoga Initiative Promotes Holistic Wellness Among Elderly Members',
    titleHi: 'जैन समुदाय योग पहल ने बुजुर्ग सदस्यों के बीच समग्र कल्याण को बढ़ावा दिया',
    summary: 'A community-wide wellness initiative launched by Jain organizations in Surat is providing free yoga and Preksha meditation classes specifically designed for elderly community members at thirty locations across the city. Over two thousand senior citizens have enrolled in the program which combines gentle physical exercises with traditional Jain breathing techniques and guided meditation sessions. Participating doctors report measurable improvements in blood pressure management, joint flexibility, and overall mental wellbeing among regular attendees.',
    summaryHi: 'सूरत में जैन संगठनों ने बुजुर्ग सदस्यों के लिए तीस स्थानों पर मुफ्त योग और ध्यान कक्षाएं शुरू कीं।',
    fullContent: 'Jain community organizations in Surat have launched an ambitious wellness initiative targeting elderly members, offering free yoga and Preksha meditation classes at thirty locations across the city. The program, which has already enrolled over two thousand senior citizens, combines gentle physical exercises suitable for older adults with traditional Jain breathing and meditation techniques.\n\nClasses are conducted by certified yoga instructors who have received additional training in Preksha meditation and the specific needs of elderly practitioners. Sessions are held in temple halls, community centers, and public parks, making them easily accessible to participants. The program also includes monthly health check-ups and nutritional counseling.\n\nDoctors monitoring the program have documented measurable improvements among regular attendees, including better blood pressure control, increased joint flexibility, reduced dependency on pain medications, and significantly improved mood and mental clarity. The initiative has become so popular that neighboring cities are requesting guidance to replicate the model in their own Jain communities.',
    categoryIndex: 6,
    authorName: 'Dr. Varsha Doshi',
    sourceName: 'Surat Samachar',
    tags: ['yoga', 'elderly-wellness', 'preksha'],
  },

  // ── business (7): 4 articles ──
  {
    title: 'Jain Business Leaders Forum Launches Startup Incubator for Young Entrepreneurs',
    titleHi: 'जैन व्यापार नेताओं के मंच ने युवा उद्यमियों के लिए स्टार्टअप इन्क्यूबेटर शुरू किया',
    summary: 'The Jain Business Leaders Forum has launched a dedicated startup incubator in Mumbai aimed at supporting young entrepreneurs from the community with mentorship, seed funding, and shared workspace facilities. The incubator will accept twenty startups per cohort and provide six months of intensive support including access to a network of over five hundred successful Jain business leaders. Initial funding of ten crore rupees has been committed by prominent industrialists who will also serve as mentors and advisors to the selected ventures.',
    summaryHi: 'जैन व्यापार नेताओं के मंच ने मुंबई में युवा उद्यमियों के लिए स्टार्टअप इन्क्यूबेटर शुरू किया।',
    fullContent: 'The Jain Business Leaders Forum, a network of some of India\'s most successful Jain entrepreneurs and industrialists, has launched a dedicated startup incubator in the heart of Mumbai\'s business district. The initiative aims to nurture the next generation of Jain business leaders by providing comprehensive support to promising young entrepreneurs.\n\nEach cohort of twenty selected startups will receive seed funding of up to twenty-five lakh rupees, access to modern co-working spaces, and six months of intensive mentorship from experienced business leaders. The program includes weekly masterclasses on topics ranging from financial management and marketing to technology and leadership, all delivered by successful entrepreneurs who have built companies from the ground up.\n\nThe incubator\'s advisory board includes prominent Jain industrialists from sectors including pharmaceuticals, real estate, diamonds, and technology. Initial funding of ten crore rupees ensures the incubator can operate for at least five years. Applications for the first cohort have already been opened, with a focus on startups in technology, sustainable businesses, and social enterprises.',
    categoryIndex: 7,
    authorName: 'Rajiv Mehta',
    sourceName: 'Business Standard',
    tags: ['startup', 'incubator', 'entrepreneurship'],
  },
  {
    title: 'Diamond Industry Leaders from Jain Community Invest in Sustainable Mining',
    titleHi: 'जैन समुदाय के हीरा उद्योग नेताओं ने टिकाऊ खनन में निवेश किया',
    summary: 'Leading diamond merchants from the Jain community in Surat, who collectively control a significant portion of the global diamond cutting and polishing industry, have announced a consortium to invest in sustainable and ethical mining practices worldwide. The five hundred crore rupee initiative will fund technologies that reduce environmental impact of mining operations and ensure fair labor practices throughout the supply chain. The move aligns traditional Jain values of non-violence with modern corporate social responsibility standards.',
    summaryHi: 'सूरत के जैन समुदाय के प्रमुख हीरा व्यापारियों ने टिकाऊ और नैतिक खनन प्रथाओं में निवेश की घोषणा की।',
    fullContent: 'In a move that aligns centuries-old Jain ethical principles with modern business practices, leading diamond merchants from the Jain community in Surat have formed a consortium dedicated to promoting sustainable and ethical mining across the global diamond supply chain. The initiative, backed by five hundred crore rupees in committed capital, represents one of the largest private investments in ethical mining from the Indian diamond industry.\n\nThe consortium will fund the development and deployment of technologies that minimize the environmental footprint of mining operations, including water recycling systems, land rehabilitation programs, and energy-efficient processing equipment. A significant portion of the investment is also directed toward ensuring fair labor practices and safe working conditions in mining regions across Africa and Canada.\n\nIndustry analysts note that the Jain community\'s dominant position in the global diamond cutting and polishing sector gives this initiative significant leverage to drive industry-wide change. The consortium\'s founding members emphasized that the principle of ahimsa extends beyond personal practice to encompass business decisions that affect communities and ecosystems worldwide.',
    categoryIndex: 7,
    authorName: 'Bharat Dholakia',
    sourceName: 'Economic Times',
    tags: ['diamond', 'sustainable-mining', 'ethics'],
  },
  {
    title: 'Jain Women Entrepreneurs Network Crosses Ten Thousand Members Milestone',
    titleHi: 'जैन महिला उद्यमी नेटवर्क ने दस हजार सदस्यों का मील का पत्थर पार किया',
    summary: 'The Jain Women Entrepreneurs Network has celebrated crossing ten thousand active members making it one of the largest women-focused business networks in India. The organization provides business training workshops, networking events, micro-loan facilities, and digital marketing support to women entrepreneurs from the Jain community across the country. Over the past year alone, members have collectively launched three hundred new businesses generating employment for approximately two thousand people in sectors including textiles, food processing, and technology services.',
    summaryHi: 'जैन महिला उद्यमी नेटवर्क ने दस हजार सक्रिय सदस्यों का मील का पत्थर पार किया।',
    fullContent: 'The Jain Women Entrepreneurs Network (JWEN) has celebrated a significant milestone, crossing ten thousand active members across India. Founded just five years ago by a group of women business owners in Ahmedabad, the organization has grown into one of the largest women-focused business networks in the country.\n\nJWEN provides a comprehensive support ecosystem for women entrepreneurs including business skills training workshops, networking events with industry leaders, access to micro-loan facilities through partner financial institutions, and digital marketing support. The organization has been particularly effective in helping women from traditional families who face cultural barriers to entering business.\n\nIn the past year alone, JWEN members have collectively launched three hundred new businesses, creating employment for approximately two thousand people. The businesses span diverse sectors including textiles, organic food processing, e-commerce, beauty and wellness, and technology services. The network recently launched a peer mentorship program where experienced members guide newcomers through the challenges of starting and scaling a business.',
    categoryIndex: 7,
    authorName: 'Pallavi Jain',
    sourceName: 'Women Entrepreneur India',
    tags: ['women-entrepreneurs', 'network', 'business'],
  },
  {
    title: 'Jain-Owned Pharmaceutical Company Announces Affordable Generic Medicine Initiative',
    titleHi: 'जैन स्वामित्व वाली फार्मा कंपनी ने सस्ती जेनेरिक दवा पहल की घोषणा की',
    summary: 'A major Jain-owned pharmaceutical company has announced an ambitious initiative to manufacture and distribute affordable generic medicines for chronic diseases at prices up to seventy percent lower than branded equivalents. The program targets diabetes, hypertension, and cardiac medications that millions of Indians depend upon daily. The company will establish distribution partnerships with charitable hospitals and community health centers nationwide ensuring medicines reach patients who need them most regardless of their ability to pay.',
    summaryHi: 'एक प्रमुख जैन स्वामित्व वाली फार्मा कंपनी ने सस्ती जेनेरिक दवाओं की महत्वाकांक्षी पहल की घोषणा की।',
    fullContent: 'One of India\'s leading Jain-owned pharmaceutical companies has announced a groundbreaking initiative to manufacture and distribute generic medicines for chronic diseases at prices up to seventy percent below current branded equivalents. The program focuses on medications for diabetes, hypertension, and cardiovascular conditions, which collectively affect over two hundred million Indians.\n\nThe company has invested in expanding its manufacturing capacity specifically for this initiative, adding two new production lines dedicated to affordable generics. Rigorous quality controls will ensure that the lower-priced medicines meet the same safety and efficacy standards as their branded counterparts.\n\nDistribution will be handled through partnerships with charitable hospitals, community health centers, and Jain-run medical facilities across the country. A special program for patients below the poverty line will provide medicines completely free of cost, funded by the company\'s corporate social responsibility budget. The company\'s founder stated that the initiative is driven by the Jain principle that business success carries a responsibility to alleviate suffering in society.',
    categoryIndex: 7,
    authorName: 'Sanjay Surana',
    sourceName: 'Pharma Business Today',
    tags: ['pharma', 'generic-medicine', 'affordable'],
  },

  // ── youth (8): 4 articles ──
  {
    title: 'National Jain Youth Conference Draws Three Thousand Young Leaders to Pune',
    titleHi: 'राष्ट्रीय जैन युवा सम्मेलन में तीन हजार युवा नेता पुणे में एकत्रित',
    summary: 'The biennial National Jain Youth Conference held in Pune attracted over three thousand young leaders aged eighteen to thirty-five from across India for a three-day program of workshops, panel discussions, and networking events. Key themes included preserving Jain values in the digital age, combating climate change through Jain environmental ethics, and building bridges across different Jain sects and traditions. Participants launched several collaborative projects including a nationwide environmental cleanup campaign and a peer mental health support network.',
    summaryHi: 'पुणे में द्विवार्षिक राष्ट्रीय जैन युवा सम्मेलन में तीन हजार से अधिक युवा नेता शामिल हुए।',
    fullContent: 'Pune hosted the largest-ever National Jain Youth Conference, drawing over three thousand young leaders from every state in India for a dynamic three-day program. The conference, organized by a coalition of Jain youth organizations, focused on empowering the next generation to carry forward Jain values while addressing contemporary challenges.\n\nKey sessions explored how to maintain spiritual practice in an increasingly digital world, the application of Jain environmental ethics to climate activism, and the importance of building unity across the community\'s diverse sects and traditions. Interactive workshops on leadership skills, social entrepreneurship, and digital content creation for spiritual messaging were among the most popular sessions.\n\nThe conference produced tangible outcomes including the launch of a nationwide environmental cleanup campaign targeting one hundred cities, a peer mental health support network connecting young Jains struggling with anxiety and depression, and a collaborative platform for sharing Jain teachings through social media content. Organizers noted that the energy and commitment shown by the young participants gave them immense hope for the future of the community.',
    categoryIndex: 8,
    authorName: 'Rohan Bhandari',
    sourceName: 'Pune Mirror',
    tags: ['youth-conference', 'leadership', 'pune'],
  },
  {
    title: 'Jain Youth Volunteers Lead Massive Tree Plantation Drive Across Rural India',
    titleHi: 'जैन युवा स्वयंसेवकों ने ग्रामीण भारत में विशाल वृक्षारोपण अभियान का नेतृत्व किया',
    summary: 'Over five thousand young Jain volunteers from colleges and professional organizations participated in a coordinated tree plantation drive that successfully planted over one hundred thousand saplings across fifty rural districts in ten states. The Ahimsa Green initiative connects the Jain principle of respect for all life with practical environmental action. Volunteers committed to monitoring and nurturing the planted saplings for two years ensuring maximum survival rates through regular watering and protection from grazing animals.',
    summaryHi: 'पांच हजार से अधिक युवा जैन स्वयंसेवकों ने पचास ग्रामीण जिलों में एक लाख पौधे लगाए।',
    fullContent: 'In a remarkable display of environmental commitment rooted in Jain values, over five thousand young volunteers from colleges, professional organizations, and community groups participated in the Ahimsa Green tree plantation drive. The coordinated effort spanned fifty rural districts across ten states and successfully planted over one hundred thousand saplings in a single weekend.\n\nThe initiative was conceptualized by a group of young Jain environmental activists who wanted to create a tangible connection between the Jain principle of respect for all life and practical ecological action. Species selected for planting included native fruit-bearing trees, medicinal plants, and fast-growing shade trees, chosen based on local ecological assessments.\n\nWhat sets this drive apart from typical plantation campaigns is the commitment to long-term care. Each volunteer team has pledged to monitor and nurture their planted saplings for a minimum of two years, with monthly visits to ensure proper watering and protection from grazing animals. GPS tagging of each planting site enables centralized monitoring of survival rates, which organizers aim to keep above eighty percent.',
    categoryIndex: 8,
    authorName: 'Kriti Jain',
    sourceName: 'Green India News',
    tags: ['tree-plantation', 'youth', 'environment'],
  },
  {
    title: 'Young Jain Professionals Launch Free Coding Bootcamp for Underprivileged Students',
    titleHi: 'युवा जैन पेशेवरों ने वंचित छात्रों के लिए मुफ्त कोडिंग बूटकैंप शुरू किया',
    summary: 'A group of young Jain technology professionals working in leading companies across Bangalore has launched a free coding bootcamp aimed at training underprivileged students in programming and software development skills. The twelve-week intensive program covers web development, mobile app creation, and fundamental computer science concepts with hands-on project-based learning approaches. The first batch of fifty students includes participants from diverse backgrounds selected purely on aptitude and motivation with guaranteed internship placements upon successful program completion.',
    summaryHi: 'बेंगलुरु में युवा जैन तकनीकी पेशेवरों ने वंचित छात्रों के लिए मुफ्त कोडिंग बूटकैंप शुरू किया।',
    fullContent: 'A collective of young Jain technology professionals employed at leading tech companies in Bangalore has launched an ambitious free coding bootcamp for underprivileged students. The initiative, called "Code for Ahimsa," provides twelve weeks of intensive training in programming and software development to students who cannot afford private coding education.\n\nThe curriculum covers web development using modern frameworks, mobile app development, database management, and fundamental computer science concepts. The program emphasizes project-based learning, with students building real applications that solve community problems. Instruction is provided by volunteer mentors who take time from their professional schedules to teach evening and weekend classes.\n\nThe first batch comprises fifty students selected from over five hundred applicants, chosen purely on the basis of aptitude and motivation regardless of background. All students who successfully complete the program are guaranteed internship placements at participating companies. The initiative has received sponsorship from several Jain business leaders who are funding infrastructure costs including laptops, internet connectivity, and classroom space.',
    categoryIndex: 8,
    authorName: 'Vivek Jain',
    sourceName: 'TechCrunch India',
    tags: ['coding-bootcamp', 'youth', 'technology'],
  },
  {
    title: 'Jain Student Association Wins National Award for Campus Sustainability Project',
    titleHi: 'जैन छात्र संघ ने कैंपस स्थिरता परियोजना के लिए राष्ट्रीय पुरस्कार जीता',
    summary: 'The Jain Students Association at a prominent engineering college in Gujarat has won a national award for its innovative campus sustainability project that reduced the institution\'s carbon footprint by forty percent within one academic year. The project implemented solar energy systems, comprehensive waste segregation and composting programs, rainwater harvesting infrastructure, and a campus-wide campaign to eliminate single-use plastics inspired by Jain ecological principles. The award committee praised the project as a model for other educational institutions.',
    summaryHi: 'गुजरात के एक प्रमुख इंजीनियरिंग कॉलेज में जैन छात्र संघ ने कैंपस स्थिरता परियोजना के लिए राष्ट्रीय पुरस्कार जीता।',
    fullContent: 'The Jain Students Association at a leading engineering college in Gujarat has received a prestigious national award for an innovative campus sustainability project that dramatically reduced the institution\'s environmental impact. The project, implemented over a single academic year, achieved a forty percent reduction in the campus\'s carbon footprint.\n\nThe comprehensive initiative included the installation of rooftop solar panels generating enough electricity to power all common areas, a waste segregation and composting system that diverts ninety percent of organic waste from landfills, rainwater harvesting tanks that supply water for landscaping and sanitation, and a campus-wide campaign that successfully eliminated single-use plastics.\n\nThe students drew explicit inspiration from Jain ecological principles, particularly the concept of Aparigraha (non-possessiveness) and reverence for all living beings. The award committee, comprising environmental experts and government officials, praised the project as a replicable model for other educational institutions. Several colleges have already contacted the association seeking guidance on implementing similar programs on their campuses.',
    categoryIndex: 8,
    authorName: 'Arjun Doshi',
    sourceName: 'Gujarat University News',
    tags: ['sustainability', 'award', 'campus'],
  },

  // ── national (9): 5 articles ──
  {
    title: 'Government Recognizes Jain Heritage Sites with Special Conservation Status',
    titleHi: 'सरकार ने जैन विरासत स्थलों को विशेष संरक्षण दर्जा दिया',
    summary: 'The central government has announced special conservation status for twelve ancient Jain heritage sites across six states granting them enhanced legal protection and dedicated funding for preservation and restoration activities. The designated sites include cave temples in Madhya Pradesh, ancient inscriptions in Karnataka, and medieval-era temple complexes in Rajasthan. A committee of archaeologists and Jain scholars will oversee conservation efforts ensuring that restoration work maintains historical authenticity while meeting modern safety and accessibility standards for visitors.',
    summaryHi: 'केंद्र सरकार ने छह राज्यों में बारह प्राचीन जैन विरासत स्थलों को विशेष संरक्षण दर्जा दिया।',
    fullContent: 'In a significant move for cultural preservation, the central government has granted special conservation status to twelve ancient Jain heritage sites spread across six states. This designation provides enhanced legal protection against encroachment and development, along with dedicated annual funding for preservation and restoration activities.\n\nThe sites include the Udayagiri and Khandagiri cave temples in Odisha dating back to the second century BCE, ancient Jain inscriptions at Shravanabelagola in Karnataka, the exquisite Dilwara Temples in Mount Abu, and several medieval-era temple complexes in Rajasthan and Madhya Pradesh. Each site represents a unique chapter in the rich architectural and cultural history of Jainism.\n\nA specialized committee comprising archaeologists, art historians, and Jain scholars has been constituted to oversee conservation efforts at all designated sites. The committee will ensure that restoration work maintains historical authenticity while incorporating modern structural engineering principles. Improved visitor facilities including accessible pathways, informational signage, and digital interpretation centers are also planned for each site.',
    categoryIndex: 9,
    authorName: 'Anil Saraf',
    sourceName: 'The Hindu',
    tags: ['heritage', 'conservation', 'government'],
  },
  {
    title: 'Parliament Passes Resolution Honoring Jain Contributions to Indian Civilization',
    titleHi: 'संसद ने भारतीय सभ्यता में जैन योगदान का सम्मान करते हुए प्रस्ताव पारित किया',
    summary: 'The Indian Parliament has unanimously passed a resolution recognizing and honoring the profound contributions of the Jain community to Indian civilization spanning philosophy, art, architecture, literature, and commerce over more than two thousand five hundred years. The resolution acknowledges Lord Mahavira\'s teachings on non-violence as a foundational influence on Indian culture and specifically recognizes the community\'s ongoing contributions to education, healthcare, and charitable endeavors across the nation throughout modern times.',
    summaryHi: 'भारतीय संसद ने भारतीय सभ्यता में जैन समुदाय के गहन योगदान को सम्मानित करते हुए प्रस्ताव पारित किया।',
    fullContent: 'In a rare display of unanimous bipartisan support, the Indian Parliament passed a resolution honoring the contributions of the Jain community to Indian civilization. Members from all parties spoke in favor of the resolution, highlighting the community\'s outsized impact on Indian philosophy, art, architecture, literature, and economic development over millennia.\n\nSeveral parliamentarians noted that Lord Mahavira\'s teaching of ahimsa profoundly influenced Mahatma Gandhi and through him, the entire Indian independence movement. Others highlighted the community\'s remarkable contributions to architectural heritage, from the Dilwara Temples to the Gomateshwara statue, and its historical role in developing sophisticated systems of commerce and banking.\n\nThe resolution specifically acknowledges the modern Jain community\'s continued commitment to education, healthcare, and charitable work. Statistical data presented during the debate showed that Jain-run charitable trusts collectively manage hospitals, schools, and relief organizations serving millions of Indians from all backgrounds annually. Community leaders expressed gratitude for the recognition and reiterated their commitment to national development.',
    categoryIndex: 9,
    authorName: 'Pradeep Patni',
    sourceName: 'Times of India',
    tags: ['parliament', 'resolution', 'contributions'],
  },
  {
    title: 'Supreme Court Upholds Jain Community\'s Right to Manage Ancient Temple Trusts',
    titleHi: 'सर्वोच्च न्यायालय ने प्राचीन मंदिर ट्रस्टों के प्रबंधन के जैन समुदाय के अधिकार को बरकरार रखा',
    summary: 'The Supreme Court of India has delivered a landmark judgment upholding the right of Jain communities to autonomously manage their ancient temple trusts without undue government interference. The verdict came in response to a decade-long legal battle involving multiple temple trusts across Rajasthan and Gujarat. The court recognized that Jain temple management follows centuries-old traditions and internal governance structures that have effectively preserved these heritage sites while maintaining their religious sanctity for generations.',
    summaryHi: 'सर्वोच्च न्यायालय ने जैन समुदायों के प्राचीन मंदिर ट्रस्टों के स्वायत्त प्रबंधन के अधिकार को बरकरार रखा।',
    fullContent: 'The Supreme Court of India has delivered a significant verdict affirming the right of Jain communities to manage their ancient temple trusts autonomously. The judgment, which has been welcomed by Jain organizations across the country, came after a decade-long legal battle involving several prominent temple trusts in Rajasthan and Gujarat.\n\nThe court observed that Jain temple management traditions, which have evolved over centuries, represent a sophisticated system of community governance that has successfully preserved irreplaceable cultural and religious heritage. The judges noted that government intervention in the internal affairs of these trusts could disrupt effective management practices that have served the community and the nation well.\n\nThe verdict also established important guidelines for transparency and accountability in temple trust operations, including requirements for regular financial audits, public disclosure of income and expenditure, and democratic processes for the selection of trust members. Jain community leaders praised the balanced approach of the judgment, which protects community autonomy while ensuring responsible governance of these important institutions.',
    categoryIndex: 9,
    authorName: 'Adv. Manish Jain',
    sourceName: 'Indian Express',
    tags: ['supreme-court', 'temple-trusts', 'legal'],
  },
  {
    title: 'National Ahimsa Day Celebrations Highlight Non-Violence as Core Indian Value',
    titleHi: 'राष्ट्रीय अहिंसा दिवस समारोह में अहिंसा को मूल भारतीय मूल्य के रूप में रेखांकित',
    summary: 'National Ahimsa Day was observed with special programs across India as schools, colleges, and government institutions organized events highlighting the Jain principle of non-violence as a fundamental value of Indian civilization. The observance featured essay competitions, debates, cultural programs, and peace marches in over two hundred cities. The President of India delivered a special address recognizing ahimsa as one of India\'s greatest gifts to the world and urged citizens to practice non-violence in thought, speech, and action daily.',
    summaryHi: 'राष्ट्रीय अहिंसा दिवस विशेष कार्यक्रमों के साथ पूरे भारत में मनाया गया।',
    fullContent: 'National Ahimsa Day was celebrated with widespread participation across India, with schools, colleges, government offices, and community organizations hosting events to highlight the enduring relevance of non-violence. The day, observed annually on Lord Mahavira\'s birth anniversary, saw coordinated activities in over two hundred cities.\n\nSchools organized essay competitions and debates on themes related to non-violence in daily life, while colleges hosted seminars examining ahimsa through philosophical, scientific, and political lenses. Peace marches brought thousands of participants to the streets in major cities, carrying messages of harmony and compassion. Cultural programs featuring dance, drama, and music depicting the lives of Lord Mahavira and other champions of non-violence were performed throughout the day.\n\nThe President of India delivered a nationally televised address in which she recognized ahimsa as one of India\'s greatest contributions to world civilization. She highlighted how the Jain tradition\'s unwavering commitment to non-violence over thousands of years inspired movements for justice and peace around the globe, and urged every citizen to make a conscious effort to practice non-violence in thought, speech, and action.',
    categoryIndex: 9,
    authorName: 'Sunita Sethi',
    sourceName: 'Hindustan Times',
    tags: ['ahimsa-day', 'non-violence', 'national'],
  },
  {
    title: 'Central Government Allocates Special Budget for Jain Manuscript Digitization',
    titleHi: 'केंद्र सरकार ने जैन पांडुलिपि डिजिटलीकरण के लिए विशेष बजट आवंटित किया',
    summary: 'The Ministry of Culture has allocated a special budget of twenty crore rupees for the digitization of ancient Jain manuscripts housed in libraries and temple repositories across India. The three-year project aims to scan, catalog, and create searchable digital archives of over fifty thousand rare palm leaf and paper manuscripts dating back several centuries. International scholars have welcomed the initiative as these manuscripts contain invaluable knowledge about philosophy, science, mathematics, and literature that remains largely inaccessible to researchers.',
    summaryHi: 'संस्कृति मंत्रालय ने प्राचीन जैन पांडुलिपियों के डिजिटलीकरण के लिए बीस करोड़ रुपये का विशेष बजट आवंटित किया।',
    fullContent: 'The Ministry of Culture has announced a dedicated twenty crore rupee budget for a comprehensive project to digitize ancient Jain manuscripts scattered across libraries, temple repositories, and private collections throughout India. The three-year initiative aims to create searchable digital archives of over fifty thousand rare manuscripts, many of which are deteriorating and at risk of being lost forever.\n\nThe manuscripts, written on palm leaves, birch bark, and handmade paper, span a period from the fifth century onwards and cover an extraordinary range of subjects including philosophy, logic, astronomy, mathematics, medicine, linguistics, and literature. Many contain unique knowledge not found in any other tradition and represent an irreplaceable part of India\'s intellectual heritage.\n\nAdvanced scanning technologies will be employed to capture high-resolution images of each manuscript without causing any physical damage. The digital archives will be hosted on a publicly accessible platform, enabling scholars worldwide to study these texts. The National Mission for Manuscripts will collaborate with major Jain libraries including the Bhandarkar Oriental Research Institute in Pune and the L.D. Institute of Indology in Ahmedabad.',
    categoryIndex: 9,
    authorName: 'Dr. Kamal Chand',
    sourceName: 'Ministry of Culture Bulletin',
    tags: ['manuscripts', 'digitization', 'government'],
  },

  // ── international (10): 4 articles ──
  {
    title: 'World Jain Congress in London Attracts Delegates from Forty Countries',
    titleHi: 'लंदन में विश्व जैन कांग्रेस में चालीस देशों के प्रतिनिधि शामिल',
    summary: 'The biennial World Jain Congress held in London attracted over two thousand delegates from forty countries for a landmark four-day gathering focused on strengthening the global Jain community network. Sessions covered diaspora challenges, interfaith dialogue initiatives, preservation of Jain cultural identity abroad, and collective philanthropy strategies for worldwide impact. A historic declaration was adopted committing participating organizations to coordinated action on climate change, animal welfare, and education access aligned with core Jain values.',
    summaryHi: 'लंदन में द्विवार्षिक विश्व जैन कांग्रेस में चालीस देशों से दो हजार से अधिक प्रतिनिधि शामिल हुए।',
    fullContent: 'London played host to the most well-attended World Jain Congress in the event\'s history, welcoming over two thousand delegates from forty countries for four days of dialogue, collaboration, and community building. The Congress, held at a prestigious venue in central London, brought together community leaders, scholars, business executives, and youth representatives from every continent.\n\nKey sessions addressed the unique challenges faced by Jain diaspora communities, including maintaining cultural identity while integrating into diverse societies, transmitting religious values to children growing up in non-Jain environments, and building bridges of understanding through interfaith dialogue. Business networking sessions connected Jain entrepreneurs across borders, leading to several new partnership announcements.\n\nThe Congress concluded with the adoption of the London Declaration, a historic document committing all participating organizations to coordinated global action on three priorities: combating climate change through Jain environmental ethics, advocating for animal welfare legislation worldwide, and expanding access to education for underprivileged communities. A permanent secretariat was established to coordinate follow-up actions and plan the next Congress.',
    categoryIndex: 10,
    authorName: 'Hemant Shah',
    sourceName: 'BBC Asian Network',
    tags: ['world-congress', 'london', 'global'],
  },
  {
    title: 'First Jain Temple in South America Opens in São Paulo to Warm Reception',
    titleHi: 'दक्षिण अमेरिका का पहला जैन मंदिर साओ पाउलो में गर्मजोशी से स्वागत के साथ खुला',
    summary: 'The first Jain temple in South America has been inaugurated in São Paulo, Brazil, marking a significant milestone for the growing Jain community in the region. The temple was built through contributions from approximately three hundred Jain families settled across Brazil, Argentina, and Chile. The inauguration ceremony attracted community members from across the continent along with local Brazilian officials who praised the Jain community\'s contributions to the country. The temple will serve as a cultural and spiritual center for South American Jains.',
    summaryHi: 'दक्षिण अमेरिका का पहला जैन मंदिर ब्राजील के साओ पाउलो में उद्घाटित किया गया।',
    fullContent: 'In a historic moment for the global Jain community, the first Jain temple in South America was inaugurated in São Paulo, Brazil. The temple, a modest but beautifully designed structure incorporating traditional Indian architectural elements, was built through the collective efforts and contributions of approximately three hundred Jain families settled across Brazil, Argentina, and Chile.\n\nThe inauguration ceremony was a deeply emotional event, attended by community members who traveled from across the continent. Local Brazilian government officials also attended, praising the Jain community for its contributions to the country\'s economic and cultural life. A senior monk visiting from India performed the consecration rituals, which were translated into Portuguese for local attendees.\n\nThe temple will serve not only as a place of worship but also as a cultural center offering classes in Jain philosophy, Hindi and Gujarati language instruction, Indian cooking workshops, and yoga and meditation sessions. Community leaders expressed hope that the temple will help younger generations maintain their spiritual and cultural connections while also serving as a window into Jain culture for the broader Brazilian public.',
    categoryIndex: 10,
    authorName: 'Carlos Jain Silva',
    sourceName: 'Brasil India Times',
    tags: ['sao-paulo', 'temple', 'south-america'],
  },
  {
    title: 'UNESCO Recognizes Jain Manuscript Collection as World Documentary Heritage',
    titleHi: 'यूनेस्को ने जैन पांडुलिपि संग्रह को विश्व दस्तावेजी विरासत के रूप में मान्यता दी',
    summary: 'UNESCO has inscribed a major collection of ancient Jain manuscripts from Gujarat onto its Memory of the World Register recognizing them as documentary heritage of outstanding universal significance. The collection comprises over twelve thousand manuscripts spanning nearly one thousand years and includes philosophical treatises, scientific texts, and exquisite illustrated folios painted with natural pigments. International scholars celebrated the recognition as overdue acknowledgment of the extraordinary intellectual contributions of the Jain tradition to world knowledge.',
    summaryHi: 'यूनेस्को ने गुजरात की प्राचीन जैन पांडुलिपि संग्रह को मेमोरी ऑफ द वर्ल्ड रजिस्टर में शामिल किया।',
    fullContent: 'In a landmark recognition for Jain cultural heritage, UNESCO has inscribed a major collection of ancient Jain manuscripts from Gujarat onto its prestigious Memory of the World Register. The collection, housed at the L.D. Institute of Indology in Ahmedabad, comprises over twelve thousand manuscripts spanning nearly a millennium of intellectual production.\n\nThe manuscripts include philosophical treatises on Jain metaphysics and logic, scientific texts on astronomy and mathematics, medical compendia, literary works, and exquisitely illustrated folios depicting scenes from Jain mythology and daily life. Many of the illustrated manuscripts feature remarkably well-preserved paintings created with natural mineral and plant-based pigments.\n\nInternational scholars have celebrated the inscription as long overdue recognition of the extraordinary intellectual contributions of the Jain tradition. The UNESCO citation specifically noted the collection\'s significance as evidence of a continuous tradition of scholarship and artistic excellence, and its potential to provide insights into the development of science, philosophy, and art across the Indian subcontinent over many centuries.',
    categoryIndex: 10,
    authorName: 'Dr. Sarah Thompson',
    sourceName: 'UNESCO Heritage Bulletin',
    tags: ['unesco', 'manuscripts', 'heritage'],
  },
  {
    title: 'International Jain Youth Exchange Program Connects Communities Across Continents',
    titleHi: 'अंतर्राष्ट्रीय जैन युवा विनिमय कार्यक्रम ने महाद्वीपों के बीच समुदायों को जोड़ा',
    summary: 'An innovative international Jain youth exchange program has completed its pilot year successfully connecting young Jains aged eighteen to twenty-five from India, United States, United Kingdom, and Kenya through month-long cultural immersion experiences in each other\'s countries. Participants lived with host families, visited local Jain institutions, and collaborated on community service projects bridging cultural divides. The program received enthusiastic feedback from all participants who reported deeper appreciation for global Jain diversity and stronger personal commitment to community values.',
    summaryHi: 'अभिनव अंतर्राष्ट्रीय जैन युवा विनिमय कार्यक्रम ने चार देशों के युवाओं को जोड़ने में सफल पायलट वर्ष पूरा किया।',
    fullContent: 'An innovative international Jain youth exchange program has successfully completed its pilot year, creating meaningful connections between young Jains from four countries. The program placed participants aged eighteen to twenty-five in month-long immersive experiences in India, the United States, the United Kingdom, and Kenya, allowing them to experience how Jain values are practiced in different cultural contexts.\n\nParticipants lived with host families, attended local Jain temple activities, visited community institutions, and collaborated on service projects. An Indian participant in the US helped organize a Paryushana celebration at a New Jersey temple, while an American participant in Rajasthan assisted in a rural school supported by a Jain charitable trust.\n\nAll participants reported transformative experiences that deepened their understanding of how Jain principles manifest differently across cultures while maintaining their essential unity. The program\'s organizers, encouraged by the enthusiastic feedback, have announced an expanded second year that will include Australia and the UAE, doubling the number of participants to one hundred.',
    categoryIndex: 10,
    authorName: 'Priya Mehta',
    sourceName: 'Global Jain Network',
    tags: ['youth-exchange', 'international', 'cultural'],
  },

  // ── lifestyle (11): 4 articles ──
  {
    title: 'Jain Principles of Minimalism Inspire New Sustainable Fashion Movement',
    titleHi: 'जैन न्यूनतावाद के सिद्धांतों ने नई टिकाऊ फैशन आंदोलन को प्रेरित किया',
    summary: 'The Jain principle of Aparigraha or non-possessiveness is inspiring a growing sustainable fashion movement among young designers who are creating clothing lines using organic fabrics, natural dyes, and zero-waste manufacturing techniques. Several fashion startups founded by Jain entrepreneurs have launched collections that combine traditional Indian textile craftsmanship with contemporary minimalist aesthetics. Fashion industry observers note that these brands are attracting environmentally conscious consumers far beyond the Jain community with their compelling message of mindful consumption.',
    summaryHi: 'जैन अपरिग्रह सिद्धांत युवा डिजाइनरों के बीच एक बढ़ते टिकाऊ फैशन आंदोलन को प्रेरित कर रहा है।',
    fullContent: 'The ancient Jain principle of Aparigraha, or non-possessiveness, is finding powerful new expression in the world of fashion. A growing number of young designers, many from Jain backgrounds, are creating clothing lines that embody minimalism, sustainability, and ethical production practices.\n\nThese fashion startups use only organic and sustainably sourced fabrics, natural plant-based dyes, and zero-waste manufacturing techniques that minimize environmental impact at every stage of production. Collections feature clean, minimalist designs that combine traditional Indian textile craftsmanship including handloom weaving and block printing with contemporary aesthetics suitable for modern wardrobes.\n\nFashion industry observers note that these brands are resonating with a broad audience of environmentally conscious consumers, not just those from the Jain community. The founders frequently speak about how their upbringing in Jain families, with its emphasis on simplicity and mindful consumption, directly informed their business philosophy. Several of these brands have been featured in major fashion publications and have participated in sustainable fashion weeks in India and abroad.',
    categoryIndex: 11,
    authorName: 'Neha Jain',
    sourceName: 'Fashion Forward India',
    tags: ['aparigraha', 'sustainable-fashion', 'minimalism'],
  },
  {
    title: 'Traditional Jain Recipes Gain Popularity on Social Media Food Platforms',
    titleHi: 'पारंपरिक जैन व्यंजन सोशल मीडिया फूड प्लेटफॉर्म पर लोकप्रिय',
    summary: 'Traditional Jain recipes that avoid root vegetables and follow strict satvik principles are experiencing a viral surge on social media food platforms with several dedicated Jain cooking channels surpassing one million followers. Content creators are showcasing how traditional Jain culinary practices align perfectly with modern dietary trends including plant-based eating, clean eating, and mindful nutrition approaches. Popular recipe videos demonstrating innovative no-onion no-garlic dishes have collectively garnered over fifty million views in the past three months.',
    summaryHi: 'पारंपरिक जैन व्यंजन सोशल मीडिया फूड प्लेटफॉर्म पर वायरल लोकप्रियता प्राप्त कर रहे हैं।',
    fullContent: 'Traditional Jain recipes are experiencing an unprecedented surge in popularity on social media food platforms. Several dedicated Jain cooking channels on YouTube and Instagram have each surpassed one million followers, with their content reaching audiences far beyond the Jain community.\n\nThe appeal lies in the creative demonstration of how Jain culinary principles, which exclude root vegetables, onions, garlic, and nighttime eating, align remarkably well with modern dietary trends. Content creators showcase innovative recipes that are simultaneously satvik, delicious, and aesthetically appealing. From protein-rich dal preparations to creative vegetable dishes and traditional sweets made with pure ingredients, the variety and sophistication of Jain cuisine is being discovered by millions.\n\nPopular recipe videos featuring no-onion no-garlic versions of crowd-favorite dishes have collectively garnered over fifty million views in just three months. Food bloggers and nutritionists outside the Jain community have begun experimenting with and recommending these recipes for their clean, wholesome ingredients and balanced nutritional profiles. Several publishers have approached top Jain food creators about cookbook deals, signaling the mainstreaming of this culinary tradition.',
    categoryIndex: 11,
    authorName: 'Meghna Doshi',
    sourceName: 'Social Food India',
    tags: ['jain-recipes', 'social-media', 'cooking'],
  },
  {
    title: 'Jain Architecture Inspires Modern Eco-Home Design Trend in Urban Areas',
    titleHi: 'जैन वास्तुकला ने शहरी क्षेत्रों में आधुनिक इको-होम डिजाइन प्रवृत्ति को प्रेरित किया',
    summary: 'Architects across India are drawing inspiration from traditional Jain temple architecture to create modern eco-friendly residential designs that emphasize natural ventilation, organic materials, and harmonious integration with surrounding environments. Design elements borrowed from Jain temples include intricately carved jaali screens that provide privacy while allowing airflow, courtyard-centered layouts that promote natural cooling, and the use of locally sourced stone and lime mortar. Several award-winning residential projects in Ahmedabad and Jaipur explicitly acknowledge Jain architectural philosophy.',
    summaryHi: 'भारत भर के वास्तुकार आधुनिक पर्यावरण अनुकूल आवासीय डिजाइन के लिए जैन मंदिर वास्तुकला से प्रेरणा ले रहे हैं।',
    fullContent: 'A growing trend in Indian architecture sees designers drawing inspiration from the sophisticated building principles found in traditional Jain temples to create modern eco-friendly homes. The movement recognizes that Jain temple builders solved many of the environmental challenges that contemporary sustainable architecture seeks to address, centuries before modern technology.\n\nKey design elements being adapted include intricately patterned jaali screens that provide privacy and shade while allowing natural airflow, courtyard-centered layouts that promote passive cooling and create microclimate zones, and the use of locally sourced natural materials including stone, lime mortar, and reclaimed wood. These techniques reduce dependence on energy-intensive air conditioning and artificial lighting.\n\nSeveral award-winning residential projects in Ahmedabad and Jaipur have explicitly acknowledged Jain architectural philosophy as their primary design inspiration. Architects note that the Jain tradition\'s emphasis on creating spaces that are both beautiful and in harmony with nature provides a valuable framework for addressing today\'s sustainability challenges. Architecture schools are beginning to include modules on traditional Jain building principles in their sustainable design curricula.',
    categoryIndex: 11,
    authorName: 'Ar. Rahul Sanghvi',
    sourceName: 'Architecture Digest India',
    tags: ['architecture', 'eco-home', 'design'],
  },
  {
    title: 'Ahimsa-Based Lifestyle Products Market Grows Rapidly Among Conscious Consumers',
    titleHi: 'अहिंसा-आधारित जीवनशैली उत्पाद बाजार सचेत उपभोक्ताओं में तेजी से बढ़ रहा है',
    summary: 'The market for ahimsa-based lifestyle products including cruelty-free cosmetics, plant-based leather alternatives, and organic personal care items has grown by sixty percent over the past year according to a new industry report. Several Jain-founded companies are leading this sector by creating products that strictly adhere to non-violence principles throughout their entire supply chain from raw material sourcing to packaging and distribution. Industry analysts predict the ahimsa products market will reach five thousand crore rupees within three years.',
    summaryHi: 'अहिंसा-आधारित जीवनशैली उत्पादों का बाजार पिछले वर्ष में साठ प्रतिशत बढ़ा है।',
    fullContent: 'A new industry report reveals that the market for ahimsa-based lifestyle products has grown by an impressive sixty percent over the past year, driven by increasing consumer awareness about ethical and sustainable consumption. The segment includes cruelty-free cosmetics, plant-based leather alternatives, organic personal care products, and chemical-free household items.\n\nSeveral companies founded by Jain entrepreneurs are at the forefront of this booming market. These businesses differentiate themselves by ensuring strict adherence to non-violence principles throughout their entire supply chain, from raw material sourcing to manufacturing processes, packaging materials, and distribution methods. Products carry certifications verifying that no animal testing was conducted and no animal-derived ingredients were used.\n\nIndustry analysts predict that the ahimsa products market in India will reach five thousand crore rupees within three years as mainstream consumers increasingly factor ethical considerations into purchasing decisions. Major retail chains have begun creating dedicated sections for ahimsa-certified products, and several e-commerce platforms have launched specialized categories. The trend reflects a broader societal shift toward conscious consumption that aligns naturally with principles the Jain community has championed for millennia.',
    categoryIndex: 11,
    authorName: 'Divya Chordia',
    sourceName: 'Business Today',
    tags: ['ahimsa-products', 'lifestyle', 'market'],
  },
];

const now = new Date();
const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

const advertisementsData = [
  {
    title: 'Jain Matrimony',
    advertiserName: 'JainShaadi.com',
    description: 'Find your perfect Jain life partner. Trusted by over 50,000 families. Register free today and connect with verified profiles from Shvetambara and Digambara communities across India.',
    adType: 'native' as const,
    placement: ['inline_feed'],
    status: 'active' as const,
    startDate: now,
    endDate: thirtyDaysFromNow,
    impressionCount: randInt(5000, 25000),
    clickCount: randInt(500, 3000),
    targetCategories: ['community', 'lifestyle'],
  },
  {
    title: 'Palitana Pilgrimage Tour',
    advertiserName: 'Tirthyatra Tours',
    description: 'Experience the divine Shatrunjaya hill with our guided Palitana pilgrimage package. Comfortable accommodation, vegetarian meals, and expert guides ensure a spiritually enriching journey for your entire family.',
    adType: 'card' as const,
    placement: ['inline_feed'],
    status: 'active' as const,
    startDate: now,
    endDate: thirtyDaysFromNow,
    impressionCount: randInt(3000, 15000),
    clickCount: randInt(300, 2000),
    targetCategories: ['temple-news', 'spiritual'],
  },
  {
    title: 'Satvik Kitchen',
    advertiserName: 'Satvik Kitchen App',
    description: 'Discover 5,000+ pure Jain recipes without onion, garlic, or root vegetables. Download the Satvik Kitchen app for daily meal plans, festival special menus, and step-by-step cooking videos.',
    adType: 'banner' as const,
    placement: ['top_banner', 'article_bottom_banner'],
    status: 'active' as const,
    startDate: now,
    endDate: thirtyDaysFromNow,
    impressionCount: randInt(8000, 30000),
    clickCount: randInt(800, 4000),
    targetCategories: ['lifestyle', 'health'],
  },
  {
    title: 'Jain Heritage Academy',
    advertiserName: 'JHA Online',
    description: 'Enroll in certified online courses on Jain philosophy, Prakrit language, and Agama studies. Learn from renowned scholars at your own pace. Special courses for children and young adults available year-round.',
    adType: 'native' as const,
    placement: ['in_article'],
    status: 'active' as const,
    startDate: now,
    endDate: thirtyDaysFromNow,
    impressionCount: randInt(2000, 12000),
    clickCount: randInt(200, 1500),
    targetCategories: ['education', 'spiritual'],
  },
  {
    title: 'Ahimsa Clothing',
    advertiserName: 'Ahimsa Fashion Co.',
    description: 'Wear your values. Shop our collection of 100% cruelty-free, organic, and sustainably made clothing. Every purchase supports artisan communities and plants a tree. Free shipping on orders above Rs. 999.',
    adType: 'native' as const,
    placement: ['inline_feed', 'in_article'],
    status: 'active' as const,
    startDate: now,
    endDate: thirtyDaysFromNow,
    impressionCount: randInt(4000, 20000),
    clickCount: randInt(400, 2500),
    targetCategories: ['lifestyle', 'youth'],
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jainshorts';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Check if data already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log('Database already seeded. Exiting.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('Seeding database...\n');

    // ── 1. Create Default Admin + Staff Accounts ──
    const hashedPassword = await hashPassword('admin123');
    const admin = await Admin.create({
      email: 'admin@jinshorts.com',
      passwordHash: hashedPassword,
      name: 'Admin',
      role: 'super_admin',
      isActive: true,
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    });
    console.log(`✓ Admin created: ${admin.email}`);

    // Create staff accounts for each role
    const staffRoles = [
      { email: 'admanager@jinshorts.com', name: 'Ad Manager', role: 'ad_manager', location: { city: 'Delhi', state: 'Delhi', country: 'India' } },
      { email: 'newsmanager@jinshorts.com', name: 'News Manager', role: 'news_manager', location: { city: 'Jaipur', state: 'Rajasthan', country: 'India' } },
      { email: 'adexecutive@jinshorts.com', name: 'Ad Executive', role: 'ad_executive', location: { city: 'Ahmedabad', state: 'Gujarat', country: 'India' } },
      { email: 'newsexecutive@jinshorts.com', name: 'News Executive', role: 'news_executive', location: { city: 'Bangalore', state: 'Karnataka', country: 'India' } },
      { email: 'reporter@jinshorts.com', name: 'Reporter', role: 'reporter', location: { city: 'Udaipur', state: 'Rajasthan', country: 'India' } },
      { email: 'editor@jinshorts.com', name: 'Editor', role: 'editor', location: { city: 'Pune', state: 'Maharashtra', country: 'India' } },
      { email: 'quizmaster@jinshorts.com', name: 'Quiz Master', role: 'quiz_master', location: { city: 'Indore', state: 'Madhya Pradesh', country: 'India' } },
    ];
    for (const staff of staffRoles) {
      await Admin.create({
        email: staff.email,
        passwordHash: hashedPassword,
        name: staff.name,
        role: staff.role,
        isActive: true,
        location: staff.location,
      });
      console.log(`✓ Staff created: ${staff.email} (${staff.role})`);
    }

    // ── 1b. Create Test Mobile User ──
    const bcrypt = await import('bcryptjs');
    const userPasswordHash = await bcrypt.hash('user123', 12);
    const testUser = await User.create({
      name: 'Test User',
      email: 'user@jinshorts.com',
      passwordHash: userPasswordHash,
      isActive: true,
      preferredLanguage: 'en',
      notificationsEnabled: true,
      darkMode: true,
    });
    console.log(`✓ Mobile user created: ${testUser.email} (password: user123)`);

    // ── 2. Create Categories ──
    const categories = await Category.insertMany(
      categoriesData.map((c) => ({ ...c, isActive: true }))
    );
    console.log(`✓ ${categories.length} categories created.`);

    // ── 3. Create Articles ──
    const articles = await Article.insertMany(
      articlesData.map((a, index) => ({
        title: a.title,
        titleHi: a.titleHi,
        summary: a.summary,
        summaryHi: a.summaryHi,
        fullContent: a.fullContent,
        categoryId: categories[a.categoryIndex]._id,
        authorName: a.authorName,
        sourceName: a.sourceName,
        tags: a.tags,
        isBreaking: index === 0 || index === 15 || index === 30, // ~5% = about 2-3 of 50
        isFeatured: index % 7 === 0, // ~15% = about 7 of 50
        isPublished: true,
        priority: randInt(0, 10),
        viewCount: randInt(0, 5000),
        bookmarkCount: randInt(0, 200),
        shareCount: randInt(0, 500),
        publishedAt: randomDateInLast30Days(index, articlesData.length),
        createdBy: admin._id,
      }))
    );
    console.log(`✓ ${articles.length} articles created.`);

    // ── 4. Create Ad Settings ──
    const adSettings = await AdSettings.create({
      adFrequency: 5,
      maxAdsPerSession: 10,
      adStartPosition: 3,
      fullscreenAdFrequency: 15,
      isAdsEnabled: true,
    });
    console.log(`✓ Ad settings created.`);

    // ── 5. Create Advertisements ──
    const ads = await Advertisement.insertMany(
      advertisementsData.map((ad) => ({
        ...ad,
        createdBy: admin._id,
      }))
    );
    console.log(`✓ ${ads.length} advertisements created.`);

    // ── 6. Create Question Bank ──
    const quizMaster = await Admin.findOne({ role: 'quiz_master' });
    const questionBankData = [
      { questionText: 'How many Tirthankaras are there in Jainism?', options: [{ text: '12', isCorrect: false }, { text: '24', isCorrect: true }, { text: '36', isCorrect: false }, { text: '48', isCorrect: false }], category: 'philosophy', difficulty: 'easy' as const, marks: 10 },
      { questionText: 'Who was the first Tirthankara?', options: [{ text: 'Mahavira', isCorrect: false }, { text: 'Parshvanatha', isCorrect: false }, { text: 'Rishabhanatha', isCorrect: true }, { text: 'Neminatha', isCorrect: false }], category: 'history', difficulty: 'easy' as const, marks: 10 },
      { questionText: 'What is "Ahimsa" in Jain philosophy?', options: [{ text: 'Truth', isCorrect: false }, { text: 'Non-violence', isCorrect: true }, { text: 'Non-stealing', isCorrect: false }, { text: 'Non-attachment', isCorrect: false }], category: 'philosophy', difficulty: 'easy' as const, marks: 10 },
      { questionText: 'Which festival marks the birth of Lord Mahavira?', options: [{ text: 'Diwali', isCorrect: false }, { text: 'Paryushana', isCorrect: false }, { text: 'Mahavir Jayanti', isCorrect: true }, { text: 'Akshaya Tritiya', isCorrect: false }], category: 'festivals', difficulty: 'easy' as const, marks: 10 },
      { questionText: 'How many main vows (Mahavratas) do Jain monks follow?', options: [{ text: '3', isCorrect: false }, { text: '5', isCorrect: true }, { text: '7', isCorrect: false }, { text: '10', isCorrect: false }], category: 'philosophy', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'What is the Jain concept of "Anekantavada"?', options: [{ text: 'Non-violence', isCorrect: false }, { text: 'Many-sidedness of truth', isCorrect: true }, { text: 'Non-attachment', isCorrect: false }, { text: 'Karma theory', isCorrect: false }], category: 'philosophy', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'Which hill is home to the Palitana temples?', options: [{ text: 'Girnar', isCorrect: false }, { text: 'Shatrunjaya', isCorrect: true }, { text: 'Mount Abu', isCorrect: false }, { text: 'Parasnath', isCorrect: false }], category: 'geography', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'Who was the 23rd Tirthankara?', options: [{ text: 'Mahavira', isCorrect: false }, { text: 'Neminatha', isCorrect: false }, { text: 'Parshvanatha', isCorrect: true }, { text: 'Adinatha', isCorrect: false }], category: 'history', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'What is "Samayika" in Jain practice?', options: [{ text: 'Fasting', isCorrect: false }, { text: 'Meditation of equanimity', isCorrect: true }, { text: 'Pilgrimage', isCorrect: false }, { text: 'Charity', isCorrect: false }], category: 'philosophy', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'What is "Paryushana" in Jainism?', options: [{ text: 'A fasting festival', isCorrect: true }, { text: 'A pilgrimage site', isCorrect: false }, { text: 'A scripture', isCorrect: false }, { text: 'A ritual', isCorrect: false }], category: 'festivals', difficulty: 'easy' as const, marks: 10 },
      { questionText: 'What language are the Jain Agamas written in?', options: [{ text: 'Sanskrit', isCorrect: false }, { text: 'Pali', isCorrect: false }, { text: 'Ardhamagadhi Prakrit', isCorrect: true }, { text: 'Hindi', isCorrect: false }], category: 'history', difficulty: 'hard' as const, marks: 10 },
      { questionText: 'What is the Jain symbol of the swastika represent?', options: [{ text: 'Four states of existence', isCorrect: true }, { text: 'Four Tirthankaras', isCorrect: false }, { text: 'Four elements', isCorrect: false }, { text: 'Four vows', isCorrect: false }], category: 'philosophy', difficulty: 'hard' as const, marks: 10 },
      { questionText: 'In which state is the Dilwara temple complex located?', options: [{ text: 'Gujarat', isCorrect: false }, { text: 'Rajasthan', isCorrect: true }, { text: 'Maharashtra', isCorrect: false }, { text: 'Madhya Pradesh', isCorrect: false }], category: 'geography', difficulty: 'easy' as const, marks: 10 },
      { questionText: 'What is "Sallekhana" in Jainism?', options: [{ text: 'A type of meditation', isCorrect: false }, { text: 'Voluntary fasting unto death', isCorrect: true }, { text: 'A festival', isCorrect: false }, { text: 'A temple ritual', isCorrect: false }], category: 'philosophy', difficulty: 'hard' as const, marks: 10 },
      { questionText: 'How many Namokar Mantra padas (sections) are there?', options: [{ text: '3', isCorrect: false }, { text: '5', isCorrect: true }, { text: '7', isCorrect: false }, { text: '9', isCorrect: false }], category: 'philosophy', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'Which Tirthankara is associated with the lion symbol?', options: [{ text: 'Rishabhanatha', isCorrect: false }, { text: 'Mahavira', isCorrect: true }, { text: 'Parshvanatha', isCorrect: false }, { text: 'Neminatha', isCorrect: false }], category: 'history', difficulty: 'hard' as const, marks: 10 },
      { questionText: 'What is the highest state of the soul in Jainism?', options: [{ text: 'Nirvana', isCorrect: false }, { text: 'Moksha/Siddha', isCorrect: true }, { text: 'Samadhi', isCorrect: false }, { text: 'Devlok', isCorrect: false }], category: 'philosophy', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'Jain Diwali celebrates which event?', options: [{ text: 'Birth of Mahavira', isCorrect: false }, { text: 'Nirvana of Mahavira', isCorrect: true }, { text: 'Victory over evil', isCorrect: false }, { text: 'New Year', isCorrect: false }], category: 'festivals', difficulty: 'medium' as const, marks: 10 },
      { questionText: 'What are the two main sects of Jainism?', options: [{ text: 'Theravada & Mahayana', isCorrect: false }, { text: 'Shvetambara & Digambara', isCorrect: true }, { text: 'Vaishnavism & Shaivism', isCorrect: false }, { text: 'Sthanakvasi & Terapanthi', isCorrect: false }], category: 'general', difficulty: 'easy' as const, marks: 10 },
      { questionText: 'What does "Aparigraha" mean in Jainism?', options: [{ text: 'Non-violence', isCorrect: false }, { text: 'Truthfulness', isCorrect: false }, { text: 'Non-possessiveness', isCorrect: true }, { text: 'Celibacy', isCorrect: false }], category: 'philosophy', difficulty: 'medium' as const, marks: 10 },
    ];

    const questionBank = await QuestionBank.insertMany(
      questionBankData.map(q => ({ ...q, createdBy: quizMaster?._id || admin._id }))
    );
    console.log(`✓ ${questionBank.length} questions added to question bank.`);

    // ── 8. Create Sample Quiz ──
    const sampleQuiz = await Quiz.create({
      title: 'Jainism Knowledge Quiz',
      description: 'Test your knowledge about Jain philosophy, history, and practices.',
      createdBy: quizMaster?._id || admin._id,
      status: 'draft',
      duration: 120,
      questionCount: 5,
      questionCategories: [],
      questionDifficulty: [],
      isActive: true,
      totalParticipants: 0,
    });
    console.log(`✓ Sample quiz created: ${sampleQuiz.title}`);

    // ── Summary ──
    console.log('\n========== Seed Summary ==========');
    console.log(`  Admins:         ${staffRoles.length + 1}`);
    console.log(`  Mobile User:    1`);
    console.log(`  Categories:     ${categories.length}`);
    console.log(`  Articles:       ${articles.length}`);
    console.log(`  Ad Settings:    1`);
    console.log(`  Advertisements: ${ads.length}`);
    console.log(`  Questions:      ${questionBank.length}`);
    console.log(`  Quizzes:        1`);
    console.log('==================================\n');

    console.log('Database seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
