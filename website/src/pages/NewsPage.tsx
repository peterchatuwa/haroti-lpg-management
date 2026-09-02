import { useState } from 'react';
import { Calendar, Tag } from 'lucide-react';
import { newsArticles } from '../data/news';

const categoryGradients: Record<string, string> = {
  announcement: 'from-haroti-forest to-haroti-leaf-bright',
  milestone: 'from-haroti-orange to-haroti-flame-hot',
  partnership: 'from-haroti-green to-green-600',
  expansion: 'from-purple-500 to-purple-600',
};

function formatContent(content: string) {
  return content.replace(/\*\*(.*?)\*\*/g, '$1');
}

export const NewsPage = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-haroti-paper">
      <section className="relative bg-gradient-to-r from-haroti-forest to-haroti-forest-deep text-white py-16 md:py-24">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">News & Updates</h1>
          <p className="text-xl md:text-2xl text-white/80">
            Latest announcements, milestones, and developments from Haroti Gas
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsArticles.map((article) => (
              <article
                key={article.id}
                className="bg-haroti-paper rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
              >
                <div
                  className={`h-48 bg-gradient-to-br ${categoryGradients[article.category] ?? 'from-haroti-forest to-haroti-leaf-bright'}`}
                />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 mb-3 text-sm text-haroti-muted">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>
                        {new Date(article.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag size={14} />
                      <span className="capitalize">{article.category}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-3">{article.title}</h3>
                  <p className="text-haroti-muted mb-4">{article.excerpt}</p>
                  {expandedId === article.id && (
                    <div className="text-haroti-ink/90 text-sm mb-4 whitespace-pre-line">
                      {formatContent(article.content)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                    className="text-haroti-orange font-semibold hover:text-haroti-flame-hot transition-colors mt-auto text-left"
                  >
                    {expandedId === article.id ? 'Show Less ↑' : 'Read More →'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-haroti-paper">
        <div className="container-custom max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-haroti-muted mb-8">
            Subscribe to our newsletter for the latest news and updates
          </p>
          <form className="flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-haroti-muted/30 rounded-lg focus:ring-2 focus:ring-haroti-forest focus:border-transparent"
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
