const bookVisualsByKey = {
  'atomic habits': {
    image: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    fallbackImage: '/covers/atomic-habits.svg',
    rating: 4.7,
    reviewCount: 98,
    category: 'Self Help',
    language: 'English',
    featured: true,
    homeBadge: 'Bestseller'
  },
  ikigai: {
    image: 'https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg',
    fallbackImage: '/covers/ikigai.svg',
    rating: 4.6,
    reviewCount: 89,
    category: 'Self Help',
    language: 'English',
    featured: true,
  
  },
  'ponniyin selvan': {
    image: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1635910123i/59525602.jpg',
    fallbackImage: '/covers/ponniyin-selvan.svg',
    rating: 4.7,
    reviewCount: 122,
    category: 'Tamil Literature',
    language: 'Tamil',
    featured: true,
    newArrival: true,
    homeBadge: 'New'
  },
  'siru maatrangal periya vazhkai': {
    image: '/covers/siru-maatrangal.svg',
    fallbackImage: '/covers/siru-maatrangal.svg',
    rating: 4.6,
    reviewCount: 86,
    category: 'Self Help',
    language: 'Tamil',
    featured: true,
    homeBadge: 'Popular'
  },
  'the alchemist': {
    image: 'https://covers.openlibrary.org/b/id/15121528-L.jpg',
    fallbackImage: '/covers/alchemist.svg',
    rating: 4.6,
    reviewCount: 88,
    category: 'Fiction',
    language: 'English',
    featured: true,

  },
  'children books starter set': {
    image: '/covers/kutti-kathaigal.svg',
    rating: 4.6,
    reviewCount: 48,
    category: 'Children Books',
    language: 'Tamil'
  },
  'general knowledge 2026': {
    image: '/covers/general-knowledge.svg',
    rating: 4.4,
    reviewCount: 52,
    category: 'Competitive Exams',
    language: 'English'
  },
  'think like a monk': {
    image: '/covers/think-like-a-monk.svg',
    rating: 4.5,
    reviewCount: 60,
    category: 'Self Help',
    language: 'English'
  }
}

const authorPortraitByKey = {
  'kalki krishnamurthy': 'https://tamildigitallibrary.in/assets/docs/uploads/primary_files/author_bio_images/TVA_BIO_0009_%E0%AE%95%E0%AE%B2%E0%AF%8D%E0%AE%95%E0%AE%BF1.jpg',
  'paulo coelho': 'https://commons.wikimedia.org/wiki/Special:FilePath/Paulo%20Coelho%202007-04-09%20001.jpg?width=320',
  'james clear': 'https://images-na.ssl-images-amazon.com/images/S/amzn-author-media-prod/rec58e62v0epfogin4i1o6mu55.jpg',
  'hector garcia': 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts126/v4/23/c8/30/23c8305c-f912-3c7f-9e95-513df3186a1e/mza_12558583633289369001.png/1200x1200bf.webp',
  'jay shetty': 'https://www.caa.com/caaspeakers/partyHeadshot/jay-shetty.png',
  'r balakrishnan': 'https://media.assettype.com/deccanherald%2Fimport%2Fsites%2Fdh%2Ffiles%2Farticleimages%2F2021%2F09%2F19%2Ffile7hldjpj0noyraz83nbi-1031815-1632011401.jpg?auto=format%2Ccompress&fit=max&w=600',
  'r. balakrishnan': 'https://media.assettype.com/deccanherald%2Fimport%2Fsites%2Fdh%2Ffiles%2Farticleimages%2F2021%2F09%2F19%2Ffile7hldjpj0noyraz83nbi-1031815-1632011401.jpg?auto=format%2Ccompress&fit=max&w=600',
  'editorial team': '/covers/authors/editorial.svg'
}

