import { Calendar, Tag } from 'lucide-react';
import { newsArticles } from '../data/news';

export const NewsPage = () => {

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-haroti-blue to-blue-800 text-white py-16 md:py-24">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">News & Updates</h1>
          <p className="text-xl md:text-2xl text-blue-100">
            Latest announcements, milestones, and developments from Haroti Gas
          </p>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsArticles.map((article) => (
              <article key={article.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className={`h-48 bg-gradient-to-br ${
                  article.category === 'announcement' ? 'from-haroti-blue to-blue-600' :
                  article.category === 'milestone' ? 'from-haroti-orange to-orange-600' :
                  article.category === 'partnership' ? 'from-haroti-green to-green-600' :
                  'from-purple-500 to-purple-600'
                }`}></div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag size={14} />
                      <span className="capitalize">{article.category}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-3">{article.title}</h3>
                  <p className="text-gray-600 mb-4">{article.excerpt}</p>
                  <button className="text-haroti-orange font-semibold hover:text-orange-600 transition-colors">
                    Read More →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-600 mb-8">
            Subscribe to our newsletter for the latest news and updates
          </p>
          <form className="flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-haroti-blue focus:border-transparent"
            />
            <button type="submit" className="btn-primary">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
