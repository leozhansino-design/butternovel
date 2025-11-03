import Header from '../components/shared/Header'
import Footer from '../components/shared/Footer'
import FeaturedCarousel from '../components/front/FeaturedCarousel'
import CategorySection from '../components/front/CategorySection'

// Featured Books - 24本精选书籍（横向滚动展示）
const featuredBooks = [
  {
    id: 1,
    title: 'Betrayed and Reborn',
    slug: 'betrayed-and-reborn',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop',
    description: 'A tale of revenge and redemption',
    category: { name: 'Fantasy' }
  },
  {
    id: 2,
    title: 'Shadow Realm Chronicles',
    slug: 'shadow-realm-chronicles',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop',
    description: 'Master the darkness to save the light',
    category: { name: 'Fantasy' }
  },
  {
    id: 3,
    title: 'Love in Silicon Valley',
    slug: 'love-silicon-valley',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=300&h=450&fit=crop',
    description: 'Tech startup romance',
    category: { name: 'Romance' }
  },
  {
    id: 4,
    title: 'The Urban Cultivator',
    slug: 'urban-cultivator',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=450&fit=crop',
    description: 'Cultivation in the modern world',
    category: { name: 'Urban' }
  },
  {
    id: 5,
    title: 'Dragon Emperor Ascension',
    slug: 'dragon-emperor',
    coverImage: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=300&h=450&fit=crop',
    description: 'Rise of the supreme emperor',
    category: { name: 'Fantasy' }
  },
  {
    id: 6,
    title: 'System Master Returns',
    slug: 'system-master',
    coverImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=300&h=450&fit=crop',
    description: 'Reborn with a powerful system',
    category: { name: 'Urban' }
  },
  {
    id: 7,
    title: 'Forbidden Hearts',
    slug: 'forbidden-hearts',
    coverImage: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=300&h=450&fit=crop',
    description: 'A love that defies all odds',
    category: { name: 'Romance' }
  },
  {
    id: 8,
    title: 'Sword Saint Legend',
    slug: 'sword-saint',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop',
    description: 'Path to becoming a sword saint',
    category: { name: 'Fantasy' }
  },
  {
    id: 9,
    title: 'CEO\'s Secret Wife',
    slug: 'ceo-secret-wife',
    coverImage: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&h=450&fit=crop',
    description: 'Hidden marriage with a billionaire',
    category: { name: 'Romance' }
  },
  {
    id: 10,
    title: 'Medical Genius Rebirth',
    slug: 'medical-genius',
    coverImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=450&fit=crop',
    description: 'Second chance as a doctor',
    category: { name: 'Urban' }
  },
  {
    id: 11,
    title: 'Magic Academy Elite',
    slug: 'magic-academy',
    coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=450&fit=crop',
    description: 'Rise in the magical world',
    category: { name: 'Fantasy' }
  },
  {
    id: 12,
    title: 'Billionaire\'s Fake Fiancée',
    slug: 'fake-fiancee',
    coverImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&h=450&fit=crop',
    description: 'Contract marriage turns real',
    category: { name: 'Romance' }
  },
  {
    id: 13,
    title: 'The Last Immortal',
    slug: 'last-immortal',
    coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=450&fit=crop',
    description: 'Centuries of solitude end',
    category: { name: 'Fantasy' }
  },
  {
    id: 14,
    title: 'Tech Tycoon Reborn',
    slug: 'tech-tycoon',
    coverImage: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&h=450&fit=crop',
    description: 'Building an empire from scratch',
    category: { name: 'Urban' }
  },
  {
    id: 15,
    title: 'Destined Soulmates',
    slug: 'destined-soulmates',
    coverImage: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=300&h=450&fit=crop',
    description: 'Fated to be together',
    category: { name: 'Romance' }
  },
  {
    id: 16,
    title: 'Demon Slayer Chronicles',
    slug: 'demon-slayer',
    coverImage: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=300&h=450&fit=crop',
    description: 'Hunt the darkness',
    category: { name: 'Fantasy' }
  },
  {
    id: 17,
    title: 'Business Empire Builder',
    slug: 'business-empire',
    coverImage: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=300&h=450&fit=crop',
    description: 'From zero to billions',
    category: { name: 'Urban' }
  },
  {
    id: 18,
    title: 'Second Chance Romance',
    slug: 'second-chance',
    coverImage: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=300&h=450&fit=crop',
    description: 'Love finds a way back',
    category: { name: 'Romance' }
  },
  {
    id: 19,
    title: 'Martial Arts Master',
    slug: 'martial-master',
    coverImage: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=300&h=450&fit=crop',
    description: 'Peak of martial prowess',
    category: { name: 'Fantasy' }
  },
  {
    id: 20,
    title: 'The Hacker\'s Revenge',
    slug: 'hacker-revenge',
    coverImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&h=450&fit=crop',
    description: 'Digital warfare begins',
    category: { name: 'Urban' }
  },
  {
    id: 21,
    title: 'Playboy\'s True Love',
    slug: 'playboy-love',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=450&fit=crop',
    description: 'When a playboy falls hard',
    category: { name: 'Romance' }
  },
  {
    id: 22,
    title: 'Alchemy God Returns',
    slug: 'alchemy-god',
    coverImage: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=300&h=450&fit=crop',
    description: 'Master of all potions',
    category: { name: 'Fantasy' }
  },
  {
    id: 23,
    title: 'Investment Genius',
    slug: 'investment-genius',
    coverImage: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=300&h=450&fit=crop',
    description: 'Wall Street domination',
    category: { name: 'Urban' }
  },
  {
    id: 24,
    title: 'Forever Yours',
    slug: 'forever-yours',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop',
    description: 'An eternal love story',
    category: { name: 'Romance' }
  }
]

