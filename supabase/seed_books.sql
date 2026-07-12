-- ============================================================
-- Tabor Street Books — real catalog seed
-- Pulled from the actual shelf photo + verified against the Google Books API.
-- Run this in Supabase SQL Editor AFTER schema.sql has already been run.
--
-- A few of these (marked below) had no good Google Books match, so the
-- description was written from general knowledge instead of the API —
-- everything else is sourced directly from Google's data.
-- ============================================================

insert into books (title, author, description, cover_url, genre, dewey_decimal, status) values

('The Covenant of Water', 'Abraham Verghese',
 'Spanning 1900 to 1977, this epic novel follows three generations of a Christian family in Kerala, South India, that suffers a peculiar affliction: in every generation, at least one person dies by drowning. An Oprah Book Club pick from the author of Cutting for Stone.',
 'https://books.google.com/books/content?id=_MO5EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '813', 'available'),

('Loot', 'Tania James',
 'A historical novel set in the eighteenth century: a woodcarver apprenticed to build a giant mechanical tiger for Tipu Sultan finds his fate entangled with the tiger''s across two continents and fifty years of colonial upheaval.',
 'https://books.google.com/books/content?id=7Wr2EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '813', 'available'),

('A Suitable Boy', 'Vikram Seth',
 'A sprawling novel of post-independence India, following a mother''s search for a suitable husband for her daughter against the backdrop of a newly independent nation finding its footing.',
 'https://books.google.com/books/content?id=epXZAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Fiction', '823', 'available'),

('Interpreter of Maladies', 'Jhumpa Lahiri',
 'Pulitzer Prize-winning debut story collection charting the emotional journeys of Indian and Indian-American characters navigating cultural identity, marriage, and displacement.',
 'https://books.google.com/books/content?id=77zjnZnigdsC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '813', 'available'),

('The Yogas and Other Works', 'Swami Vivekananda',
 'A collected volume of Vivekananda''s foundational writings and lectures on Jnana-yoga, Bhakti-yoga, Karma-yoga, and Raja-yoga, including his famous Chicago addresses introducing Vedanta philosophy to the West.',
 'https://books.google.com/books/content?id=EsfWAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Philosophy & Religion', '181', 'available'),

('The Anarchy', 'William Dalrymple',
 'Tells the story of how the East India Company transformed itself from a trading corporation into an aggressive colonial power that conquered the Mughal Empire''s richest provinces — the first great multinational to become a state unto itself.',
 'https://books.google.com/books/content?id=HUMIEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '954', 'available'),

('The Last Mughal', 'William Dalrymple',
 'A portrait of Bahadur Shah Zafar II, the last Mughal emperor, and the destruction of the great Mughal capital of Delhi in the catastrophic uprising of 1857.',
 'https://books.google.com/books/content?id=FkPGn1JiqH0C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '954', 'available'),

('From Plassey to Partition and After', 'Sekhar Bandyopadhyay',
 'A widely used survey of modern Indian history, tracing the subcontinent from the East India Company''s victory at Plassey in 1757 through colonial rule to independence and partition in 1947. (No Google Books match found — description written from general knowledge.)',
 null, 'History', '954', 'available'),

('India''s Partition', 'Mushirul Hasan',
 'An Oxford India anthology collecting essays and firsthand accounts examining the causes, violence, and long shadow of the 1947 partition of British India. (Google Books match was unreliable for this academic title — description written from general knowledge.)',
 null, 'History', '954', 'available'),

('The Dawn of Everything', 'David Graeber & David Wengrow',
 'A sweeping reconsideration of human history that challenges the standard story of social evolution — from the origins of farming and cities to the roots of inequality — arguing early societies were far more experimental than we assume.',
 'https://books.google.com/books/content?id=9xkQEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Social Science', '306', 'available'),

('The Rule of Laws', 'Fernanda Pirie',
 'A 4,000-year global history of law, tracing how legal codes from Babylon to modern nation-states have been used both to control populations and to check the power of rulers.',
 'https://books.google.com/books/content?id=wkmdzgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Law', '340', 'available'),

('A History of the Arab Peoples', 'Albert Hourani',
 'A comprehensive history of Arab civilization spanning fourteen centuries, covering the great mosques, the achievements of Arab science, the role of women, and the Palestinian question.',
 'https://books.google.com/books/content?id=egbOb0mewz4C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '909', 'available'),

('Destiny Disrupted', 'Tamim Ansary',
 'A history of the world told from the perspective of Islamic civilization, from the life of Muhammad through the rise and fall of empires to the modern conflicts that culminated in 9/11.',
 'https://books.google.com/books/content?id=gzuIf2jJKxkC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '909', 'available'),

('Citizens', 'Simon Schama',
 'A chronicle of the French Revolution told through the private and public lives of the people who lived it, blending social, cultural, and political history.',
 'https://books.google.com/books/content?id=7fINAQAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'History', '944', 'available'),

('A Peace to End All Peace', 'David Fromkin',
 'Explains how the modern Middle East was created between 1914 and 1922, as European powers redrew the map of the former Ottoman Empire after World War I.',
 'https://books.google.com/books/content?id=LF0tvQEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'History', '956', 'available'),

('The March of Folly', 'Barbara W. Tuchman',
 'Examines four historic episodes of governments pursuing policies contrary to their own interests — from the Trojan War to Vietnam — to define the recurring pattern of political folly.',
 'https://books.google.com/books/content?id=Bv4XFx1l7xUC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '909', 'available'),

('The Warmth of Other Suns', 'Isabel Wilkerson',
 'A Pulitzer Prize winner''s definitive account of the Great Migration, telling the story of six million Black Americans who left the South for the North and West between World War I and 1970 through three unforgettable lives.',
 'https://books.google.com/books/content?id=i1qMDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '973', 'available'),

('The Half Has Never Been Told', 'Edward E. Baptist',
 'Argues that the expansion of slavery in the decades after independence was central to the rise of American capitalism, told through the testimonies of survivors and the records of plantations and politicians alike.',
 'https://books.google.com/books/content?id=dSrXCwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '973', 'available'),

('Drunk', 'Edward Slingerland',
 'A scientifically grounded look at why humans across history and cultures have sought intoxication, arguing that our taste for alcohol helped build trust and cooperation at the dawn of civilization.',
 'https://books.google.com/books/content?id=LxwBEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Psychology', '394', 'available'),

('The Exceptions', 'Kate Zernike',
 'The story of Nancy Hopkins and fifteen other women scientists at MIT who documented systemic gender discrimination in 1999, prompting the university''s historic admission of bias and sparking a national reckoning.',
 'https://books.google.com/books/content?id=iMV0EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Biography', '920', 'available'),

('The House of Government', 'Yuri Slezkine',
 'The true story of the residents of a vast Moscow apartment building where top Bolshevik officials and their families lived before being destroyed in Stalin''s purges — a sweeping saga of the Russian Revolution.',
 'https://books.google.com/books/content?id=U_KnDgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '947', 'available'),

('The Rise and Fall of Communism', 'Archie Brown',
 'A comprehensive history of Communism from its nineteenth-century roots through its twentieth-century expansion and eventual collapse across much of the world.',
 'https://books.google.com/books/content?id=yWQpAQAAIAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'History', '335', 'available'),

('Lenin''s Tomb', 'David Remnick',
 'A Pulitzer Prize-winning eyewitness account of the collapse of the Soviet Union, drawn from Remnick''s years as a Moscow correspondent and interviews spanning democratic activists to Politburo members.',
 'https://books.google.com/books/content?id=dEvoAgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '947', 'available'),

('America''s Unwritten Constitution', 'Akhil Reed Amar',
 'Argues that the written Constitution cannot be understood in isolation, and explores the precedents, practices, and founding texts that fill the gaps left by the document''s plain text.',
 'https://books.google.com/books/content?id=9AxjaKZrxZEC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Law', '342', 'available'),

('Remedy and Reaction', 'Paul Starr',
 'A history of America''s uniquely difficult path to health care reform, examining why policies that satisfied enough of the public also entrenched an industry resistant to change.',
 'https://books.google.com/books/content?id=EbCOAQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Political Science', '362', 'available'),

('The Social Transformation of American Medicine', 'Paul Starr',
 'Winner of the Pulitzer Prize, this landmark history traces how the American health care system of doctors, hospitals, and insurers evolved over two centuries into a dominant industry.',
 'https://books.google.com/books/content?id=FK4pBXGvQzoC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'History', '610', 'available'),

('Seeing Like a State', 'James C. Scott',
 'A landmark critique of top-down social engineering, examining why grand state planning schemes — from Soviet collectivization to forced villagization — so often fail catastrophically.',
 'https://books.google.com/books/content?id=Qe_RDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Political Science', '320', 'available'),

('The New Jim Crow', 'Michelle Alexander',
 'Argues that the War on Drugs and mass incarceration function as a system of racial control that has created a permanent under-caste in America, despite the formal end of Jim Crow laws.',
 'https://books.google.com/books/content?id=_SKbzXqmawoC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Social Science', '364', 'available'),

('The Death and Life of Great American Cities', 'Jane Jacobs',
 'A foundational critique of mid-century urban planning, arguing for the vitality of dense, mixed-use, pedestrian-scaled neighborhoods over top-down redevelopment.',
 'https://books.google.com/books/content?id=F4NHAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Architecture', '711', 'available'),

('The Working Poor', 'David K. Shipler',
 'An intimate portrait of American families working hard, honest jobs yet unable to escape poverty, exposing the interlocking failures of housing, health care, and education that trap them.',
 'https://books.google.com/books/content?id=3cpvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Social Science', '331', 'available'),

('Plagues and Peoples', 'William H. McNeill',
 'A pioneering history of humankind told through the lens of infectious disease, from smallpox in the conquest of Mexico to plague in medieval China.',
 'https://books.google.com/books/content?id=QnyPDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Science & History', '614', 'available'),

('Going Clear', 'Lawrence Wright',
 'A deeply reported investigation into the Church of Scientology, its founder L. Ron Hubbard, and the celebrities and true believers caught up in its secretive world.',
 'https://books.google.com/books/content?id=z4IDPV2hZL0C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Religion', '299', 'available'),

('My Own Words', 'Ruth Bader Ginsburg',
 'A collection of Justice Ginsburg''s own writings and speeches, spanning her legal career and her influence on law, women''s rights, and American culture.',
 'https://books.google.com/books/content?id=nXsmDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Biography', '921', 'available'),

('Human Compatible', 'Stuart Russell',
 'A leading AI researcher lays out a new framework for artificial intelligence — one designed to remain provably beneficial and correctable as machines become more capable than us.',
 'https://books.google.com/books/content?id=8vm0DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Technology', '006', 'available'),

('Gödel, Escher, Bach', 'Douglas R. Hofstadter',
 'A Pulitzer Prize-winning exploration of self-reference and meaning, weaving together the mathematics of Gödel, the art of Escher, and the music of Bach to probe the nature of the human mind.',
 'https://books.google.com/books/content?id=yeu2AAAAIAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Philosophy & Science', '003', 'available'),

('Pachinko', 'Min Jin Lee',
 'An epic following four generations of a Korean immigrant family in Japan, beginning with a young woman''s fateful pregnancy in 1911 and spanning eight decades of survival and identity.',
 'https://books.google.com/books/content?id=JsFMvgAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Fiction', '813', 'available'),

('The Tattooist of Auschwitz', 'Heather Morris',
 'Based on years of interviews with a real Holocaust survivor, this novel follows Lale Sokolov, forced to tattoo fellow prisoners at Auschwitz, and his love for a young woman named Gita.',
 'https://books.google.com/books/content?id=GrzIEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '823', 'available'),

('Dune', 'Frank Herbert',
 'On the desert planet Arrakis, Paul Atreides is thrust into a destiny beyond his understanding as rival powers battle for control of the universe''s most valuable resource. One of the bestselling science fiction novels of all time.',
 'http://books.google.com/books/content?id=nrRKDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Science Fiction', '813', 'available'),

('Brave New World', 'Aldous Huxley',
 'A chilling vision of a future society engineered for stability through genetic conditioning, consumerism, and the elimination of individuality — a landmark of dystopian fiction.',
 'https://books.google.com/books/content?id=3PabEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '823', 'available'),

('It Can''t Happen Here', 'Sinclair Lewis',
 'A cautionary tale about the fragility of democracy, imagining how fascism could take hold in America through a president who becomes a dictator in the name of restoring order.',
 'https://books.google.com/books/content?id=Ciq3V145opgC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '813', 'available'),

('Foundation', 'Isaac Asimov',
 'The first novel in Asimov''s classic saga: as a Galactic Empire crumbles, mathematician Hari Seldon establishes a foundation to preserve knowledge through thirty thousand years of coming chaos.',
 'https://books.google.com/books/content?id=EUPyAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Science Fiction', '813', 'available'),

('Foundation and Empire', 'Isaac Asimov',
 'The second novel in the Foundation series, following the Foundation''s confrontation with the remnants of the crumbling Galactic Empire and a mysterious new threat known as the Mule.',
 'https://books.google.com/books/content?id=0UFMEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Science Fiction', '813', 'available'),

('Ishmael', 'Daniel Quinn',
 'A telepathic gorilla named Ishmael takes on a human student to teach him why civilization is driving the world to ecological catastrophe, and what mythology might offer a way out.',
 null, 'Fiction', '813', 'available'),

('Oryx and Crake', 'Margaret Atwood',
 'Snowman, possibly the last human alive after a genetically engineered plague, recalls his friendship with the brilliant Crake and his love for Oryx in a story of unchecked genetic engineering.',
 'https://books.google.com/books/content?id=Wl_lvpiO11kC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Science Fiction', '813', 'available'),

('Crime and Punishment', 'Fyodor Dostoevsky',
 'Rodion Raskolnikov, an impoverished former student in St. Petersburg, murders a pawnbroker to test his theory that extraordinary people have the right to transgress moral law — and is undone by guilt.',
 null, 'Fiction', '891.73', 'available'),

('The Idiot', 'Fyodor Dostoevsky',
 'The Christ-like Prince Myshkin returns to Russia from a Swiss sanitarium and finds himself caught between two women, his honesty and goodness ultimately no match for the moral corruption around him.',
 null, 'Fiction', '891.73', 'available'),

('The Brothers Karamazov', 'Fyodor Dostoevsky',
 'Dostoevsky''s final novel: a story of murder and faith chronicling the bitter struggle between a father and his three sons, and one of the towering achievements of world literature.',
 'https://books.google.com/books/content?id=LNyEDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '891.73', 'available'),

('All That Man Is', 'David Szalay',
 'Nine interlinked stories trace nine men at different stages of life across contemporary Europe, forming a Booker Prize-shortlisted portrait of modern masculinity.',
 'https://books.google.com/books/content?id=YqfEDAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '823', 'available'),

('The House of God', 'Samuel Shem',
 'A raw, darkly comic novel about medical interns learning what it really takes to become a doctor — and, eventually, a good human being.',
 'https://books.google.com/books/content?id=_IiNEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Fiction', '813', 'available'),

('Prophet Song', 'Paul Lynch',
 'Winner of the 2023 Booker Prize: as Ireland slides into totalitarianism, a mother must decide how far she''ll go to protect her family after her husband is disappeared by the secret police.',
 'https://books.google.com/books/content?id=zSfAEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '823', 'available'),

('A Clockwork Orange', 'Anthony Burgess',
 'Told in inventive teen slang by Alex, a violent delinquent subjected to a brutal experimental "cure," this dystopian classic asks whether free will is worth its cost.',
 'https://books.google.com/books/content?id=bgpJn-Oq22MC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '823', 'available'),

('Septology', 'Jon Fosse',
 'Nobel laureate Jon Fosse''s hypnotic masterwork follows an aging painter reflecting on his life and his doppelgänger — another painter of the same name living a very different existence.',
 'https://books.google.com/books/content?id=vhOMEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '839.82', 'available'),

('Infinite Jest', 'David Foster Wallace',
 'A sprawling, genre-defying novel set at a tennis academy and a nearby addiction recovery house, exploring entertainment, addiction, and the pursuit of happiness in America.',
 null, 'Fiction', '813', 'available'),

('Peach Blossom Spring', 'Melissa Fu',
 'Three generations of a Chinese family search for home across decades of war and migration, carried by a hand-scroll of ancient fables passed from mother to son to granddaughter.',
 'https://books.google.com/books/content?id=EgsyEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '813', 'available'),

('First Lie Wins', 'Ashley Elston',
 'A stylish cat-and-mouse thriller about a woman living under a series of false identities, whose past finally starts catching up with her.',
 'https://books.google.com/books/content?id=3xPNzwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', 'Fiction', '813', 'available'),

('Untamed', 'Glennon Doyle',
 'A bestselling memoir about learning to stop striving to meet others'' expectations and start trusting the voice within — a galvanizing call to self-trust and reinvention.',
 'https://books.google.com/books/content?id=drXPDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Memoir', '158', 'available'),

('I Will Teach You to Be Rich', 'Ramit Sethi',
 'A practical, no-nonsense six-week program for automating your finances, crushing debt, and building wealth without giving up the things you love spending on.',
 'https://books.google.com/books/content?id=A-hrDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Personal Finance', '332', 'available'),

('The Gifts of Imperfection', 'Brené Brown',
 'A researcher of shame and vulnerability offers ten guideposts to "wholehearted" living, helping readers find the courage to accept their own imperfection.',
 null, 'Self-Help', '158', 'available'),

('The Heaven & Earth Grocery Store', 'James McBride',
 'When a skeleton is found at the bottom of a well in a Pennsylvania town, the long-held secrets of an immigrant Jewish and Black neighborhood come to light in this Library of Congress Prize-winning novel.',
 'https://books.google.com/books/content?id=OANjEQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Fiction', '813', 'available'),

('Tiny Beautiful Things', 'Cheryl Strayed',
 'A collection of the best "Dear Sugar" advice columns, offering wise, funny, and unflinchingly honest counsel on love, loss, and how to live.',
 'https://books.google.com/books/content?id=nRKaENKW-4YC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api', 'Essays', '814', 'available'),

('Aurangzeb', 'Audrey Truschke',
 'A concise historical reappraisal of the last great Mughal emperor, challenging popular myths about his reign and religious policies with a close reading of the primary sources. (Google Books had minimal data for this title — description written from general knowledge.)',
 null, 'History', '954', 'available');