export const demoBooks = [
  {
    id: 'demo-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    publisher: 'Penguin',
    description: 'A practical guide to building good habits and breaking bad ones.',
    stock: 18,
    available: true,
    featured: true,
    newArrival: false
  },
  {
    id: 'demo-2',
    title: 'Ikigai',
    author: 'Hector Garcia',
    publisher: 'Hutchinson',
    description: 'Ideas from Japanese culture about purpose, balance and a meaningful life.',
    stock: 24,
    available: true,
    featured: true,
    newArrival: false
  },
  {
    id: 'demo-3',
    title: 'Ponniyin Selvan',
    author: 'Kalki Krishnamurthy',
    publisher: 'Kalki Publications',
    description: 'A timeless Tamil historical novel set in the Chola period.',
    stock: 14,
    available: true,
    featured: true,
    newArrival: true
  },
  {
    id: 'demo-4',
    title: 'Siru Maatrangal Periya Vazhkai',
    author: 'R. Balakrishnan',
    publisher: 'Thulir Publications',
    description: 'Simple ideas about small changes that make everyday life better.',
    stock: 21,
    available: true,
    featured: true,
    newArrival: false
  },
  {
    id: 'demo-5',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    publisher: 'HarperCollins',
    description: 'A modern classic about dreams, courage and following your path.',
    stock: 19,
    available: true,
    featured: true,
    newArrival: false
  },
  {
    id: 'demo-6',
    title: 'General Knowledge 2026',
    author: 'Editorial Team',
    publisher: 'Bright Learning',
    description: 'Updated general knowledge reference for students and competitive exam learners.',
    stock: 40,
    available: true,
    featured: false,
    newArrival: false
  },
  {
    id: 'demo-7',
    title: 'Children Books Starter Set',
    author: 'Editorial Team',
    publisher: 'Little Readers',
    description: 'A colourful starter collection of children books.',
    stock: 16,
    available: true,
    featured: false,
    newArrival: false
  },
  {
    id: 'demo-8',
    title: 'Think Like a Monk',
    author: 'Jay Shetty',
    publisher: 'Simon & Schuster',
    description: 'Practical reflections on calm, purpose and mental clarity.',
    stock: 13,
    available: true,
    featured: false,
    newArrival: false
  }
].map(decorateBook)

export const demoOffers = [
  {
    id: 'offer-1',
    title: 'Great Books. Greater Journeys.',
    description: 'Get up to 30% OFF on selected titles.',
    badge: 'UP TO 30% OFF',
    active: true
  }
]

export const demoAuthors = [
  { id: 'author-1', name: 'Kalki Krishnamurthy', role: 'Novelist', language: 'Tamil', featured: true, displayOrder: 1, active: true },
  { id: 'author-2', name: 'Paulo Coelho', role: 'Novelist', language: 'English', featured: true, displayOrder: 2, active: true },
  { id: 'author-3', name: 'James Clear', role: 'Author', language: 'English', featured: true, displayOrder: 3, active: true },
  { id: 'author-4', name: 'Hector Garcia', role: 'Author', language: 'English', featured: true, displayOrder: 4, active: true },
  { id: 'author-5', name: 'Jay Shetty', role: 'Motivational Writer', language: 'English', featured: true, displayOrder: 5, active: true },
  { id: 'author-6', name: 'R. Balakrishnan', role: 'Author', language: 'Tamil', featured: true, displayOrder: 6, active: true }
].map(decorateAuthor)

export const homeCategories = [
  { name: 'Children Books', subtitle: 'For young readers', icon: '♙', color: 'peach' },
  { name: 'Competitive Exams', subtitle: 'Study. Prepare. Succeed.', icon: '▤', color: 'apricot' },
  { name: 'Fiction', subtitle: 'Stories for every soul', icon: '▥', color: 'blue' },
  { name: 'Self Help', subtitle: 'A better you', icon: '❧', color: 'green' },
  { name: 'Tamil Literature', subtitle: 'Roots of reading', icon: 'அ', color: 'purple' }
]

export function slugKey(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function decorateBook(book = {}) {
  const key = slugKey(book.title)
  const preset = bookVisualsByKey[key] || {}
  return {
    category: 'Books',
    language: 'English',
    rating: 4.5,
    reviewCount: 0,
    stock: 0,
    available: true,
    image: '/covers/atomic-habits.svg',
    ...preset,
    ...book,
    image: book.image || preset.image || '/covers/atomic-habits.svg',
    fallbackImage: book.fallbackImage || preset.fallbackImage || '/covers/atomic-habits.svg',
    // Prices come only from the backend; no hardcoded fallback may override them.
    price: Number(book.price ?? 0),
    originalPrice: Number(book.originalPrice ?? book.price ?? 0),
    rating: Number(book.rating || preset.rating || 0),
    reviewCount: Number(book.reviewCount || preset.reviewCount || 0),
    category: book.category || preset.category || 'Books',
    language: book.language || preset.language || 'English',
    featured: book.featured ?? preset.featured ?? false,
    newArrival: book.newArrival ?? preset.newArrival ?? false,
  }
}

export function decorateAuthor(author = {}) {
  const key = slugKey(author.name)
  return {
    role: 'Author',
    featured: false,
    active: true,
    ...author,
    image: author.image || authorPortraitByKey[key] || ''
  }
}

export function decorateBooks(rows = []) {
  return rows.map(decorateBook)
}

export function decorateAuthors(rows = []) {
  return rows.map(decorateAuthor)
}