// Category Books - 分类展示用的书籍列表
const fantasyBooks = [
  {
    id: 1,
    title: 'Betrayed and Reborn: The Rise of the Fallen Hero',
    category: 'Fantasy',
    chapters: 45,
    likes: 2340,
    color: '#667eea'
  },
  {
    id: 2,
    title: 'Sword of Destiny: The Legendary Quest',
    category: 'Fantasy',
    chapters: 38,
    likes: 1890,
    color: '#f093fb'
  },
  {
    id: 3,
    title: 'Dragon Emperor: Rise to Power',
    category: 'Fantasy',
    chapters: 52,
    likes: 3120,
    color: '#4facfe'
  },
  {
    id: 4,
    title: 'Magic Academy Chronicles',
    category: 'Fantasy',
    chapters: 40,
    likes: 1650,
    color: '#43e97b'
  },
  {
    id: 5,
    title: 'The Last Summoner',
    category: 'Fantasy',
    chapters: 35,
    likes: 1420,
    color: '#fa709a'
  }
]

const urbanBooks = [
  {
    id: 6,
    title: 'The Urban Cultivator: City of Immortals',
    category: 'Urban',
    chapters: 48,
    likes: 2850,
    color: '#30cfd0'
  },
  {
    id: 7,
    title: 'System Master in Modern World',
    category: 'Urban',
    chapters: 42,
    likes: 2190,
    color: '#a890fe'
  },
  {
    id: 8,
    title: 'Billionaire Awakening',
    category: 'Urban',
    chapters: 36,
    likes: 1780,
    color: '#ff6b6b'
  },
  {
    id: 9,
    title: 'Tech Genius Rebirth',
    category: 'Urban',
    chapters: 44,
    likes: 2430,
    color: '#4ecdc4'
  },
  {
    id: 10,
    title: 'Medical Master Returns',
    category: 'Urban',
    chapters: 50,
    likes: 3010,
    color: '#95e1d3'
  }
]

const romanceBooks = [
  {
    id: 11,
    title: 'Love in the Shadows: A Forbidden Romance',
    category: 'Romance',
    chapters: 32,
    likes: 4120,
    color: '#f38181'
  },
  {
    id: 12,
    title: 'CEO\'s Secret Lover',
    category: 'Romance',
    chapters: 38,
    likes: 3890,
    color: '#aa96da'
  },
  {
    id: 13,
    title: 'Second Chance at Love',
    category: 'Romance',
    chapters: 30,
    likes: 2950,
    color: '#fcbad3'
  },
  {
    id: 14,
    title: 'The Playboy\'s Promise',
    category: 'Romance',
    chapters: 35,
    likes: 3210,
    color: '#ffffd2'
  },
  {
    id: 15,
    title: 'Destined Hearts',
    category: 'Romance',
    chapters: 40,
    likes: 4550,
    color: '#a8d8ea'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Carousel */}
        <section className="container mx-auto px-4 py-8 md:py-12">
          <FeaturedCarousel books={featuredBooks} />
        </section>

        {/* Categories Sections */}
        <div className="container mx-auto px-4 py-8">
          <CategorySection title="Fantasy" icon="🗡️" books={fantasyBooks} />
          <CategorySection title="Urban" icon="🏙️" books={urbanBooks} />
          <CategorySection title="Romance" icon="💕" books={romanceBooks} />
        </div>
      </main>

      <Footer />
    </div>
  )
}